import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert, CircularProgress, Stack, IconButton,
  Chip, InputAdornment, Tooltip, Avatar, Tabs, Tab
} from '@mui/material';
import {
  Users, UserPlus, Search, Mail, Phone, Building2, CreditCard,
  RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight, Copy, Check,
  ExternalLink, FileText, X, Edit3, DollarSign
} from 'lucide-react';
import { usersApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function CustomersPage({ onNavigate }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // 360 Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [detailTab, setDetailTab] = useState(0);

  // Add Customer Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    company_name: '',
    phone: '',
    password: ''
  });

  // Edit Customer Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    company_name: '',
    phone: ''
  });

  // Copy Account ID feedback
  const [copiedId, setCopiedId] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await usersApi.getCustomers();
      setCustomers(res.customers || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleCopyAccount = (accountId) => {
    if (!accountId) return;
    navigator.clipboard.writeText(accountId);
    setCopiedId(accountId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDetail = async (customer) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailTab(0);
    try {
      const res = await usersApi.getCustomerDetails(customer.id);
      setSelectedCustomerDetail(res);
    } catch (err) {
      setErrorMsg('Failed to load full customer details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setEditForm({
      name: customer.name || '',
      company_name: customer.company_name || '',
      phone: customer.phone || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editForm.name.trim()) {
      setErrorMsg('Customer name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await usersApi.updateCustomer(editingCustomer.id, editForm);
      setSuccessToast('Customer updated successfully');
      setEditModalOpen(false);
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, ...res.customer } : c))
      );
      if (selectedCustomerDetail && selectedCustomerDetail.customer.id === editingCustomer.id) {
        setSelectedCustomerDetail((prev) => ({
          ...prev,
          customer: { ...prev.customer, ...res.customer }
        }));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      setErrorMsg('Name and email are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await usersApi.addCustomer(createForm);
      setSuccessToast(`Customer "${res.customer.name}" created successfully`);
      setCreateModalOpen(false);
      setCreateForm({ name: '', email: '', company_name: '', phone: '', password: '' });
      fetchCustomers();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalCustomers = customers.length;
  const activeSubscribers = customers.filter((c) => (c.active_subscriptions_count || 0) > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_paid || 0), 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstanding_balance || 0), 0);

  // Filtered List
  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.account_id || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'active') {
      return (c.active_subscriptions_count || 0) > 0;
    }
    if (statusFilter === 'inactive') {
      return (c.active_subscriptions_count || 0) === 0;
    }
    return true;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Toast Alert */}
      {successToast && (
        <Alert
          severity="success"
          onClose={() => setSuccessToast('')}
          sx={{ mb: 3, borderRadius: '8px', border: `1px solid ${tokens.status.success.tint}` }}
        >
          {successToast}
        </Alert>
      )}

      {errorMsg && (
        <Alert
          severity="error"
          onClose={() => setErrorMsg('')}
          sx={{ mb: 3, borderRadius: '8px' }}
        >
          {errorMsg}
        </Alert>
      )}

      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 3
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700, color: tokens.ink }}>
            Customers
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted, mt: 0.5 }}>
            Customer accounts, subscription relationships, lifetime spend, and billing profiles.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<UserPlus size={16} />}
          onClick={() => {
            setErrorMsg('');
            setCreateModalOpen(true);
          }}
          sx={{
            backgroundColor: tokens.accent,
            color: '#FFFFFF',
            fontWeight: 600,
            borderRadius: '8px',
            textTransform: 'none',
            px: 2.5,
            py: 1,
            '&:hover': { backgroundColor: tokens.accent600 }
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Customers
              </Typography>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.accent50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={16} color={tokens.accent} />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontSize: '26px', fontWeight: 700, mt: 1, color: tokens.ink }}>
              {totalCustomers}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted, mt: 0.5, display: 'block' }}>
              Registered customer accounts
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Active Subscribers
              </Typography>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.status.success.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={16} color={tokens.status.success.text} />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontSize: '26px', fontWeight: 700, mt: 1, color: tokens.ink }}>
              {activeSubscribers}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted, mt: 0.5, display: 'block' }}>
              {totalCustomers > 0 ? `${Math.round((activeSubscribers / totalCustomers) * 100)}% retention rate` : '0%'}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Lifetime Revenue
              </Typography>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.accent50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={16} color={tokens.accent} />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontSize: '26px', fontWeight: 700, mt: 1, color: tokens.ink }}>
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted, mt: 0.5, display: 'block' }}>
              Collected across all invoices
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', boxShadow: 'none' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Outstanding AR
              </Typography>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: tokens.status.warning.tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={16} color={tokens.status.warning.text} />
              </Box>
            </Box>
            <Typography variant="h3" sx={{ fontSize: '26px', fontWeight: 700, mt: 1, color: tokens.ink }}>
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted, mt: 0.5, display: 'block' }}>
              Unpaid / pending invoices
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters and Search Bar */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', boxShadow: 'none', mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('all')}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                backgroundColor: statusFilter === 'all' ? tokens.ink : 'transparent',
                borderColor: tokens.line,
                color: statusFilter === 'all' ? '#FFFFFF' : tokens.muted,
                '&:hover': {
                  backgroundColor: statusFilter === 'all' ? tokens.ink : tokens.canvas200,
                  borderColor: tokens.line
                }
              }}
            >
              All Customers ({customers.length})
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'active' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('active')}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                backgroundColor: statusFilter === 'active' ? tokens.status.success.text : 'transparent',
                borderColor: tokens.line,
                color: statusFilter === 'active' ? '#FFFFFF' : tokens.muted,
                '&:hover': {
                  backgroundColor: statusFilter === 'active' ? tokens.status.success.text : tokens.canvas200,
                  borderColor: tokens.line
                }
              }}
            >
              Active Subscribers ({activeSubscribers})
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'inactive' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('inactive')}
              sx={{
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: 'none',
                backgroundColor: statusFilter === 'inactive' ? tokens.muted : 'transparent',
                borderColor: tokens.line,
                color: statusFilter === 'inactive' ? '#FFFFFF' : tokens.muted,
                '&:hover': {
                  backgroundColor: statusFilter === 'inactive' ? tokens.muted : tokens.canvas200,
                  borderColor: tokens.line
                }
              }}
            >
              No Active Subscription ({customers.length - activeSubscribers})
            </Button>
          </Box>

          <TextField
            size="small"
            placeholder="Search by name, email, company, account ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color={tokens.muted} />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <X size={14} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{
              width: { xs: '100%', sm: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: tokens.canvas,
                '& fieldset': { borderColor: tokens.line }
              }
            }}
          />
        </Box>

        {/* Customer Table */}
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: tokens.canvas }}>
              <TableRow>
                <TableCell sx={{ color: tokens.muted, fontWeight: 600, fontSize: '12px' }}>CUSTOMER</TableCell>
                <TableCell sx={{ color: tokens.muted, fontWeight: 600, fontSize: '12px' }}>ACCOUNT ID</TableCell>
                <TableCell sx={{ color: tokens.muted, fontWeight: 600, fontSize: '12px' }}>CONTACT</TableCell>
                <TableCell sx={{ color: tokens.muted, fontWeight: 600, fontSize: '12px' }}>SUBSCRIPTIONS</TableCell>
                <TableCell sx={{ color: tokens.muted, fontWeight: 600, fontSize: '12px' }}>LIFETIME SPEND</TableCell>
                <TableCell sx={{ color: tokens.muted, fontWeight: 600, fontSize: '12px' }}>OUTSTANDING</TableCell>
                <TableCell align="right" sx={{ color: tokens.muted, fontWeight: 600, fontSize: '12px' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} sx={{ color: tokens.accent }} />
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      No customers found matching your criteria.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => {
                  const initial = (c.name || 'C').charAt(0).toUpperCase();
                  const hasActive = (c.active_subscriptions_count || 0) > 0;

                  return (
                    <TableRow key={c.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Customer Name & Company */}
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: '14px',
                              fontWeight: 700,
                              backgroundColor: tokens.ink,
                              color: '#FFFFFF'
                            }}
                          >
                            {initial}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: tokens.ink,
                                cursor: 'pointer',
                                '&:hover': { color: tokens.accent }
                              }}
                              onClick={() => handleOpenDetail(c)}
                            >
                              {c.name}
                            </Typography>
                            {c.company_name ? (
                              <Typography variant="caption" sx={{ color: tokens.muted, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Building2 size={12} /> {c.company_name}
                              </Typography>
                            ) : (
                              <Typography variant="caption" sx={{ color: tokens.muted }}>
                                Individual Customer
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Account ID with copy */}
                      <TableCell>
                        <Tooltip title="Click to copy Account ID">
                          <Chip
                            size="small"
                            label={c.account_id || `CUST-${c.id}`}
                            onClick={() => handleCopyAccount(c.account_id || `CUST-${c.id}`)}
                            icon={copiedId === (c.account_id || `CUST-${c.id}`) ? <Check size={12} color={tokens.status.success.text} /> : <Copy size={12} />}
                            sx={{
                              fontSize: '11px',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              backgroundColor: tokens.canvas,
                              border: `1px solid ${tokens.line}`,
                              cursor: 'pointer'
                            }}
                          />
                        </Tooltip>
                      </TableCell>

                      {/* Contact Info */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '13px', color: tokens.ink }}>
                          {c.email}
                        </Typography>
                        {c.phone ? (
                          <Typography variant="caption" sx={{ color: tokens.muted, display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                            <Phone size={11} /> {c.phone}
                          </Typography>
                        ) : null}
                      </TableCell>

                      {/* Subscriptions badge */}
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {hasActive ? (
                            <Chip
                              size="small"
                              label={`${c.active_subscriptions_count} Active`}
                              sx={{
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: tokens.status.success.tint,
                                color: tokens.status.success.text,
                                border: 'none'
                              }}
                            />
                          ) : (
                            <Chip
                              size="small"
                              label="0 Active"
                              sx={{
                                fontSize: '11px',
                                fontWeight: 500,
                                backgroundColor: tokens.canvas,
                                color: tokens.muted,
                                border: `1px solid ${tokens.line}`
                              }}
                            />
                          )}
                          {(c.total_subscriptions_count || 0) > (c.active_subscriptions_count || 0) && (
                            <Typography variant="caption" sx={{ color: tokens.muted }}>
                              ({c.total_subscriptions_count} total)
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      {/* Lifetime Spend */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.ink }}>
                          ${(c.total_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>

                      {/* Outstanding */}
                      <TableCell>
                        {(c.outstanding_balance || 0) > 0 ? (
                          <Typography variant="body2" sx={{ fontWeight: 600, color: tokens.status.warning.text }}>
                            ${c.outstanding_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: tokens.status.success.text, fontWeight: 600 }}>
                            $0.00
                          </Typography>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View 360 History">
                            <IconButton size="small" onClick={() => handleOpenDetail(c)} sx={{ color: tokens.accent }}>
                              <ExternalLink size={16} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Customer Details">
                            <IconButton size="small" onClick={() => handleOpenEdit(c)} sx={{ color: tokens.muted }}>
                              <Edit3 size={16} />
                            </IconButton>
                          </Tooltip>

                          {onNavigate && (
                            <Tooltip title="Manage Subscriptions">
                              <IconButton
                                size="small"
                                onClick={() => onNavigate('subscriptions')}
                                sx={{ color: tokens.muted }}
                              >
                                <RefreshCw size={16} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Customer 360 Detail Dialog */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ p: 2.5, pb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700, color: tokens.ink }}>
              Customer 360 Overview
            </Typography>
            {selectedCustomerDetail && (
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                Account ID: {selectedCustomerDetail.customer.account_id}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setDetailModalOpen(false)}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {detailLoading || !selectedCustomerDetail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={32} sx={{ color: tokens.accent }} />
            </Box>
          ) : (
            <Box>
              {/* Profile Card Header */}
              <Box
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: '8px',
                  backgroundColor: tokens.canvas,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      fontSize: '18px',
                      fontWeight: 700,
                      backgroundColor: tokens.ink,
                      color: '#FFFFFF'
                    }}
                  >
                    {selectedCustomerDetail.customer.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h4" sx={{ fontSize: '16px', fontWeight: 700, color: tokens.ink }}>
                      {selectedCustomerDetail.customer.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      {selectedCustomerDetail.customer.company_name || 'Individual Customer'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.muted, mt: 0.5, display: 'block' }}>
                      {selectedCustomerDetail.customer.email} • {selectedCustomerDetail.customer.phone || 'No phone'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 3, textAlign: 'right' }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: tokens.muted }}>
                      Total Subscriptions
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: tokens.ink }}>
                      {selectedCustomerDetail.subscriptions.length}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: tokens.muted }}>
                      Invoices Count
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: tokens.ink }}>
                      {selectedCustomerDetail.invoices.length}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Tabs */}
              <Tabs
                value={detailTab}
                onChange={(_, v) => setDetailTab(v)}
                sx={{
                  borderBottom: `1px solid ${tokens.line}`,
                  mb: 2,
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
                }}
              >
                <Tab label={`Subscriptions (${selectedCustomerDetail.subscriptions.length})`} />
                <Tab label={`Invoices & Billing (${selectedCustomerDetail.invoices.length})`} />
              </Tabs>

              {/* Subscriptions Tab */}
              {detailTab === 0 && (
                <Box>
                  {selectedCustomerDetail.subscriptions.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: tokens.muted }}>
                        No subscriptions recorded for this customer yet.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: tokens.canvas }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>SUBSCRIPTION #</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>PLAN / PRODUCT</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>STATUS</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>PRICE / BILLING</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>START DATE</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedCustomerDetail.subscriptions.map((sub) => (
                            <TableRow key={sub.id}>
                              <TableCell sx={{ fontWeight: 600, color: tokens.ink }}>
                                {sub.subscription_number || `SUB-${sub.id}`}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                                  {sub.plan_name || 'Standard Plan'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: tokens.muted }}>
                                  {sub.product_name || 'Service'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={sub.status} />
                              </TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>
                                ${Number(sub.grand_total || 0).toFixed(2)}{' '}
                                <Typography component="span" variant="caption" sx={{ color: tokens.muted }}>
                                  / {sub.billing_interval || 'month'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ color: tokens.muted, fontSize: '12px' }}>
                                {sub.start_date ? sub.start_date.substring(0, 10) : '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* Invoices Tab */}
              {detailTab === 1 && (
                <Box>
                  {selectedCustomerDetail.invoices.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ color: tokens.muted }}>
                        No invoices generated for this customer yet.
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ backgroundColor: tokens.canvas }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>INVOICE #</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>ISSUE DATE</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>DUE DATE</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>STATUS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px' }}>AMOUNT</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedCustomerDetail.invoices.map((inv) => (
                            <TableRow key={inv.id}>
                              <TableCell sx={{ fontWeight: 600, color: tokens.ink }}>
                                {inv.invoice_number}
                              </TableCell>
                              <TableCell sx={{ color: tokens.muted, fontSize: '12px' }}>
                                {inv.invoice_date || '—'}
                              </TableCell>
                              <TableCell sx={{ color: tokens.muted, fontSize: '12px' }}>
                                {inv.due_date || '—'}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={inv.status} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: tokens.ink }}>
                                ${(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailModalOpen(false)} sx={{ color: tokens.muted, textTransform: 'none' }}>
            Close
          </Button>
          {onNavigate && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailModalOpen(false);
                onNavigate('subscriptions');
              }}
              sx={{
                backgroundColor: tokens.ink,
                color: '#FFFFFF',
                textTransform: 'none',
                borderRadius: '8px',
                '&:hover': { backgroundColor: '#000000' }
              }}
            >
              Go to Subscriptions
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog
        open={createModalOpen}
        onClose={() => !submitting && setCreateModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, color: tokens.ink }}>
          Onboard New Customer
        </DialogTitle>
        <form onSubmit={handleCreateCustomer}>
          <DialogContent sx={{ p: 2.5, pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Create a new customer profile. Customers can log in to the portal to view invoices and approve quotes.
            </Typography>

            <TextField
              label="Customer Full Name"
              required
              fullWidth
              size="small"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
            />

            <TextField
              label="Email Address"
              required
              type="email"
              fullWidth
              size="small"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="sarah@example.com"
            />

            <TextField
              label="Company Name"
              fullWidth
              size="small"
              value={createForm.company_name}
              onChange={(e) => setCreateForm({ ...createForm, company_name: e.target.value })}
              placeholder="Acme Technologies Ltd"
            />

            <TextField
              label="Phone Number"
              fullWidth
              size="small"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              placeholder="+1 (555) 234-5678"
            />

            <TextField
              label="Temporary Password"
              type="text"
              fullWidth
              size="small"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              helperText="Leave empty to use default password: Welcome@123"
              placeholder="Welcome@123"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1 }}>
            <Button
              onClick={() => setCreateModalOpen(false)}
              disabled={submitting}
              sx={{ color: tokens.muted, textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: tokens.accent,
                color: '#FFFFFF',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { backgroundColor: tokens.accent600 }
              }}
            >
              {submitting ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog
        open={editModalOpen}
        onClose={() => !submitting && setEditModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ p: 2.5, fontWeight: 700, color: tokens.ink }}>
          Edit Customer
        </DialogTitle>
        <DialogContent sx={{ p: 2.5, pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Customer Name"
            required
            fullWidth
            size="small"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />

          <TextField
            label="Company Name"
            fullWidth
            size="small"
            value={editForm.company_name}
            onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
          />

          <TextField
            label="Phone Number"
            fullWidth
            size="small"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button
            onClick={() => setEditModalOpen(false)}
            disabled={submitting}
            sx={{ color: tokens.muted, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            disabled={submitting}
            sx={{
              backgroundColor: tokens.accent,
              color: '#FFFFFF',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: tokens.accent600 }
            }}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
