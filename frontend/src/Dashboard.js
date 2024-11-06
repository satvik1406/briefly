import React, { useState, useEffect } from 'react';
import { Box, Container, CircularProgress } from '@mui/material';
import { useAuth } from './App';
import Sidebar from './Sidebar';
import SummaryContent from './SummaryContent';
import NewSummaryDialog from './NewSummary';
import { getUserSummaries } from './RequestService';

const Dashboard = () => {
  const { userData, loading: authLoading } = useAuth();
  const [summaries, setSummaries] = useState([]);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummaries = async () => {
      try {
        const response = await getUserSummaries(userData.id);
        
        if (!response.ok) {
          throw new Error('Failed to fetch summaries');
        }
        
        const data = await response.result.json();
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
      // Replace with your actual API endpoint
      const response = await fetch(`your-api-endpoint/summaries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify(newSummary)
      });

      if (!response.ok) {
        throw new Error('Failed to create summary');
      }

      const createdSummary = await response.json();
      setSummaries([...summaries, createdSummary]);
    } catch (error) {
      console.error('Error creating summary:', error);
      // Handle error appropriately
    }
  };

  const handleSummarySelect = (id) => {
    setSelectedSummaryId(id);
  };

  const handleDeleteSummary = async (id) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`your-api-endpoint/summaries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${userData.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete summary');
      }

      setSummaries(summaries.filter((summary) => summary.id !== id));
    } catch (error) {
      console.error('Error deleting summary:', error);
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

  const selectedSummary = summaries.find((summary) => summary.id === selectedSummaryId);

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh',
      bgcolor: 'grey.50'
    }}>
      <Sidebar
        summaries={summaries}
        onSummarySelect={handleSummarySelect}
        onNewSummaryClick={() => setOpenNewDialog(true)}
        userName={`${userData.firstName} ${userData.lastName}`}
      />

      <Container sx={{ flexGrow: 1, p: 3 }}>
        <SummaryContent 
          selectedSummary={selectedSummary}
          onDelete={handleDeleteSummary} 
        />
      </Container>

      <NewSummaryDialog
        open={openNewDialog}
        onClose={() => setOpenNewDialog(false)}
        onCreate={(summary) => {
          handleNewSummary(summary);
          setOpenNewDialog(false);
        }}
      />
    </Box>
  );
};

export default Dashboard;