import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled ToggleButton for custom selected color
const CustomToggleButton = styled(ToggleButton)(({ theme }) => ({
  textAlign: 'center',
  flex: 0.18,
  '&.Mui-selected': {
    backgroundColor: '#1976D2',
    color: theme.palette.common.white, // White text for better contrast
    '&:hover': {
      backgroundColor: '#115293', // Darker shade for hover
    },
  },
  '&.Mui-selected:hover': {
    backgroundColor: '#115293', // Ensure hover color works when selected
  },
}));

const SummaryToggle = ({ currentView, onToggleChange }) => {
  const handleChange = (event, newView) => {
    if (newView !== null) {
      onToggleChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentView}
      exclusive
      onChange={handleChange}
      sx={{ mb: 3, display: 'flex'}}
    >
      <CustomToggleButton value="my-summaries">
        My Summaries
      </CustomToggleButton>
      <CustomToggleButton value="shared-summaries">
        Shared Summaries
      </CustomToggleButton>
    </ToggleButtonGroup>
  );
};

export default SummaryToggle;
