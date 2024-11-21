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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from './App';
import { getUserSummaries, deleteUserSummary } from './RequestService'; // Import the delete function

const StyledCard = styled(Card)(({ theme }) => ({
  boxShadow: theme.shadows[3],
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: theme.shadows[6],
  },
}));

const SummariesList = () => {
  const { userData } = useAuth(); // Get user info from Auth context
  const [summaries, setSummaries] = useState([]);
  const [selectedSummary, setSelectedSummary] = useState(null); // State for the selected summary
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false); // Loading state for deletion

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
    setSelectedSummary(summary); // Open dialog with selected summary
  };

  const handleCloseDialog = () => {
    setSelectedSummary(null); // Close dialog
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

  if (!summaries.length) {
    return (
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="h6" color="textSecondary">
          No summaries found. Create a new summary to get started!
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Your Summaries
      </Typography>
      <Grid container spacing={4}>
        {summaries.map((summary) => (
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
                  {summary.content || 'No content available for this summary.'}
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

      {/* Dialog for Viewing Summary */}
      {selectedSummary && (
        <Dialog open={Boolean(selectedSummary)} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>{selectedSummary.title || 'Untitled Summary'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Type: {selectedSummary.type || 'General'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Created At: {new Date(selectedSummary.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>
              {selectedSummary.content || 'No content available.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SummariesList;
