import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from './App';
import { getUserSummaries, deleteUserSummary } from './RequestService'; // Import the delete function
import {Search, Add} from '@mui/icons-material';
import SummaryToggle from './SummaryToggle';

const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[6],
  },
}));

const SummariesList = ({onNewSummaryClick}) => {
  const { userData } = useAuth(); // Get user info from Auth context
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null); // State for the selected summary
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  
  const filteredSummaries = summaries.filter((summary) => {
    return (
      summary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      summary.outputData.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const response = await getUserSummaries(userData.id);
      if (response.status !== 'OK') {
        throw new Error('Failed to fetch summaries');
      }
      const data = response.result;
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: result is not an array');
      }
      setSummaries(data);
    } catch (err) {
      console.error('Error fetching summaries:', err);
      setError('Failed to load summaries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchSummaries();
    }
  }, [userData]);

  const handleDeleteSummary = async (summaryId) => {
    try {
      setDeleting(true);
      await deleteUserSummary(summaryId); // Call the delete function
      setSummaries((prev) => prev.filter((summary) => summary.id !== summaryId)); // Optimistically update UI
    } catch (err) {
      console.error('Error deleting summary:', err);
      setError('Failed to delete summary. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewSummary = (summary) => {
    setSelectedSummary(summary); // Set the selected summary for detailed view
  };

  const handleBackToList = () => {
    setSelectedSummary(null); // Go back to list view
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (selectedSummary) {
    // Render detailed view
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          {selectedSummary.title || 'Untitled Summary'}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Type: {selectedSummary.type || 'General'}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Created At: {new Date(selectedSummary.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Input Data:
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap', bgcolor: 'grey.100', p: 2 }}>
          {selectedSummary.initialData || 'No initial data available.'}
        </Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>
          Output Data:
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 2 }}>
          {selectedSummary.outputData || 'No content available for this summary.'}
        </Typography>
        <Button variant="contained" color="primary" sx={{ mt: 3 }} onClick={handleBackToList}>
          Back
        </Button>
      </Box>
    );
  }

  // Render list view
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Your Summaries
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search summaries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{
            width: '100%',
            maxWidth: '400px', // Limit width of the search bar
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
            },
          }}
        />
        <IconButton sx={{ ml: 1 }}>
          <Search />
        </IconButton>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          sx={{
            ml: 2,
            whiteSpace: 'nowrap',
            height: '40px',
          }}
          onClick={onNewSummaryClick}
        >
          New Summary
        </Button>
      </Box>

      <SummaryToggle onToggleChange={(view) => console.log('Selected View:', view)} />

      <Grid container spacing={4}>
        {filteredSummaries.map((summary) => (
          <Grid item xs={12} sm={6} md={4} key={summary.id}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {summary.title || 'Untitled Summary'}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {summary.type || 'General'} - {new Date(summary.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body1" sx={{ height: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {summary.outputData || 'No content available for this summary.'}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" color="primary" onClick={() => handleViewSummary(summary)}>
                  View
                </Button>
                <Button
                  size="small"
                  color="secondary"
                  onClick={() => handleDeleteSummary(summary.id)}
                  disabled={deleting} // Disable button while deleting
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </CardActions>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SummariesList;
