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
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from './App';
import { getUserSummaries, deleteUserSummary,shareSummary,getUserSharedSummaries } from './RequestService'; // Import the delete function

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
  const [sharingSummary, setSharingSummary] = useState(null); // State for sharing summary
  const [recipient, setRecipient] = useState(''); // Recipient email/username
  const [sharing, setSharing] = useState(false); // Sharing state
  const [errorMessage, setErrorMessage] = useState(""); 
  const [sharedSummaries, setSharedSummaries] = useState([]);


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

  const fetchSharedSummaries = async () => {
    try {
      setLoading(true);
      const response = await getUserSharedSummaries(userData.id);
      if (response.status !== 'OK') {
        throw new Error('Failed to fetch shared summaries');
      }
      const data = response.result;

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: result is not an array');
      }
      setSharedSummaries(data);
    } catch (err) {
      console.error('Error fetching shared summaries:', err);
      setError('Failed to load shared summaries. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchSummaries();
      fetchSharedSummaries();
      console.log("functions called");
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
  const handleShareSummary = (summary) => {
    setSharingSummary(summary); // Open the Share dialog
  };

  const handleSendShare = async () => {
    if (!recipient) {
      alert('Please enter a recipient email or username.');
      return;
    }

    try {
      setSharing(true);
      await shareSummary(sharingSummary.id, recipient); // Call the share API
      alert(`Summary shared successfully with ${recipient}`);
      setSharingSummary(null);
      setRecipient('');
    } catch (err) {
      console.log(err);
      console.error('Error sharing summary:', err);
      const errorMessage= err.detail ;
    
      setErrorMessage(errorMessage);
    } finally {
      setSharing(false);
    }
  };

  const handleViewSummary = (summary) => {
    setSelectedSummary(summary); // Open dialog with selected summary
  };

  const handleCloseDialog = () => {
    setSelectedSummary(null); // Close dialog
    setSharingSummary(null); // Close share dialog
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
        {/* Dropdown Filter */}

      <Grid container spacing={4}>
        {summaries.map((summary) => (
          <Grid item xs={12} sm={6} md={4} key={summary.id}>
            <StyledCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {summary.title || 'Untitled Summary'}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  {(Date(summary.createdAt).split(/[G]/))[0].split("-")}
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
                <Button size="small" color="primary" onClick={() => handleShareSummary(summary)}>
                  Share
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
              Created At: {(Date(selectedSummary.createdAt).split(/[G]/))[0].split("-")}
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
       {/* Dialog for Sharing Summary */}
       {sharingSummary && (
        <Dialog open={Boolean(sharingSummary)} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle>Share Summary</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Sharing: {sharingSummary.title || 'Untitled Summary'}
            </Typography>
            <TextField
              fullWidth
              label="Recipient Email or Username"
              variant="outlined"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              sx={{ mb: 2 }}
            />
             {/* Error Message */}
      {errorMessage && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {errorMessage}
        </Typography>
      )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSendShare} color="primary" disabled={sharing}>
              {sharing ? 'Sharing...' : 'Share'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SummariesList;
