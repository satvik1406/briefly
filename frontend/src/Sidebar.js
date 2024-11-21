import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  Tooltip,
} from '@mui/material';
import { Add, Search, MoreVert, Share, Edit, Archive, Delete, Logout } from '@mui/icons-material';
import { useAuth } from './App';

const Sidebar = ({ summaries, onSummarySelect, onNewSummaryClick }) => {
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);

  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event, summaryId) => {
    setAnchorEl(event.currentTarget);
    setSelectedSummaryId(summaryId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSummaryId(null);
  };

  const filteredSummaries = summaries.filter((summary) =>
    summary.result.userId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      sx={{
        width: 300,
        height: '100vh',
        backgroundColor: '#f8f9fa',
        padding: 2,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Company Branding */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 3 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{
            width: 40,
            height: 40,
            backgroundColor: '#1976d2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: 20,
            fontWeight: 'bold',
            mr: 2,
          }}>
            B
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
            Briefly
          </Typography>
        </Box>
        <Tooltip title="Logout" arrow placement="bottom">
          <IconButton 
            onClick={logout}
            sx={{ 
              color: '#666',
              '&:hover': {
                color: '#1976d2',
              }
            }}
          >
            <Logout />
          </IconButton>
        </Tooltip>
      </Box>

      {/* New Summary Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        sx={{ mb: 3 }}
        onClick={onNewSummaryClick}
      >
        New Summary
      </Button>

      {/* Search Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search summaries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
            },
          }}
        />
        <IconButton>
          <Search />
        </IconButton>
      </Box>

      {/* Summaries List */}
      <List sx={{ overflowY: 'auto', flexGrow: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666', mb: 1 }}>
          Today
        </Typography>
        {filteredSummaries.map((summary) => (
          <ListItem
            key={summary.id}
            button
            onClick={() => onSummarySelect(summary.id)}
            sx={{
              borderRadius: 2,
              padding: 1,
              backgroundColor: summary.id === selectedSummaryId ? '#e3f2fd' : 'transparent',
              mb: 1,
              '&:hover': {
                backgroundColor: '#e3f2fd',
              },
            }}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="more"
                onClick={(e) => handleMenuOpen(e, summary.id)}
              >
                <MoreVert />
              </IconButton>
            }
          >
            <ListItemText
              primary={summary.type}
              secondary={summary.uploadType}
              primaryTypographyProps={{ fontWeight: 'bold', color: '#333' }}
              secondaryTypographyProps={{ color: '#666', fontSize: '0.8rem' }}
            />
          </ListItem>
        ))}
      </List>

      {/* Action Menu for Each Summary */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => alert(`Share summary ${selectedSummaryId}`)}>
          <ListItemIcon>
            <Share fontSize="small" />
          </ListItemIcon>
          Share
        </MenuItem>
        <MenuItem onClick={() => alert(`Rename summary ${selectedSummaryId}`)}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={() => alert(`Archive summary ${selectedSummaryId}`)}>
          <ListItemIcon>
            <Archive fontSize="small" />
          </ListItemIcon>
          Archive
        </MenuItem>
        <MenuItem onClick={() => alert(`Delete summary ${selectedSummaryId}`)} sx={{ color: 'red' }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Sidebar;
