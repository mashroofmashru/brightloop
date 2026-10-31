import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Alert, CircularProgress, Divider
} from '@mui/material';
import { RefreshCw, Receipt, Building, Mail, Phone, Pause, Play, CheckCircle } from 'lucide-react';
import { subscriptionsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LifecycleStepper from '../components/LifecycleStepper';
import { tokens } from '../theme';

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await subscriptionsApi.getAll();
      setSubscriptions(res.subscriptions || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load your subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleTogglePause = async (sub) => {
    const nextStatus = sub.status === 'paused' ? 'active' : 'paused';
    try {
      await subscriptionsApi.updateStatus(sub.id, { status: nextStatus });
      setSuccessToast(`Subscription ${sub.subscription_number} is now ${nextStatus}.`);
      fetchSubscriptions();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update subscription status');
    }
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Customer Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="h1" sx={{ fontSize: '26px', fontWeight: 700 }}>
            Welcome, {user?.name}
          </Typography>
          <StatusBadge status="active" customLabel="Account Verified" />
        </Box>
        <Typography variant="body2" sx={{ color: tokens.muted }}>
          Self-Service Portal for {user?.company_name || 'Client Account'} • View and manage your subscriptions without emailing support
        </Typography>
      </Box>

      {successToast && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setSuccessToast('')}>
          {successToast}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left: Account Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, mb: 2 }}>
                Account Information
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Mail size={16} color={tokens.muted} />
                  <Box>
                    <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.email}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Building size={16} color={tokens.muted} />
                  <Box>
                    <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>Company</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.company_name || '—'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Phone size={16} color={tokens.muted} />
                  <Box>
                    <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>Phone Contact</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.phone || '—'}</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Subscriptions List */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
                  My Subscriptions ({subscriptions.length})
                </Typography>
                <Chip
                  label="Isolated Portal Data"
                  size="small"
                  sx={{ backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}`, fontSize: '11px' }}
                />
              </Box>

              {loading ? (
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <CircularProgress size={24} sx={{ color: tokens.accent }} />
                </Box>
              ) : subscriptions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, color: tokens.muted }}>
                  <Typography variant="body2">You currently have no active subscriptions.</Typography>
                </Box>
              ) : (
                <Stack spacing={3}>
                  {subscriptions.map((sub) => (
                    <Box
                      key={sub.id}
                      sx={{
                        p: 2.5,
                        borderRadius: '10px',
                        border: `1px solid ${tokens.line}`,
                        backgroundColor: tokens.canvas
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Typography variant="h3" sx={{ fontSize: '17px', fontWeight: 700 }}>
                              {sub.subscription_number}
                            </Typography>
                            <StatusBadge status={sub.status} />
                          </Box>
                          <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
                            Plan: <strong>{sub.plan_name}</strong> • Billed {sub.billing_interval}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="h2" className="tabular-nums" sx={{ fontSize: '20px', fontWeight: 700, color: tokens.ink }}>
                            ${Number(sub.grand_total).toFixed(2)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>per {sub.billing_interval}</Typography>
                        </Box>
                      </Box>

                      {/* Stepper */}
                      <Box sx={{ my: 2, p: 1.5, borderRadius: '8px', backgroundColor: '#FFFFFF', border: `1px solid ${tokens.line}` }}>
                        <LifecycleStepper currentStatus={sub.status} />
                      </Box>

                      {/* Items */}
                      <Box sx={{ mb: 2 }}>
                        {sub.lines?.map((line) => (
                          <Box key={line.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '13px', color: tokens.ink }}>
                              {line.quantity}x {line.description}
                            </Typography>
                            <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600, fontSize: '13px' }}>
                              ${Number(line.line_total).toFixed(2)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* Self-service pause/resume actions */}
                      {sub.allow_pause === 1 && (sub.status === 'active' || sub.status === 'paused') && (
                        <Box sx={{ pt: 1.5, borderTop: `1px solid ${tokens.line}`, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={sub.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                            onClick={() => handleTogglePause(sub)}
                            sx={{
                              borderColor: sub.status === 'paused' ? tokens.status.success.text : tokens.status.warning.text,
                              color: sub.status === 'paused' ? tokens.status.success.text : tokens.status.warning.text,
                              fontSize: '12px'
                            }}
                          >
                            {sub.status === 'paused' ? 'Resume Subscription' : 'Pause Subscription'}
                          </Button>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
