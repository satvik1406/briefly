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

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const response = await getUserSummaries(userData.id);
        if (response.status !== "OK") {
          throw new Error('Failed to fetch summaries');
        }
        const data = response.result;
        setSummaries(data);
      } catch (error) {
        console.error('Error fetching summaries:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userData) {
      fetchSummaries();
    }
  }, [userData]);

  const handleNewSummary = async (newSummary) => {
    try {
      setOpenNewDialog(false);
      const response = await getUserSummaries(newSummary.userId);
      if (response.status !== "OK") {
        throw new Error('Failed to fetch summaries');
      }
      const data = response.result;
      setSummaries(data);

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