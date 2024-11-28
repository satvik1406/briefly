import React, { useState } from 'react';
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { styled } from '@mui/material/styles';

const SummaryToggle = ({ onToggleChange }) => {
    const [view, setView] = useState('my-summaries'); // Default selection
  
    const handleToggleChange = (event, newView) => {
      if (newView) {
        setView(newView);
        if (onToggleChange) onToggleChange(newView); // Trigger the callback
      }
    };
  
    return (
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, mb: 2}}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexShrink: 0 }}>
          View:
        </Typography>
        <StyledToggleButtonGroup
          exclusive
          value={view}
          onChange={handleToggleChange}
          sx={{ maxWidth: '300px', flexGrow: 1 }}
        >
          <ToggleButton value="my-summaries">My Summaries</ToggleButton>
          <ToggleButton value="shared-summaries">Shared Summaries</ToggleButton>
        </StyledToggleButtonGroup>
      </Box>
    );
  };
  
  // Styled ToggleButtonGroup for smaller buttons
  const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    '& .MuiToggleButton-root': {
      padding: theme.spacing(1), // Reduce padding for smaller buttons
      fontSize: '0.875rem', // Smaller font size
      borderRadius: '4px', // Keep square corners
      flex: 1, // Make buttons equally wide
      textTransform: 'none', // Prevent uppercase text
      '&.Mui-selected': {
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.common.white,
        borderColor: theme.palette.primary.dark,
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
        },
      },
    },
  }));
  

export default SummaryToggle;
