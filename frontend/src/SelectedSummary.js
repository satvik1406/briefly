import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import { Download, InsertDriveFile } from '@mui/icons-material';
import { regenerateUserSummary, getInputFile } from './RequestService';

const SelectedSummary = ({ summary, onBack, onSummaryRegenerate }) => {
  const [isRegenerating, setIsRegenerating] = useState(false); // Track regenerate state
  const [feedback, setFeedback] = useState(''); // Store feedback from the user
  const [regenerating, setRegenerating] = useState(false); // Loading state for regeneration

  const handleRegenerateClick = () => {
    setIsRegenerating(true); // Show feedback box
  };

  const handleSubmitRegenerate = async () => {
    try {
        setRegenerating(true);
        const regenerateSummary = {
            summaryId: summary.id,
            feedback: feedback,
        };

        const regeneratedSummary = await regenerateUserSummary(regenerateSummary);
        onSummaryRegenerate(summary);
        setFeedback('');
        setIsRegenerating(false);
    } catch (error) {
        console.error('Error regenerating summary:', error);
    } finally {
        setRegenerating(false);
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

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>
                {summary.title || 'Untitled Summary'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Type: {summary.type || 'General'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Created At: {new Date(summary.createdAt).toLocaleString()}
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>
                Input Data:
            </Typography>
            {summary.uploadType === 'upload' ? (
                <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'grey.100',
                    p: 2,
                    borderRadius: 1,
                    cursor: 'pointer',
                }}
                onClick={handleFileDownload}
                >
                <InsertDriveFile sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="body1">
                    {summary.fileName || 'Uploaded File'}
                </Typography>
                <IconButton>
                    <Download sx={{ color: 'primary.main' }} />
                </IconButton>
                </Box>
            ) : (
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap', bgcolor: 'grey.100', p: 2 }}>
                {summary.initialData || 'No initial data available.'}
                </Typography>
            )}
            <Typography variant="h6" sx={{ mt: 2 }}>
                Output Data:
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap', bgcolor: 'grey.50', p: 2 }}>
                {summary.outputData || 'No content available for this summary.'}
            </Typography>

        {/* Feedback Text Field */}
        {isRegenerating && (
            <Box sx={{ mt: 3, mb: 2 }}>
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
                sx={{ mb: 2 }}
            />
            </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button variant="contained" color="primary" onClick={onBack}>
            Back
            </Button>
            {!isRegenerating ? (
            <Button variant="outlined" color="secondary" onClick={handleRegenerateClick}>
                Regenerate
            </Button>
            ) : (
            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmitRegenerate}
                disabled={regenerating || !feedback.trim()}
            >
                {regenerating ? 'Submitting...' : 'Submit'}
            </Button>
            )}
        </Box>
        </Box>
    );
    };

    export default SelectedSummary;
