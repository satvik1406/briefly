import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const SummaryContent = ({ selectedSummary }) => {
  return (
    <Box sx={{ padding: 3 }}>
      {selectedSummary ? (
        <Paper elevation={3} sx={{ padding: 2 }}>
          <Typography variant="h5">{selectedSummary.title}</Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedSummary.date}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {selectedSummary.content}
          </Typography>
        </Paper>
      ) : (
        <Typography variant="h6" color="textSecondary">
          Select a summary from the sidebar or create a new one.
        </Typography>
      )}
    </Box>
  );
};

export default SummaryContent;
