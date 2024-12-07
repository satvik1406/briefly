import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  Tooltip
} from '@mui/material';
import { Download, InsertDriveFile, Replay as ReplayIcon } from '@mui/icons-material';
import MarkdownRenderer from './MarkdownRenderer';
import { regenerateUserSummary, getInputFile } from './RequestService';
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Import the copy icon
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SelectedSummary = ({ summary, onBack, onSummaryRegenerate }) => {
  const [isRegenerating, setIsRegenerating] = useState(false); // Track regenerate state
  const [feedback, setFeedback] = useState(''); // Store feedback from the user
  const [regenerating, setRegenerating] = useState(false); // Loading state for regeneration
  const [isCopied, setIsCopied] = useState(false);

  const handleRegenerateClick = (e) => {
    setIsRegenerating((prevState) => !prevState); // Show feedback box
  };

  const handleSubmitRegenerate = async () => {
    try {
        setRegenerating(true);
        debugger;
        const regenerateSummary = {
            summaryId: summary.id,
            feedback: feedback,
        };

        await regenerateUserSummary(regenerateSummary);
        onSummaryRegenerate(summary);
        setFeedback('');
        setIsRegenerating(false);
    } catch (error) {
        console.error('Error regenerating summary:', error);
    } finally {
        setRegenerating(false);
    }
  };

    const handleCopyOutput = () => {
        if (summary.outputData) {
            navigator.clipboard.writeText(summary.outputData); // Copy the text to clipboard
            setIsCopied(true); // Show feedback
            setTimeout(() => setIsCopied(false), 2000); // Reset feedback after 2 seconds
        }
    };

    const handleFileDownload = async () => {
        try {
        // Backend endpoint to handle file downloads
            const blob = await getInputFile(summary.fileId);
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = summary.fileName || "downloaded_file"; // Set the file name for download
            document.body.appendChild(link);
            link.click();
        
            // Cleanup the temporary link
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    if (!summary) {
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
              No Summary Available
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Please select a summary to view its details.
            </Typography>
            <button onClick={onBack}>Back</button>
          </Box>
        );
      }

    return (
        <Box sx={{ p: 2 }}>
            <IconButton
                onClick={onBack}
                sx={{
                    color: 'primary.main',
                    '&:hover': {
                    backgroundColor: 'primary.light',
                    },
                    marginRight: 2,
                    mb: 2,
                    ml: -1
                }}
                >
                    <ArrowBackIcon sx={{ fontSize: 28 }} />
                </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h4" sx={{ wordWrap: 'break-word', flexGrow: 1 }}>
                    {summary.title || 'Untitled Summary'}
                </Typography>
            </Box>
      
          {/* Input Data Section */}
          <Typography variant="h6" sx={{ mt: 2, mb:2 }}>
            Input Data
          </Typography>
          {summary.uploadType === 'upload' ? (
            <Paper
                elevation={0}
                sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <InsertDriveFile sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '16px' }}>
                        {summary.fileName || 'Uploaded File'}
                    </Typography>
                </Box>
                <IconButton onClick={handleFileDownload}>
                    <Download sx={{ color: 'primary.main' }} />
                </IconButton>
            </Paper>
          ) : (
            <Paper
                elevation={0}
                sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: 'grey.100',
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: '300px',
                }}
            >
                <Typography 
                    variant="body1" 
                    sx={{ whiteSpace: 'pre-wrap', fontSize: '16px', textAlign: 'justify' }}
                >
                    {summary.initialData || 'No initial data available.'}
                </Typography>
            </Paper>
          )}
      
          {/* Output Data Section */}
          <Typography variant="h6" sx={{ mt: 2 }}>
            Output Data
          </Typography>
          <Paper
            elevation={0}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mt: 2,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                position: 'relative',
            }}
            >
                {/* Output Content */}
                <Box sx={{ 
                    flex: 1, 
                    textAlign: 'justify',
                    maxHeight: '400px', // Restrict the height
                    overflow: 'auto',
                }}>
                    <MarkdownRenderer content={summary.outputData || 'No content available.'} />
                </Box>

                <Box
                    sx={{
                    display: 'flex',
                    flexDirection: 'column', // Stack buttons vertically
                    alignItems: 'center',
                    ml: 2, // Add spacing from content
                    }}
                >
                    {/* Retry Button */}
                    <Tooltip title="Regenerate" arrow>
                    <IconButton
                        sx={{
                        color: 'secondary.main',
                        mb: 1, // Add margin between buttons
                        }}
                        onClick={handleRegenerateClick}
                    >
                        <ReplayIcon /> {/* Material-UI's Retry Icon */}
                    </IconButton>
                    </Tooltip>

                    {/* Copy Button */}
                    <Tooltip title={isCopied ? 'Copied!' : 'Copy to Clipboard'} arrow>
                    <IconButton
                        sx={{
                        color: 'primary.main',
                        }}
                        onClick={handleCopyOutput}
                    >
                        <ContentCopyIcon />
                    </IconButton>
                    </Tooltip>
                </Box>
            </Paper>
      
          {/* Feedback and Action Buttons */}
          {isRegenerating && (
            <Paper
                elevation={0}
                sx={{
                mt: 3,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                }}
            >
                <Typography variant="h6" sx={{ mb: 1 }}>
                    Feedback for Regeneration:
                </Typography>
                <TextField
                    multiline
                    rows={4}
                    placeholder="Provide feedback for regenerating this summary..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    fullWidth
                    variant="outlined"
                />
            </Paper>
          )}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {isRegenerating && 
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitRegenerate}
                disabled={regenerating || !feedback.trim()}
              >
                {regenerating ? 'Submitting...' : 'Submit'}
              </Button>
            }
          </Box>
        </Box>
      );     
    };

    export default SelectedSummary;
