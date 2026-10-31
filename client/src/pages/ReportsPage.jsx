import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Alert,
  CircularProgress, LinearProgress, Switch, FormControlLabel
} from '@mui/material';
import {
  TrendingUp, RefreshCw, AlertCircle, DollarSign, BarChart3,
  Receipt, ArrowUpRight, CheckCircle2, Table as TableIcon, Activity
} from 'lucide-react';
import { analyticsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [tableViewToggle, setTableViewToggle] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getDashboard();
      setData(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load executive reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={32} sx={{ color: tokens.accent }} />
      </Box>
    );
  }

  const kpis = [
    {
      label: 'Active Subscriptions',
      value: data?.kpis?.active_subscriptions || '0',
      subtext: `Est. Monthly Run Rate: $${Number(data?.kpis?.mrr_estimate || 0).toFixed(2)}`,
      icon: RefreshCw,
      color: tokens.status.success.text
    },
    {
      label: 'Collected Cash (Revenue)',
      value: `$${Number(data?.kpis?.total_collected || 0).toFixed(2)}`,
      subtext: `Total Invoiced: $${Number(data?.kpis?.total_billed || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: tokens.accent
    },
    {
      label: 'Outstanding Receivables (A/R)',
      value: `$${Number(data?.kpis?.outstanding_balance || 0).toFixed(2)}`,
      subtext: 'Pending collection',
      icon: Receipt,
      color: tokens.status.warning.text
    },
    {
      label: 'Overdue Invoices',
      value: data?.kpis?.overdue_invoices_count || '0',
      subtext: `$${Number(data?.kpis?.overdue_invoices_amount || 0).toFixed(2)} at risk`,
      icon: AlertCircle,
      color: tokens.status.danger.text
    }
  ];

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700, mb: 0.5 }}>
            Executive Finance Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Consolidated recurring revenue, collection aging, and overdue invoice chasing (&lt; 2s SLA).
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={tableViewToggle}
              onChange={(e) => setTableViewToggle(e.target.checked)}
              size="small"
            />
          }
          label={<Typography variant="body2" sx={{ fontSize: '13px' }}>Table View Toggle</Typography>}
        />
      </Box>

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {errorMsg}
        </Alert>
      )}

      {/* KPI Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
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
                    {kpi.subtext}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* REVENUE BY PLAN BREAKDOWN */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                  Recurring Revenue by Plan
                </Typography>
                <Chip label="Billed Breakdown" size="small" sx={{ fontSize: '11px', backgroundColor: tokens.canvas }} />
              </Box>

              <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px', mb: 2.5 }}>
                Distribution of monthly/yearly contract commitments across Brightloop product tiers.
              </Typography>

              <Stack spacing={2}>
                {data?.revenue_by_plan?.map((plan, i) => {
                  const total = data.kpis.mrr_estimate || 1;
                  const percent = Math.min(100, Math.round((plan.recurring_value / total) * 100));

                  return (
                    <Box key={i}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {plan.plan_name} ({plan.billing_interval})
                        </Typography>
                        <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700 }}>
                          ${Number(plan.recurring_value).toFixed(2)} ({plan.active_subscriptions} active)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: tokens.canvas200,
                          '& .MuiLinearProgress-bar': { backgroundColor: tokens.accent }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* INVOICE STATUS DISTRIBUTION */}
        <Grid item xs={12} md={6}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                  Invoice Lifecycle & Cash Pipeline Split
                </Typography>
                <Chip label="Status Split" size="small" sx={{ fontSize: '11px', backgroundColor: tokens.canvas }} />
              </Box>

              <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px', mb: 2.5 }}>
                Volume breakdown showing collected payments vs confirmed invoices currently due.
              </Typography>

              <Stack spacing={2}>
                {data?.status_split?.map((statusRow, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      borderRadius: '8px',
                      backgroundColor: tokens.canvas,
                      border: `1px solid ${tokens.line}`
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <StatusBadge status={statusRow.status} />
                      <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
                        {statusRow.count} invoices
                      </Typography>
                    </Box>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700, fontSize: '15px' }}>
                      ${Number(statusRow.total_volume).toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* OVERDUE INVOICES PRIORITY CHASING LIST */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${tokens.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                Aging Accounts Receivable: Overdue Invoices
              </Typography>
              <Chip
                label={`${data?.overdue_list?.length || 0} Needing Action`}
                size="small"
                sx={{ backgroundColor: tokens.status.danger.tint, color: tokens.status.danger.text, fontWeight: 700, fontSize: '11px' }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              "Which invoices are overdue? Chase outstanding balances before they turn into lost revenue."
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer / Company</TableCell>
                <TableCell>Contact Email</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Days Overdue</TableCell>
                <TableCell align="right">Amount Owed</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.overdue_list?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                    🎉 No overdue invoices! All active receivables are within terms.
                  </TableCell>
                </TableRow>
              ) : (
                data?.overdue_list?.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ fontWeight: 700 }} className="tabular-nums">
                      {row.invoice_number}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.customer_name}</Typography>
                      <Typography variant="caption" sx={{ color: tokens.muted }}>{row.customer_company}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: tokens.muted, fontSize: '13px' }}>
                      {row.customer_email}
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>
                      {row.due_date}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${Math.round(row.days_overdue)} days late`}
                        size="small"
                        sx={{
                          backgroundColor: tokens.status.danger.tint,
                          color: tokens.status.danger.text,
                          fontWeight: 700,
                          fontSize: '11px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 700, color: tokens.status.danger.text, fontSize: '15px' }}>
                      ${Number(row.amount_due).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="overdue" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
