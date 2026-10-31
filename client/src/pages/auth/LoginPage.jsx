import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, InputAdornment, IconButton, Divider, CircularProgress, Stack
} from '@mui/material';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tokens } from '../../theme';

export default function LoginPage({ onNavigate }) {
  const { login, switchRoleDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (role) => {
    try {
      setError('');
      setSubmitting(true);
      await switchRoleDemo(role);
    } catch (err) {
      setError(err.message || 'Demo login failed');
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
          maxWidth: 440,
          borderRadius: '16px',
          border: `1px solid ${tokens.line}`,
          backgroundColor: tokens.surface,
          p: 1
        }}
      >
        <CardContent sx={{ p: 3 }}>
          {/* Brand Heading */}
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
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Sign in to manage subscriptions, invoices, and billing operations.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                  Email Address *
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink }}>
                    Password *
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => onNavigate('forgot-password')}
                    sx={{ p: 0, minWidth: 'auto', fontSize: '12px', color: tokens.accent, fontWeight: 500 }}
                  >
                    Forgot password?
                  </Button>
                </Box>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting}
                endIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}
                sx={{
                  py: 1.25,
                  fontSize: '14px',
                  fontWeight: 600,
                  backgroundColor: tokens.accent,
                  '&:hover': { backgroundColor: tokens.accent600 }
                }}
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </Stack>
          </form>

          {/* Quick Demo Role Switches */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" sx={{ px: 1, color: tokens.muted, fontWeight: 500, letterSpacing: '0.02em' }}>
              DEMO 1-CLICK ROLE ACCESS
            </Typography>
          </Divider>

          <Stack spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickDemo('admin')}
              disabled={submitting}
              startIcon={<ShieldCheck size={16} color={tokens.status.danger.text} />}
              sx={{ justifyContent: 'flex-start', py: 0.8, fontSize: '13px' }}
            >
              Log in as <strong>&nbsp;Admin (Full Control)</strong>
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickDemo('staff')}
              disabled={submitting}
              startIcon={<Briefcase size={16} color={tokens.status.info.text} />}
              sx={{ justifyContent: 'flex-start', py: 0.8, fontSize: '13px' }}
            >
              Log in as <strong>&nbsp;Internal Staff (Operations)</strong>
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleQuickDemo('customer')}
              disabled={submitting}
              startIcon={<UserCheck size={16} color={tokens.status.success.text} />}
              sx={{ justifyContent: 'flex-start', py: 0.8, fontSize: '13px' }}
            >
              Log in as <strong>&nbsp;Customer (Client Portal)</strong>
            </Button>
          </Stack>

          <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${tokens.line}`, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
              Need an account?{' '}
              <Button
                variant="text"
                size="small"
                onClick={() => onNavigate('register')}
                sx={{ p: 0, minWidth: 'auto', fontWeight: 600, color: tokens.accent }}
              >
                Sign up
              </Button>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
