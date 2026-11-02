import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, TextField, Stack,
  Alert, CircularProgress, Divider, InputAdornment, IconButton, Chip, Tooltip
} from '@mui/material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import VisibilityOffRoundedIcon from '@mui/icons-material/VisibilityOffRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../theme';

/**
 * Deterministic 8-digit hashed account number formatter
 */
export function formatHashedAccountId(user) {
  if (!user) return '—';
  if (user.account_id) return user.account_id;
  let hash = 2166136261;
  const str = `brightloop_account_${user.id || 0}_${user.email || ''}`;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  const num = (Math.abs(hash) % 90000000) + 10000000;
  return `#${num}`;
}

export default function CustomerProfilePage({ onNavigate }) {
  const { user, updateUser } = useAuth();

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [copiedId, setCopiedId] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Synchronize if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCompanyName(user.company_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Live password validation checklist
  const criteria = [
    { label: 'At least 8 characters long', valid: newPassword.length >= 8 },
    { label: 'Contains at least one uppercase letter (A-Z)', valid: /[A-Z]/.test(newPassword) },
    { label: 'Contains at least one lowercase letter (a-z)', valid: /[a-z]/.test(newPassword) },
    { label: 'Contains at least one number (0-9)', valid: /[0-9]/.test(newPassword) },
    { label: 'Contains a special character (!@#$%^&*)', valid: /[^A-Za-z0-9]/.test(newPassword) },
    { label: 'Passwords match', valid: newPassword.length > 0 && newPassword === confirmPassword }
  ];

  const isPasswordFormValid =
    currentPassword.length > 0 &&
    criteria.every((c) => c.valid);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Your full name cannot be blank.');
      return;
    }

    try {
      setSavingProfile(true);
      const res = await usersApi.updateProfile({
        name: name.trim(),
        company_name: companyName.trim(),
        phone: phone.trim()
      });
      updateUser(res.user);
      setProfileSuccess('Profile details successfully updated.');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile information.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!isPasswordFormValid) {
      setPasswordError('Please ensure all password security requirements are met.');
      return;
    }

    try {
      setSavingPassword(true);
      await usersApi.changePassword({
        currentPassword,
        newPassword
      });
      setPasswordSuccess('Your password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password. Check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1040, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
          <AccountCircleRoundedIcon sx={{ fontSize: 30, color: tokens.accent }} />
          <Typography variant="h1" sx={{ fontSize: '26px', fontWeight: 700 }}>
            Account Profile & Security
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: tokens.muted }}>
          Manage your organization profile, primary contact information, and security credentials.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Profile Information Form */}
        <Grid item xs={12} md={7}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <VerifiedUserRoundedIcon sx={{ fontSize: 22, color: tokens.accent }} />
                <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
                  Personal & Company Details
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
                These details appear on your issued invoices, billing receipts, and account statements.
              </Typography>

              {profileSuccess && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setProfileSuccess('')}>
                  {profileSuccess}
                </Alert>
              )}

              {profileError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setProfileError('')}>
                  {profileError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSaveProfile}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, display: 'block', mb: 0.75 }}>
                      Full Name *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountCircleRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, display: 'block', mb: 0.75 }}>
                      Email Address (Login ID)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      disabled
                      value={user?.email || ''}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Chip label="Verified" size="small" sx={{ backgroundColor: tokens.status.success.bg, color: tokens.status.success.text, fontWeight: 700, fontSize: '11px', height: 22 }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px', backgroundColor: tokens.canvas }
                      }}
                      helperText="Contact system administrators to request a primary login email update."
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, display: 'block', mb: 0.75 }}>
                      Company / Organization Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. TechCorp Solutions Inc."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, display: 'block', mb: 0.75 }}>
                      Phone Contact
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Box>

                  <Box sx={{ pt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={savingProfile}
                      startIcon={savingProfile ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveRoundedIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        backgroundColor: tokens.ink,
                        color: '#FFFFFF',
                        fontWeight: 600,
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: '#000000' }
                      }}
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Account Snapshot & Password Change */}
        <Grid item xs={12} md={5}>
          {/* Quick Account Snapshot */}
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, mb: 2 }}>
                Account Snapshot
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>Account Type</Typography>
                  <Chip label="Customer Portal" size="small" sx={{ backgroundColor: tokens.accent50, color: tokens.accent, fontWeight: 700, fontSize: '11px' }} />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>Account ID</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, letterSpacing: '0.5px' }} className="tabular-nums">
                      {formatHashedAccountId(user)}
                    </Typography>
                    <Tooltip title={copiedId ? 'Copied!' : 'Copy Account ID'}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const val = formatHashedAccountId(user).replace('#', '');
                          navigator.clipboard.writeText(val);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                        }}
                        sx={{ p: 0.25, color: copiedId ? tokens.status.success.text : tokens.muted }}
                      >
                        {copiedId ? <CheckRoundedIcon sx={{ fontSize: 14 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>Member Since</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.created_at ? user.created_at.split(' ')[0] : '2026'}</Typography>
                </Box>
              </Stack>

              <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${tokens.line}`, display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<AutorenewRoundedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => onNavigate && onNavigate('portal-subscriptions')}
                  sx={{ borderColor: tokens.line, color: tokens.ink, textTransform: 'none', fontSize: '12px', borderRadius: '8px' }}
                >
                  Subscriptions
                </Button>
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<ReceiptLongRoundedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => onNavigate && onNavigate('portal-invoices')}
                  sx={{ borderColor: tokens.line, color: tokens.ink, textTransform: 'none', fontSize: '12px', borderRadius: '8px' }}
                >
                  My Invoices
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <SecurityRoundedIcon sx={{ fontSize: 22, color: tokens.accent }} />
                <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
                  Security & Password
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
                Update your account password with enterprise-grade complexity.
              </Typography>

              {passwordSuccess && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setPasswordSuccess('')}>
                  {passwordSuccess}
                </Alert>
              )}

              {passwordError && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setPasswordError('')}>
                  {passwordError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSavePassword}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, display: 'block', mb: 0.75 }}>
                      Current Password *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter existing password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowCurrentPw(!showCurrentPw)} edge="end">
                              {showCurrentPw ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, display: 'block', mb: 0.75 }}>
                      New Password *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter strong new password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VpnKeyRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowNewPw(!showNewPw)} edge="end">
                              {showNewPw ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink, display: 'block', mb: 0.75 }}>
                      Confirm New Password *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VpnKeyRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowConfirmPw(!showConfirmPw)} edge="end">
                              {showConfirmPw ? <VisibilityOffRoundedIcon sx={{ fontSize: 18 }} /> : <VisibilityRoundedIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Box>

                  {/* Security Requirements Checklist */}
                  <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: tokens.canvas, mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: tokens.ink, display: 'block', mb: 1 }}>
                      Password Policy:
                    </Typography>
                    <Stack spacing={0.75}>
                      {criteria.map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.valid ? (
                            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: tokens.status.success.text }} />
                          ) : (
                            <CancelRoundedIcon sx={{ fontSize: 16, color: tokens.line }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '11.5px',
                              color: item.valid ? tokens.status.success.text : tokens.muted,
                              fontWeight: item.valid ? 600 : 400
                            }}
                          >
                            {item.label}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Box sx={{ pt: 1 }}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={savingPassword || !isPasswordFormValid}
                      startIcon={savingPassword ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <LockRoundedIcon sx={{ fontSize: 18 }} />}
                      sx={{
                        backgroundColor: tokens.accent,
                        color: '#FFFFFF',
                        fontWeight: 600,
                        textTransform: 'none',
                        py: 1,
                        borderRadius: '8px',
                        '&:hover': { backgroundColor: tokens.accent700 }
                      }}
                    >
                      {savingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
