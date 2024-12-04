import React, { useState, useEffect } from 'react';
import { Box, Container, CircularProgress } from '@mui/material';
import { useAuth } from './App';
import NewSummaryDialog from './NewSummary';
import SummariesList from './SummariesList';
import { getUserSummaries } from './RequestService';
import Navbar from './Navbar';

const Dashboard = () => {
  const { userData, loading: authLoading } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true); // Reset loading state
      try {
        const response = await getUserSummaries(userData.id);
        if (response.status !== "OK") {
          throw new Error('Failed to fetch summaries');
        }
        setSummaries(response.result);
      } catch (error) {
        console.error('Error fetching summaries:', error);
      } finally {
        setLoading(false); // Ensure loading resets
      }
    };
  
    if (userData) {
      fetchSummaries();
    }
  }, [userData, refreshKey]);

  const handleNewSummary = async (newSummary) => {
    try {
      setOpenNewDialog(false);
      debugger;
      setRefreshKey((prevKey) => prevKey + 1);
    } catch (error) {
      console.error('Error creating summary:', error);
      // Handle error appropriately
    }
  };

  if (authLoading || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          bgcolor: 'grey.50'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        bgcolor: 'grey.50'
      }}>
        <Container sx={{ flexGrow: 10, py: 4 }}>
          <SummariesList 
          summaries={summaries} 
          onNewSummaryClick={() => setOpenNewDialog(true)}
          />
        </Container>

        <NewSummaryDialog
          open={openNewDialog}
          onClose={() => setOpenNewDialog(false)}
          onCreate={(summary) => handleNewSummary(summary)}
        />
      </Box>
    </>
  );
};

export default Dashboard;