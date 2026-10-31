import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Stack, Chip, CircularProgress } from '@mui/material';
import {
  RefreshCw, TrendingUp, AlertCircle, Receipt, ArrowUpRight,
  ShieldCheck, Briefcase, Plus, Play, Sparkles, BarChart3
} from 'lucide-react';
import { analyticsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function DashboardPage({ onNavigate }) {
  const { user, isAdmin, isStaff } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(res => setData(res))
      .catch(err => console.error('Dashboard analytics error:', err))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      label: 'Active Subscriptions',
      value: data?.kpis?.active_subscriptions || '2',
      delta: `Run Rate: $${Number(data?.kpis?.mrr_estimate || 0).toFixed(2)}`,
      icon: RefreshCw,
      color: tokens.status.success.text,
      targetView: 'subscriptions'
    },
    {
      label: 'Collected Cash (Revenue)',
      value: `$${Number(data?.kpis?.total_collected || 0).toFixed(2)}`,
      delta: `Total Billed: $${Number(data?.kpis?.total_billed || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: tokens.accent,
      targetView: 'payments'
    },
    {
      label: 'Outstanding Balance (A/R)',
      value: `$${Number(data?.kpis?.outstanding_balance || 0).toFixed(2)}`,
      delta: 'Receivables due',
      icon: Receipt,
      color: tokens.status.warning.text,
      targetView: 'invoices'
    },
    {
      label: 'Overdue Invoices',
      value: data?.kpis?.overdue_invoices_count || '0',
      delta: `$${Number(data?.kpis?.overdue_invoices_amount || 0).toFixed(2)} to chase`,
      icon: AlertCircle,
      color: tokens.status.danger.text,
      targetView: 'reports'
    }
  ];

  return (
    <Box sx={{ p: 4 }}>
      {/* Top Welcome Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h1" sx={{ fontSize: '26px', fontWeight: 700 }}>
              Welcome back, {user?.name?.split(' ')[0]}
            </Typography>
            <StatusBadge status={user?.role} />
          </Box>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Brightloop Operations Console • Real-time recurring billing and revenue health
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => onNavigate('reports')}
            startIcon={<BarChart3 size={16} />}
            sx={{ borderColor: tokens.line, color: tokens.ink }}
          >
            Finance Reports
          </Button>

          <Button
            variant="contained"
            onClick={() => onNavigate('invoices')}
            startIcon={<Play size={16} />}
            sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
          >
            Billing Day Runner
          </Button>
        </Stack>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card
                onClick={() => onNavigate(kpi.targetView)}
                sx={{
                  border: `1px solid ${tokens.line}`,
                  borderRadius: '12px',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease',
                  '&:hover': { borderColor: tokens.ink }
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px', fontWeight: 500 }}>
                      {kpi.label}
                    </Typography>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={kpi.color} />
                    </Box>
                  </Box>

                  <Typography
                    variant="h2"
                    className="tabular-nums"
                    sx={{ fontSize: '28px', fontWeight: 600, color: tokens.ink, mb: 0.5 }}
                  >
                    {kpi.value}
                  </Typography>

                  <Typography variant="caption" sx={{ color: tokens.muted, fontSize: '12px' }}>
                    {kpi.delta}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Quick Operations Launch Grid */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card
            onClick={() => onNavigate('subscriptions')}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: `1px solid ${tokens.line}`,
              cursor: 'pointer',
              '&:hover': { borderColor: tokens.accent }
            }}
          >
            <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, mb: 0.5 }}>
              ⚡ Subscriptions & Quotes
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
              Create new offers, advance stage pipeline, and track active contracts.
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            onClick={() => onNavigate('payments')}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: `1px solid ${tokens.line}`,
              cursor: 'pointer',
              '&:hover': { borderColor: tokens.accent }
            }}
          >
            <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, mb: 0.5 }}>
              💳 Record Incoming Payment
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
              Reconcile wires, credit cards, or checks directly against invoices.
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            onClick={() => onNavigate('products')}
            sx={{
              p: 3,
              borderRadius: '12px',
              border: `1px solid ${tokens.line}`,
              cursor: 'pointer',
              '&:hover': { borderColor: tokens.accent }
            }}
          >
            <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, mb: 0.5 }}>
              📦 Products & Plan Builder
            </Typography>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
              Add software items, brand variant pricing (+560 Odoo), and billing cadences.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
