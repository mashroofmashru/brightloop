import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, InputAdornment, IconButton, CircularProgress, Stack
} from '@mui/material';
import { Eye, EyeOff, Lock, KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api';
import PasswordChecklist from '../../components/PasswordChecklist';
import { tokens } from '../../theme';

export default function ResetPasswordPage({ onNavigate, initialToken = '' }) {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isPasswordValid = (pwd) => {
    return pwd.length > 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[^a-zA-Z0-9]/.test(pwd);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('A valid reset token is required.');
      return;
    }

    if (!isPasswordValid(password)) {
      setError('Please fulfill all password requirements below.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setSubmitting(true);
      await authApi.resetPassword({ token: token.trim(), password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Link may be invalid or expired.');
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
          <Button
            variant="text"
            size="small"
            onClick={() => onNavigate('login')}
            startIcon={<ArrowLeft size={16} />}
            sx={{ mb: 2, p: 0, minWidth: 'auto', color: tokens.muted, '&:hover': { color: tokens.ink } }}
          >
            Back to login
          </Button>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h1" sx={{ fontSize: '22px', fontWeight: 700, mb: 0.5 }}>
              Set New Password
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Enter your reset token and choose a new, strong password.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {success ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Alert severity="success" sx={{ mb: 3, borderRadius: '8px', textAlign: 'left' }}>
                Your password has been reset successfully! You can now log in with your new credentials.
              </Alert>
              <Button
                variant="contained"
                onClick={() => onNavigate('login')}
                fullWidth
                sx={{ py: 1.25, backgroundColor: tokens.accent }}
              >
                Go to Login
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                    Reset Token *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Paste your reset token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyRound size={16} color={tokens.muted} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                    New Password *
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
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
                  <PasswordChecklist password={password} />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                    Confirm New Password *
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={16} color={tokens.muted} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting || !isPasswordValid(password) || !token}
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
                  {submitting ? 'Updating Password...' : 'Save New Password'}
                </Button>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
