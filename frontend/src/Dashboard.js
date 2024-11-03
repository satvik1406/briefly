import React, { useState } from 'react';
import { Box, Container } from '@mui/material';
import Sidebar from './Sidebar';
import SummaryContent from './SummaryContent';
import NewSummaryDialog from './NewSummary';

const Dashboard = () => {
  const [summaries, setSummaries] = useState([
    { id: 1, title: 'React Dashboard Components', date: 'Today', content: 'Details about dashboard components' },
    { id: 2, title: 'Model Deprecation Error 해결', date: 'Today', content: 'Steps to resolve model deprecation error' },
    { id: 3, title: 'Django Import Error Troubleshooting', date: 'Yesterday', content: 'Troubleshooting tips for Django import errors' },
  ]);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);

  const handleNewSummary = (newSummary) => {
    setSummaries([...summaries, { ...newSummary, id: summaries.length + 1 }]);
  };

  const handleSummarySelect = (id) => {
    setSelectedSummaryId(id);
  };

  const handleDeleteSummary = (id) => {
    setSummaries(summaries.filter((summary) => summary.id !== id));
  };

  const selectedSummary = summaries.find((summary) => summary.id === selectedSummaryId);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        summaries={summaries}
        onSummarySelect={handleSummarySelect}
        onNewSummaryClick={() => setOpenNewDialog(true)}
      />

      <Container sx={{ flexGrow: 1 }}>
        <SummaryContent selectedSummary={selectedSummary} />
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
