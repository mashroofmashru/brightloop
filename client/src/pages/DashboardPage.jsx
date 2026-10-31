import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, Stack, Chip } from '@mui/material';
import {
  RefreshCw, TrendingUp, AlertCircle, Receipt, ArrowUpRight,
  ShieldCheck, Briefcase, Plus, Play, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function DashboardPage({ onNavigate }) {
  const { user, isAdmin, isStaff } = useAuth();

  const kpis = [
    {
      label: 'Active Subscriptions',
      value: '2',
      delta: '+12% from last month',
      icon: RefreshCw,
      color: tokens.status.success.text
    },
    {
      label: 'Billed Revenue (MTD)',
      value: '$3,806.50',
      delta: 'Target: $5,000.00',
      icon: TrendingUp,
      color: tokens.accent
    },
    {
      label: 'Outstanding Balance',
      value: '$2,024.00',
      delta: '1 invoice pending',
      icon: Receipt,
      color: tokens.status.warning.text
    },
    {
      label: 'Overdue Invoices',
      value: '1',
      delta: 'Chasing required',
      icon: AlertCircle,
      color: tokens.status.danger.text
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
          {isAdmin && (
            <Button
              variant="outlined"
              onClick={() => onNavigate('staff')}
              startIcon={<ShieldCheck size={16} />}
              sx={{ borderColor: tokens.line, color: tokens.ink }}
            >
              Staff Permissions
            </Button>
          )}
        </Stack>
      </Box>

      {/* KPI Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px', fontWeight: 500 }}>
                      {kpi.label}
                    </Typography>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        backgroundColor: tokens.canvas,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
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

      {/* Feature Readiness & Operations Quick Launch */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, mb: 0.5 }}>
                System Status & Phase Architecture
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted }}>
                Foundation & Role-Based Authentication is fully operational.
              </Typography>
            </Box>
            <Chip
              label="Phase 1 Active"
              size="small"
              sx={{
                backgroundColor: tokens.status.success.tint,
                color: tokens.status.success.text,
                fontWeight: 600,
                fontSize: '12px'
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  🔐 Strict Password Enforcement
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                  Live rules checklist (&gt;8 chars, uppercase, lowercase, special char) and duplicate email protection.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  👥 Three-Tier RBAC Architecture
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                  Admin (system controller), Internal Staff (day-to-day operations), and Customer (isolated portal).
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  ⚡ High-Performance SQLite
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>
                  WAL-mode ACID relational schema, seeded with Brightloop plans, Odoo variant (+560), and subscriptions.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
