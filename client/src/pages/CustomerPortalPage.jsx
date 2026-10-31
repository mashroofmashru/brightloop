import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Stack } from '@mui/material';
import { RefreshCw, Receipt, Shield, Building, Mail, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function CustomerPortalPage({ onNavigate }) {
  const { user } = useAuth();

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 3 }}>
      {/* Customer Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700 }}>
            Welcome, {user?.name}
          </Typography>
          <StatusBadge status="active" customLabel="Account Active" />
        </Box>
        <Typography variant="body2" sx={{ color: tokens.muted }}>
          Self-Service Client Portal for {user?.company_name || 'Your Company'}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Account Profile Card */}
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
                    <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>Phone</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.phone || '—'}</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Portal Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, mb: 1 }}>
                Isolated Customer View
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted, mb: 3 }}>
                As a customer, you only ever see your own subscriptions, invoices, and billing history without needing to email support.
              </Typography>

              <Box sx={{ p: 2.5, borderRadius: '8px', backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  ✨ Self-Service Capabilities
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                  • View your active recurring subscription plans<br />
                  • Download PDF invoices and tax receipts<br />
                  • Direct payment settlement and subscription renewals
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
