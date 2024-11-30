import React from 'react';
import { AppBar, Toolbar, Typography, Box, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Logout } from '@mui/icons-material';
import { useAuth } from './App';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#1876D2', // Updated color
  boxShadow: theme.shadows[2],
}));

const Navbar = () => {
  const { logout } = useAuth();

  const handleRefresh = () => {
    window.location.href = '/dashboard'; // Force a full page reload
  };

  return (
    <StyledAppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              cursor: 'pointer',
              '&:hover': { color: 'lightgray' },
            }}
            onClick={handleRefresh} // Refresh page on click
          >
            Briefly
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Logout" arrow placement="bottom">
            <IconButton
              onClick={logout}
              sx={{
                color: 'white',
                '&:hover': {
                  color: 'lightgray'
                },
              }}
            >
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar;
