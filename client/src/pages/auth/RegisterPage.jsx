import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, InputAdornment, IconButton, CircularProgress, Stack
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, User, Building, Phone, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PasswordChecklist from '../../components/PasswordChecklist';
import { tokens } from '../../theme';

export default function RegisterPage({ onNavigate }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
    phone: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    // Clear inline error when typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isPasswordValid = (pwd) => {
    return pwd.length > 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[^a-zA-Z0-9]/.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!isPasswordValid(formData.password)) {
      errors.password = 'Please fulfill all password requirements below';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      await register(formData);
    } catch (err) {
      if (err.data?.field === 'email') {
        setFieldErrors({ email: err.data.error });
      } else {
        setGeneralError(err.message || 'Registration failed. Please check the form.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tokens.canvas,
        p: 3
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
          borderRadius: '16px',
          border: `1px solid ${tokens.line}`,
          backgroundColor: tokens.surface,
          p: 1
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  backgroundColor: tokens.ink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 16
                }}
              >
                B
              </Box>
              <Typography variant="h2" sx={{ fontSize: '20px', fontWeight: 700, color: tokens.ink }}>
                Brightloop
              </Typography>
            </Box>
            <Typography variant="h1" sx={{ fontSize: '22px', fontWeight: 700, mb: 0.5 }}>
              Create Customer Account
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Manage your software subscriptions, quotes, and billing directly.
            </Typography>
          </Box>

          {generalError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
              {generalError}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                  Full Name *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={handleChange('name')}
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name}
                  disabled={submitting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={16} color={tokens.muted} />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                  Work Email *
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="sarah@company.com"
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  disabled={submitting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail size={16} color={tokens.muted} />
                      </InputAdornment>
                    )
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                    Company Name
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Acme Corp"
                    value={formData.company_name}
                    onChange={handleChange('company_name')}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Building size={16} color={tokens.muted} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                    Phone Number
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange('phone')}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone size={16} color={tokens.muted} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                  Password *
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                  disabled={submitting}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={16} color={tokens.muted} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />

                {/* Live Password Rule Checklist */}
                <PasswordChecklist password={formData.password} />
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting || !isPasswordValid(formData.password)}
                endIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}
                sx={{
                  py: 1.25,
                  mt: 1,
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: tokens.accent,
                  '&:hover': { backgroundColor: tokens.accent600 }
                }}
              >
                {submitting ? 'Creating Account...' : 'Complete Registration'}
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${tokens.line}`, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
              Already registered?{' '}
              <Button
                variant="text"
                size="small"
                onClick={() => onNavigate('login')}
                sx={{ p: 0, minWidth: 'auto', fontWeight: 600, color: tokens.accent }}
              >
                Sign in
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
