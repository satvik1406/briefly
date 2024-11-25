import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Description, Code, Article, UploadFile } from '@mui/icons-material';
import { useAuth } from './App'; // Assuming useAuth is the context hook
import { createUserSummary, userSummaryUpload } from './RequestService';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: '1px solid #ddd',
    '&.Mui-selected': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.common.white,
      '&:hover': {
        backgroundColor: theme.palette.primary.dark,
      },
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}));

const StyledTextField = styled(TextField)({
  '& label.Mui-focused': {
    color: '#1976d2',
  },
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused fieldset': {
      borderColor: '#1976d2',
    },
  },
});

const FileUploadBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(2),
  textAlign: 'center',
  cursor: 'pointer',
  border: '2px dashed #1976d2',
  color: '#1976d2',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.3s ease',
  background: 'linear-gradient(135deg, #e3f2fd, #ffffff)',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    background: 'linear-gradient(135deg, #bbdefb, #e3f2fd)',
    color: '#1565c0',
    boxShadow: '0 6px 10px rgba(0, 0, 0, 0.15)',
  },
}));

const StyledUploadIcon = styled(UploadFile)(({ theme }) => ({
  fontSize: 64,
  color: theme.palette.primary.main,
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1)',
    color: theme.palette.primary.dark,
  },
}));


const NewSummaryDialog = ({ open, onClose, onCreateSuccess }) => {
  const { userData } = useAuth();
  const [summaryType, setSummaryType] = useState('');
  const [inputMethod, setInputMethod] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    setInputMethod('');
    setContent('');
    setFile(null);
  }, [summaryType]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleReset = () => {
    setSummaryType('');
    setInputMethod('');
    setContent('');
    setFile(null);
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  const handleTypeSelect = async () => {
    if (summaryType && inputMethod && (content || file)) {
      const newSummary = {
        'userId' : userData.id,
        'type': summaryType,
        'uploadType': inputMethod,
        'initialData': inputMethod === 'type' ? content : file,
      };

      debugger;

      try {
        var createdSummary;
        if(inputMethod == 'upload') {
          createdSummary = await userSummaryUpload(newSummary);
        } else {
          createdSummary = await createUserSummary(newSummary);
        }
      
        handleReset();
        onCreateSuccess(createdSummary);
        onClose();
      } catch (error) {
        console.error('Error creating summary:', error);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>Create New Summary</DialogTitle>
      <DialogContent>
        <StyledToggleButtonGroup
          exclusive
          value={summaryType}
          onChange={(e, newType) => setSummaryType(newType)}
          fullWidth
          sx={{ display: 'flex', justifyContent: 'space-between' }}
        >
          <ToggleButton value="code">
            <Code sx={{ mr: 1 }} /> Code
          </ToggleButton>
          <ToggleButton value="documentation">
            <Description sx={{ mr: 1 }} /> Documentation
          </ToggleButton>
          <ToggleButton value="research">
            <Article sx={{ mr: 1 }} /> Research Paper
          </ToggleButton>
        </StyledToggleButtonGroup>

        {summaryType && (
          <StyledToggleButtonGroup
            exclusive
            value={inputMethod}
            onChange={(e, newMethod) => setInputMethod(newMethod)}
            fullWidth
            sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}
          >
            <ToggleButton value="upload">
              <UploadFile sx={{ mr: 1 }} /> Upload File
            </ToggleButton>
            <ToggleButton value="type">Type/Paste Content</ToggleButton>
          </StyledToggleButtonGroup>
        )}

        {inputMethod === 'upload' && (
          <label htmlFor="file-upload">
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <FileUploadBox>
              <StyledUploadIcon />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1565c0' }}>
                {file ? file.name : 'Click to upload file'}
              </Typography>
              {!file && (
                <Typography variant="body2" color="textSecondary">
                  Supported formats: PDF, DOCX, TXT
                </Typography>
              )}
            </FileUploadBox>
          </label>
        )}

        {inputMethod === 'type' && (
          <StyledTextField
            fullWidth
            multiline
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type or paste content here..."
            variant="outlined"
            sx={{ mt: 2 }}
            InputProps={{
              sx: { resize: 'vertical' },
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">Cancel</Button>
        <Button onClick={handleTypeSelect} disabled={!summaryType || !inputMethod || (!content && !file)} color="primary">
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewSummaryDialog;
