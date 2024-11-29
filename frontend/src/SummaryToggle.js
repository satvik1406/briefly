import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

const SummaryToggle = ({ currentView, onToggleChange }) => {
  const handleChange = (event, newView) => {
    if (newView !== null) {  // Prevent deselection
      onToggleChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={currentView}  // Make sure this matches the values in the ToggleButtons
      exclusive
      onChange={handleChange}
      sx={{ mb: 3 }}
    >
      <ToggleButton value="my-summaries">
        My Summaries
      </ToggleButton>
      <ToggleButton value="shared-summaries">
        Shared Summaries
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default SummaryToggle;
