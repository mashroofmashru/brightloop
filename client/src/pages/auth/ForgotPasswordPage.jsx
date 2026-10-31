import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Alert, InputAdornment, CircularProgress, Stack
} from '@mui/material';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api';
import { tokens } from '../../theme';

export default function ForgotPasswordPage({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const res = await authApi.forgotPassword(email.trim());
      setSuccessInfo(res);
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset instructions.');
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
              Reset Your Password
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Enter your registered email address and we'll send you a secure password reset link.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
              {error}
            </Alert>
          )}

          {successInfo ? (
            <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: tokens.status.success.tint, border: `1px solid ${tokens.status.success.text}30` }}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <CheckCircle2 size={20} color={tokens.status.success.text} style={{ flexShrink: 0, marginTop: 2 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.status.success.text, mb: 0.5 }}>
                    Reset Link Dispatched
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '13px', color: tokens.ink, mb: 1.5 }}>
                    {successInfo.message}
                  </Typography>

                  {successInfo.debugToken && (
                    <Box sx={{ p: 1.5, borderRadius: '6px', backgroundColor: '#FFFFFF', border: `1px solid ${tokens.line}` }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: tokens.muted, mb: 0.5 }}>
                        SIMULATED EMAIL LINK (FOR LOCAL TESTING):
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => onNavigate('reset-password', { token: successInfo.debugToken })}
                        endIcon={<ArrowRight size={14} />}
                        sx={{ fontSize: '12px', py: 0.5 }}
                      >
                        Open Password Reset Form
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.75, fontWeight: 600, color: tokens.ink }}>
                    Account Email Address *
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
                  {submitting ? 'Sending Link...' : 'Send Reset Link'}
                </Button>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
