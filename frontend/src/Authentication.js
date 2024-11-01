import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Cancel,
  Email
} from '@mui/icons-material';

const AuthForms = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [validations, setValidations] = useState({
    email: true,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  const validateEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password) => {
    setValidations(prev => ({
      ...prev,
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }));
  }, []);

  useEffect(() => {
    if (formData.password) {
      validatePassword(formData.password);
    }
  }, [formData.password, validatePassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!isLogin && !Object.values(validations).every(v => v)) {
      setError('Please ensure all password requirements are met');
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'email') {
      setValidations(prev => ({
        ...prev,
        email: validateEmail(value)
      }));
    }
  }, [validateEmail]);

  const passwordRequirements = [
    { key: 'hasMinLength', text: 'At least 8 characters' },
    { key: 'hasUpperCase', text: 'One uppercase letter' },
    { key: 'hasLowerCase', text: 'One lowercase letter' },
    { key: 'hasNumber', text: 'One number' },
    { key: 'hasSpecialChar', text: 'One special character' }
  ];

  const handleToggleMode = useCallback(() => {
    setIsLogin(prev => !prev);
    setError('');
    setFormData({
      email: '',
      password: '',
      confirmPassword: ''
    });
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2 30%, #9c27b0 90%)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                mb: 2
              }}
            >
              Briefly
            </Typography>
            <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </Typography>
            <Typography color="text.secondary">
              {isLogin
                ? 'Sign in to continue to your account'
                : 'Join Briefly to start summarizing content'}
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <TextField
                fullWidth
                type="email"
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleInputChange}
                error={formData.email && !validations.email}
                helperText={formData.email && !validations.email ? 'Please enter a valid email address' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(prev => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {!isLogin && (
                <>
                  <TextField
                    fullWidth
                    type="password"
                    name="confirmPassword"
                    label="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />

                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Password Requirements:
                    </Typography>
                    <List dense disablePadding>
                      {passwordRequirements.map(({ key, text }) => (
                        <ListItem key={key} disableGutters>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            {validations[key] ? (
                              <CheckCircle color="success" sx={{ fontSize: 20 }} />
                            ) : (
                              <Cancel color="disabled" sx={{ fontSize: 20 }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={text}
                            primaryTypographyProps={{
                              color: validations[key] ? 'success.main' : 'text.secondary',
                              variant: 'body2'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </>
              )}

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>

              <Button
                color="primary"
                onClick={handleToggleMode}
                sx={{ mt: 1 }}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Sign in'}
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthForms;