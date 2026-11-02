import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stack, Chip,
  CircularProgress, LinearProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Tooltip
} from '@mui/material';
import {
  TrendingUpOutlined,
  AutorenewOutlined,
  MonetizationOnOutlined,
  ReceiptLongOutlined,
  WarningAmberOutlined,
  PeopleOutline,
  PaymentOutlined,
  Inventory2Outlined,
  LocalOfferOutlined,
  AccountBalanceWalletOutlined,
  PlayArrowOutlined,
  AssessmentOutlined,
  CheckCircleOutline,
  ScheduleOutlined,
  PauseCircleOutline,
  CancelOutlined,
  ArrowForwardOutlined,
  OpenInNewOutlined,
  HistoryOutlined
} from '@mui/icons-material';
import { analyticsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function DashboardPage({ onNavigate }) {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard()
      .then(res => setData(res))
      .catch(err => console.error('Dashboard analytics error:', err))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || {};

  const topMetricCards = [
    {
      label: 'Monthly Recurring Revenue',
      value: `$${Number(kpis.mrr || kpis.mrr_estimate || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      delta: `$${Number(kpis.arr || (kpis.mrr || 0) * 12).toLocaleString('en-US', { maximumFractionDigits: 0 })} ARR Run-rate`,
      pill: 'Annualized',
      icon: TrendingUpOutlined,
      color: tokens.accent,
      targetView: 'subscriptions'
    },
    {
      label: 'Active Subscriptions',
      value: `${kpis.active_subscriptions || 0}`,
      delta: 'Recurring live contracts',
      pill: 'Healthy',
      icon: AutorenewOutlined,
      color: tokens.status.success.text,
      targetView: 'subscriptions'
    },
    {
      label: 'Collected Cash (Gross)',
      value: `$${Number(kpis.total_collected || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      delta: `${kpis.collection_efficiency || 0}% collection efficiency`,
      pill: 'Realized',
      icon: MonetizationOnOutlined,
      color: tokens.status.success.text,
      targetView: 'payments'
    },
    {
      label: 'Outstanding Balance (A/R)',
      value: `$${Number(kpis.outstanding_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      delta: `${kpis.open_invoices_count || 0} invoices awaiting payment`,
      pill: 'Unsettled',
      icon: ReceiptLongOutlined,
      color: tokens.status.warning.text,
      targetView: 'invoices'
    },
    {
      label: 'Overdue Invoices at Risk',
      value: `${kpis.overdue_invoices_count || 0}`,
      delta: `$${Number(kpis.overdue_invoices_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} due • ~${kpis.avg_days_overdue || 0}d avg`,
      pill: 'High Priority',
      icon: WarningAmberOutlined,
      color: tokens.status.danger.text,
      targetView: 'invoices'
    },
    {
      label: 'Blended ARPU',
      value: `$${Number(kpis.arpu || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      delta: 'Avg monthly contract value',
      pill: 'Per Account',
      icon: PeopleOutline,
      color: tokens.ink,
      targetView: 'subscriptions'
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleOutline sx={{ fontSize: 15, color: tokens.status.success.text }} />;
      case 'quotation': return <ScheduleOutlined sx={{ fontSize: 15, color: tokens.status.info.text }} />;
      case 'paused': return <PauseCircleOutline sx={{ fontSize: 15, color: tokens.status.warning.text }} />;
      case 'closed': return <CancelOutlined sx={{ fontSize: 15, color: tokens.muted }} />;
      default: return <ScheduleOutlined sx={{ fontSize: 15, color: tokens.muted }} />;
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Top Welcome Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h1" sx={{ fontSize: '26px', fontWeight: 700 }}>
              Welcome back, {user?.name?.split(' ')[0]}
            </Typography>
            <StatusBadge status={user?.role} />
          </Box>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Brightloop Operations Console • Real-time recurring billing, accounts receivable, and revenue performance
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => onNavigate('reports')}
            startIcon={<AssessmentOutlined sx={{ fontSize: 18 }} />}
            sx={{ borderColor: tokens.line, color: tokens.ink, backgroundColor: tokens.surface }}
          >
            Financial Reports
          </Button>

          <Button
            variant="contained"
            onClick={() => onNavigate('invoices')}
            startIcon={<PlayArrowOutlined sx={{ fontSize: 18 }} />}
            sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
          >
            Billing Day Runner
          </Button>
        </Stack>
      </Box>

      {/* Row 1: 6 Executive Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {topMetricCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={idx}>
              <Card
                onClick={() => onNavigate(kpi.targetView)}
                sx={{
                  border: `1px solid ${tokens.line}`,
                  borderRadius: '12px',
                  height: '100%',
                  cursor: 'pointer',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease',
                  backgroundColor: tokens.surface,
                  '&:hover': { borderColor: tokens.ink, transform: 'translateY(-1px)' }
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.02em' }}>
                      {kpi.label}
                    </Typography>
                    <Box sx={{ width: 28, height: 28, borderRadius: '6px', backgroundColor: tokens.canvas, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon sx={{ fontSize: 16, color: kpi.color }} />
                    </Box>
                  </Box>

                  <Typography
                    variant="h2"
                    className="tabular-nums"
                    sx={{ fontSize: '24px', fontWeight: 700, color: tokens.ink, mb: 0.5, lineHeight: 1.2 }}
                  >
                    {kpi.value}
                  </Typography>
                </Box>

                <Box sx={{ pt: 1, borderTop: `1px solid ${tokens.canvas200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontSize: '11.5px', fontWeight: 500 }}>
                    {kpi.delta}
                  </Typography>
                  <Chip
                    label={kpi.pill}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: tokens.canvas,
                      color: tokens.muted
                    }}
                  />
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Row 2: Revenue Cadence Distribution & Subscription Lifecycle Funnel */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Left: Revenue Breakdown by Plan Cadence */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, border: `1px solid ${tokens.line}`, borderRadius: '12px', height: '100%', backgroundColor: tokens.surface }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                  Revenue by Recurring Plan
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Recurring monthly contribution by contract tier
                </Typography>
              </Box>
              <Button
                variant="text"
                size="small"
                onClick={() => onNavigate('products')}
                endIcon={<OpenInNewOutlined sx={{ fontSize: 14 }} />}
                sx={{ fontSize: '12px', color: tokens.accent, p: 0 }}
              >
                Plans Catalog
              </Button>
            </Box>

            <Stack spacing={2.25}>
              {(data?.revenue_by_plan || []).map((plan) => (
                <Box key={plan.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13.5px' }}>
                        {plan.plan_name}
                      </Typography>
                      <Chip
                        label={plan.billing_interval}
                        size="small"
                        sx={{ height: 18, fontSize: '10px', textTransform: 'capitalize', fontWeight: 600, backgroundColor: tokens.accent50, color: tokens.accent700 }}
                      />
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700, fontSize: '13.5px' }}>
                        ${Number(plan.recurring_value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Typography variant="caption" sx={{ color: tokens.muted, fontSize: '11px', display: 'block' }}>
                        {plan.active_subscriptions} active ({plan.percentage}%)
                      </Typography>
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={plan.percentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: tokens.canvas200,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: plan.percentage > 40 ? tokens.accent : tokens.accent600,
                        borderRadius: 3
                      }
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Right: Subscription Lifecycle Pipeline Funnel */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, border: `1px solid ${tokens.line}`, borderRadius: '12px', height: '100%', backgroundColor: tokens.surface }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Box>
                <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                  Subscription Pipeline & Lifecycle
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  Distribution of contracts across state machine transitions
                </Typography>
              </Box>
              <Button
                variant="text"
                size="small"
                onClick={() => onNavigate('subscriptions')}
                endIcon={<OpenInNewOutlined sx={{ fontSize: 14 }} />}
                sx={{ fontSize: '12px', color: tokens.accent, p: 0 }}
              >
                View Pipeline
              </Button>
            </Box>

            <Grid container spacing={1.5}>
              {(data?.lifecycle_distribution || []).map((st) => (
                <Grid item xs={6} sm={4} key={st.status}>
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: '8px',
                      border: `1px solid ${tokens.line}`,
                      backgroundColor: tokens.canvas,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {getStatusIcon(st.status)}
                        <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'capitalize', color: tokens.ink, fontSize: '12px' }}>
                          {st.status}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600 }}>
                        {st.percent}%
                      </Typography>
                    </Box>

                    <Typography variant="h3" className="tabular-nums" sx={{ fontSize: '20px', fontWeight: 700, mb: 0.25 }}>
                      {st.count}
                    </Typography>

                    <Typography variant="caption" className="tabular-nums" sx={{ color: tokens.muted, fontSize: '11px' }}>
                      ${Number(st.total_value).toLocaleString('en-US', { maximumFractionDigits: 0 })} value
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>

            {/* Collection Efficiency Banner */}
            <Box sx={{ mt: 2.5, p: 2, borderRadius: '8px', backgroundColor: tokens.accent50, border: `1px solid ${tokens.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: tokens.accent700 }}>
                  Billing Engine Health & Collection Efficiency
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.ink }}>
                  {kpis.collection_efficiency}% of total billed volume settled cleanly with 0 duplicate billing runs
                </Typography>
              </Box>
              <Chip
                label={`${kpis.collection_efficiency}% Collected`}
                size="small"
                sx={{ fontWeight: 700, backgroundColor: tokens.accent, color: '#FFFFFF' }}
              />
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Row 3: Actionable Overdue Invoices Chasing Watchlist */}
      <Card sx={{ mb: 3.5, border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden', backgroundColor: tokens.surface }}>
        <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${tokens.line}` }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                High-Priority Overdue Invoices Watchlist
              </Typography>
              <Chip
                label={`${(data?.overdue_list || []).length} Invoices`}
                size="small"
                sx={{ height: 20, fontSize: '11px', fontWeight: 700, backgroundColor: tokens.status.danger.tint, color: tokens.status.danger.text }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Invoices requiring immediate accounts receivable follow-up and settlement
            </Typography>
          </Box>

          <Button
            variant="text"
            size="small"
            onClick={() => onNavigate('invoices')}
            endIcon={<OpenInNewOutlined sx={{ fontSize: 14 }} />}
            sx={{ fontSize: '13px', color: tokens.accent }}
          >
            All Invoices
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: tokens.canvas }}>
                <TableCell>Invoice #</TableCell>
                <TableCell>Customer / Company</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Overdue Aging</TableCell>
                <TableCell align="right">Invoice Total</TableCell>
                <TableCell align="right">Amount Due</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.overdue_list || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: tokens.status.success.text }}>
                    🎉 No overdue invoices! All accounts receivable are currently up to date.
                  </TableCell>
                </TableRow>
              ) : (
                (data?.overdue_list || []).map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px' }}>
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{inv.customer_name}</Typography>
                      <Typography variant="caption" sx={{ color: tokens.muted }}>{inv.customer_company}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{inv.due_date}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${inv.days_overdue} days overdue`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: tokens.status.danger.tint,
                          color: tokens.status.danger.text
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" className="tabular-nums" sx={{ fontSize: '13.5px' }}>
                      ${Number(inv.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 700, fontSize: '14px', color: tokens.status.danger.text }}>
                      ${Number(inv.amount_due).toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onNavigate('invoices')}
                        sx={{
                          fontSize: '12px',
                          py: 0.5,
                          px: 1.5,
                          borderColor: tokens.line,
                          color: tokens.ink,
                          '&:hover': { backgroundColor: tokens.canvas }
                        }}
                      >
                        Chase & Reconcile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Row 4: Settlement Channels & Recent Financial Transactions */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Payment Channels Breakdown */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, border: `1px solid ${tokens.line}`, borderRadius: '12px', height: '100%', backgroundColor: tokens.surface }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <AccountBalanceWalletOutlined sx={{ fontSize: 20, color: tokens.ink }} />
              <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                Payment Methods Breakdown
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: tokens.muted, display: 'block', mb: 2.5 }}>
              Cash inflow volume by settlement channel
            </Typography>

            <Stack spacing={2}>
              {(data?.payment_methods || []).map((pm) => (
                <Box key={pm.method}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                      {pm.method.replace('_', ' ')}
                    </Typography>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700 }}>
                      ${Number(pm.total_volume).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pm.percentage}
                    sx={{
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: tokens.canvas200,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: tokens.status.success.text,
                        borderRadius: 2.5
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: tokens.muted, display: 'block', mt: 0.25, fontSize: '10.5px' }}>
                    {pm.count} transactions ({pm.percentage}%)
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>

        {/* Recent Financial Collections Feed */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, border: `1px solid ${tokens.line}`, borderRadius: '12px', height: '100%', backgroundColor: tokens.surface }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ReceiptLongOutlined sx={{ fontSize: 20, color: tokens.ink }} />
                <Box>
                  <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700 }}>
                    Recent Collections & Payment Activity
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                    Real-time audit stream of successfully reconciled payments
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="text"
                size="small"
                onClick={() => onNavigate('payments')}
                endIcon={<OpenInNewOutlined sx={{ fontSize: 14 }} />}
                sx={{ fontSize: '12px', color: tokens.accent, p: 0 }}
              >
                Payments Log
              </Button>
            </Box>

            <Stack spacing={1.5}>
              {(data?.recent_payments || []).map((pay) => (
                <Box
                  key={pay.id}
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    border: `1px solid ${tokens.line}`,
                    backgroundColor: tokens.canvas,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.status.success.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircleOutline sx={{ fontSize: 18, color: tokens.status.success.text }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {pay.customer_name} ({pay.customer_company})
                      </Typography>
                      <Typography variant="caption" sx={{ color: tokens.muted }}>
                        {pay.payment_number} • Applied to {pay.invoice_number} • {pay.payment_date}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700, color: tokens.status.success.text, fontSize: '14px' }}>
                      +${Number(pay.amount).toFixed(2)}
                    </Typography>
                    <Chip
                      label={pay.method.replace('_', ' ')}
                      size="small"
                      sx={{ height: 18, fontSize: '10px', textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Row 5: Quick Operations Launchers with Material UI Icons */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => onNavigate('subscriptions')}
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: `1px solid ${tokens.line}`,
              cursor: 'pointer',
              backgroundColor: tokens.surface,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: tokens.accent, transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.accent50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutorenewOutlined sx={{ fontSize: 18, color: tokens.accent }} />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700 }}>
                Subscriptions & Quotes
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '12.5px' }}>
              Create new proposals, advance pipeline, and track recurring terms.
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => onNavigate('payments')}
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: `1px solid ${tokens.line}`,
              cursor: 'pointer',
              backgroundColor: tokens.surface,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: tokens.accent, transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.status.success.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PaymentOutlined sx={{ fontSize: 18, color: tokens.status.success.text }} />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700 }}>
                Record Incoming Payment
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '12.5px' }}>
              Reconcile ACH wires, credit cards, or checks directly against invoices.
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => onNavigate('products')}
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: `1px solid ${tokens.line}`,
              cursor: 'pointer',
              backgroundColor: tokens.surface,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: tokens.accent, transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: `${tokens.accent700}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Inventory2Outlined sx={{ fontSize: 18, color: tokens.accent700 }} />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700 }}>
                Products & Plan Builder
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '12.5px' }}>
              Add software items, brand variant pricing (+560 Odoo), and cadences.
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            onClick={() => onNavigate('discounts')}
            sx={{
              p: 2.5,
              borderRadius: '12px',
              border: `1px solid ${tokens.line}`,
              cursor: 'pointer',
              backgroundColor: tokens.surface,
              transition: 'all 0.15s ease',
              '&:hover': { borderColor: tokens.accent, transform: 'translateY(-2px)' }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.status.warning.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LocalOfferOutlined sx={{ fontSize: 18, color: tokens.status.warning.text }} />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700 }}>
                Discounts & Promotions
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '12.5px' }}>
              Manage conditional volume rules, promo codes, and usage limits.
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
