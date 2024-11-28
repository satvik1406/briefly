import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button, IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Menu as MenuIcon, AccountCircle, Logout} from '@mui/icons-material';
import { useAuth } from './App';

// Styled AppBar for customization
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  boxShadow: theme.shadows[2],
}));

const Navbar = () => {
    const { logout } = useAuth();
    return (
        <StyledAppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
            {/* Left Section: Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                <MenuIcon />
            </IconButton> */}
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                Briefly
            </Typography>
            </Box>

            {/* Center Section: Navigation Links */}
            {/* <Box sx={{ display: 'flex', gap: 3 }}>
            <Button color="inherit">Home</Button>
            <Button color="inherit">About</Button>
            <Button color="inherit">Contact</Button>
            </Box> */}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title="Logout" arrow placement="bottom" sx={{ borderColor: 'white' }}>
                <IconButton 
                    onClick={logout}
                    sx={{ 
                    color: 'white',
                    '&:hover': {
                        color: 'black',
                    }
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