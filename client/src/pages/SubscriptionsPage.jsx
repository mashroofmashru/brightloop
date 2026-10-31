import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Stack, IconButton,
  Chip, InputAdornment, Menu, Divider
} from '@mui/material';
import {
  RefreshCw, Plus, Search, Filter, MoreVertical, Eye, Play, Pause,
  CheckCircle2, XCircle, Send, FileText, ArrowRight, X, ChevronRight
} from 'lucide-react';
import { subscriptionsApi, templatesApi, productsApi, plansApi, usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LifecycleStepper from '../components/LifecycleStepper';
import { tokens } from '../theme';

export default function SubscriptionsPage({ initialTemplate = null, onClearInitialTemplate }) {
  const { user, isInternal, isCustomer } = useAuth();

  const [subscriptions, setSubscriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [taxes, setTaxes] = useState([
    { id: 1, name: 'Standard VAT (15%)', rate: 15.0 },
    { id: 2, name: 'State Sales Tax (8%)', rate: 8.0 },
    { id: 3, name: 'Tax Exempt (0%)', rate: 0.0 }
  ]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Detail Modal
  const [selectedSub, setSelectedSub] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Close Reason Dialog
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [subToCloseId, setSubToCloseId] = useState(null);

  // Create Quote/Subscription Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_id: '',
    plan_id: '',
    template_id: '',
    status: 'draft',
    start_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    payment_terms: 'Immediate',
    notes: '',
    lines: []
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const [subRes, planRes, prodRes, tmplRes] = await Promise.all([
        subscriptionsApi.getAll(params),
        plansApi.getAll(),
        productsApi.getAll(),
        templatesApi.getAll()
      ]);

      setSubscriptions(subRes.subscriptions || []);
      setPlans(planRes.plans || []);
      setProducts(prodRes.products || []);
      setTemplates(tmplRes.templates || []);

      if (isInternal) {
        const custRes = await usersApi.getCustomers();
        setCustomers(custRes.customers || []);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, search]);

  // Handle template pre-fill when triggered from templates page
  useEffect(() => {
    if (initialTemplate) {
      handleOpenCreateModal(initialTemplate);
      if (onClearInitialTemplate) onClearInitialTemplate();
    }
  }, [initialTemplate]);

  const handleOpenCreateModal = (fromTemplate = null) => {
    const today = new Date().toISOString().split('T')[0];

    if (fromTemplate) {
      const templateLines = (fromTemplate.lines || []).map(tl => ({
        product_id: tl.product_id,
        variant_id: tl.variant_id || '',
        description: `${tl.product_name}${tl.attribute_value ? ` (${tl.attribute_value})` : ''}`,
        quantity: tl.quantity || 1,
        unit_price: tl.unit_price,
        tax_id: 1 // default standard VAT
      }));

      // Calculate expiry from validity_days
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + (fromTemplate.validity_days || 30));

      setForm({
        customer_id: customers[0]?.id || '',
        plan_id: fromTemplate.plan_id || plans[0]?.id || '',
        template_id: fromTemplate.id,
        status: 'quotation',
        start_date: today,
        expiry_date: expDate.toISOString().split('T')[0],
        payment_terms: 'Immediate',
        notes: `Prepared from quotation template: ${fromTemplate.name}`,
        lines: templateLines.length > 0 ? templateLines : [
          { product_id: products[0]?.id || '', variant_id: '', description: '', quantity: 1, unit_price: products[0]?.sales_price || 0, tax_id: 1 }
        ]
      });
    } else {
      setForm({
        customer_id: customers[0]?.id || '',
        plan_id: plans[0]?.id || '',
        template_id: '',
        status: 'draft',
        start_date: today,
        expiry_date: '',
        payment_terms: 'Immediate',
        notes: '',
        lines: [
          { product_id: products[0]?.id || '', variant_id: '', description: '', quantity: 1, unit_price: products[0]?.sales_price || 0, tax_id: 1 }
        ]
      });
    }

    setCreateModalOpen(true);
  };

  const handleTemplateSelection = (templateId) => {
    if (!templateId) return;
    const tmpl = templates.find(t => t.id === parseInt(templateId, 10));
    if (!tmpl) return;

    const templateLines = (tmpl.lines || []).map(tl => ({
      product_id: tl.product_id,
      variant_id: tl.variant_id || '',
      description: `${tl.product_name}${tl.attribute_value ? ` (${tl.attribute_value})` : ''}`,
      quantity: tl.quantity || 1,
      unit_price: tl.unit_price,
      tax_id: 1
    }));

    setForm(prev => ({
      ...prev,
      template_id: templateId,
      plan_id: tmpl.plan_id || prev.plan_id,
      lines: templateLines
    }));
  };

  const handleAddLine = () => {
    const prod = products[0];
    setForm(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        { product_id: prod?.id || '', variant_id: '', description: '', quantity: 1, unit_price: prod?.sales_price || 0, tax_id: 1 }
      ]
    }));
  };

  const handleRemoveLine = (idx) => {
    setForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== idx)
    }));
  };

  const handleLineChange = (idx, field, value) => {
    setForm(prev => {
      const updated = [...prev.lines];
      updated[idx] = { ...updated[idx], [field]: value };

      if (field === 'product_id') {
        const prod = products.find(p => p.id === parseInt(value, 10));
        if (prod) {
          updated[idx].unit_price = prod.sales_price;
          updated[idx].variant_id = '';
          updated[idx].description = prod.name;
        }
      } else if (field === 'variant_id' && value) {
        const prod = products.find(p => p.id === parseInt(updated[idx].product_id, 10));
        const variant = prod?.variants?.find(v => v.id === parseInt(value, 10));
        if (variant && prod) {
          updated[idx].unit_price = prod.sales_price + variant.price_extra;
          updated[idx].description = `${prod.name} (${variant.attribute_value})`;
        }
      }

      return { ...prev, lines: updated };
    });
  };

  // Compute live preview totals
  const computeTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    for (const line of form.lines) {
      const qty = parseInt(line.quantity, 10) || 0;
      const price = parseFloat(line.unit_price) || 0;
      const lineSub = qty * price;
      subtotal += lineSub;

      if (line.tax_id) {
        const tax = taxes.find(t => t.id === parseInt(line.tax_id, 10));
        if (tax) {
          taxTotal += lineSub * (tax.rate / 100);
        }
      }
    }

    return {
      subtotal,
      taxTotal,
      grandTotal: subtotal + taxTotal
    };
  };

  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!form.customer_id || !form.plan_id || !form.start_date) {
      setErrorMsg('Customer, recurring plan, and start date are required.');
      return;
    }
    if (form.lines.length === 0) {
      setErrorMsg('Please add at least one product line item.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await subscriptionsApi.create(form);
      setSuccessToast(`Subscription ${res.subscription.subscription_number} created successfully.`);
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusTransition = async (subId, nextStatus) => {
    if (nextStatus === 'closed') {
      setSubToCloseId(subId);
      setCloseReason('');
      setCloseDialogOpen(true);
      return;
    }

    try {
      await subscriptionsApi.updateStatus(subId, { status: nextStatus });
      setSuccessToast(`Subscription transitioned to ${nextStatus}.`);
      fetchData();
      if (selectedSub && selectedSub.id === subId) {
        const refreshed = await subscriptionsApi.getById(subId);
        setSelectedSub(refreshed.subscription);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Status transition failed');
    }
  };

  const handleConfirmClose = async () => {
    if (!subToCloseId) return;
    try {
      await subscriptionsApi.updateStatus(subToCloseId, { status: 'closed', close_reason: closeReason });
      setSuccessToast('Subscription has been closed.');
      setCloseDialogOpen(false);
      fetchData();
      if (selectedSub && selectedSub.id === subToCloseId) {
        const refreshed = await subscriptionsApi.getById(subToCloseId);
        setSelectedSub(refreshed.subscription);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to close subscription');
    }
  };

  const handleViewDetail = async (sub) => {
    try {
      const res = await subscriptionsApi.getById(sub.id);
      setSelectedSub(res.subscription);
      setDetailModalOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to open subscription details');
    }
  };

  const totals = computeTotals();

  return (
    <Box sx={{ p: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700, mb: 0.5 }}>
            Subscriptions & Quotations
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Track recurring client contracts through the full lifecycle: Draft ➔ Quotation ➔ Confirmed ➔ Active ➔ Closed.
          </Typography>
        </Box>

        {isInternal && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => handleOpenCreateModal()}
            sx={{
              backgroundColor: tokens.accent,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13.5px',
              '&:hover': { backgroundColor: tokens.accent600 }
            }}
          >
            New Quote / Subscription
          </Button>
        )}
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

      {/* Filters Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by number, customer, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 320, backgroundColor: tokens.surface }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color={tokens.muted} />
              </InputAdornment>
            )
          }}
        />

        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 180, backgroundColor: tokens.surface }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="quotation">Quotation</MenuItem>
          <MenuItem value="confirmed">Confirmed</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="paused">Paused</MenuItem>
          <MenuItem value="closed">Closed</MenuItem>
        </TextField>

        {statusFilter && (
          <Button
            variant="text"
            size="small"
            onClick={() => setStatusFilter('')}
            sx={{ color: tokens.muted, fontSize: '13px' }}
          >
            Clear Filter
          </Button>
        )}
      </Box>

      {/* Subscriptions Data Table */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Subscription #</TableCell>
                <TableCell>Customer / Company</TableCell>
                <TableCell>Plan & Cadence</TableCell>
                <TableCell>Start / Expiry</TableCell>
                <TableCell>Status & Lifecycle</TableCell>
                <TableCell align="right">Recurring Total</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: tokens.accent }} />
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                    No subscriptions match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: tokens.ink }} className="tabular-nums">
                      {sub.subscription_number}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{sub.customer_name}</Typography>
                      <Typography variant="caption" sx={{ color: tokens.muted }}>{sub.customer_company || sub.customer_email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${sub.plan_name} (${sub.billing_interval})`}
                        size="small"
                        sx={{ fontSize: '11.5px', fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px', color: tokens.muted }}>
                      {sub.start_date} {sub.expiry_date ? `→ ${sub.expiry_date}` : ''}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sub.status} />
                    </TableCell>
                    <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600, fontSize: '15px' }}>
                      ${Number(sub.grand_total).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewDetail(sub)}
                        sx={{ fontSize: '12px', py: 0.5, borderColor: tokens.line, color: tokens.ink }}
                      >
                        View & Advance
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* SUBSCRIPTION DETAIL & LIFECYCLE ADVANCER MODAL */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        {selectedSub && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography variant="h2" sx={{ fontSize: '20px', fontWeight: 700 }}>
                    {selectedSub.subscription_number}
                  </Typography>
                  <StatusBadge status={selectedSub.status} />
                </Box>
                <Typography variant="body2" sx={{ color: tokens.muted }}>
                  {selectedSub.customer_name} ({selectedSub.customer_company}) • Terms: {selectedSub.payment_terms}
                </Typography>
              </Box>
              <IconButton onClick={() => setDetailModalOpen(false)} size="small">
                <X size={18} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
              {/* Stepper */}
              <Box sx={{ mb: 3, p: 2, borderRadius: '8px', backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, color: tokens.muted, mb: 1, textTransform: 'uppercase' }}>
                  Subscription Stage Progression:
                </Typography>
                <LifecycleStepper currentStatus={selectedSub.status} />
              </Box>

              {/* State Transition Actions */}
              {isInternal && (
                <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap', p: 2, borderRadius: '8px', backgroundColor: tokens.accent50, border: `1px solid ${tokens.accent}30` }}>
                  {selectedSub.status === 'draft' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Send size={15} />}
                      onClick={() => handleStatusTransition(selectedSub.id, 'quotation')}
                      sx={{ backgroundColor: tokens.accent }}
                    >
                      Send Quotation to Client
                    </Button>
                  )}

                  {(selectedSub.status === 'draft' || selectedSub.status === 'quotation') && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<CheckCircle2 size={15} />}
                      onClick={() => handleStatusTransition(selectedSub.id, 'confirmed')}
                      sx={{ backgroundColor: tokens.ink }}
                    >
                      Confirm Agreement
                    </Button>
                  )}

                  {selectedSub.status === 'confirmed' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Play size={15} />}
                      onClick={() => handleStatusTransition(selectedSub.id, 'active')}
                      sx={{ backgroundColor: tokens.status.success.text }}
                    >
                      Activate Subscription
                    </Button>
                  )}

                  {selectedSub.status === 'active' && selectedSub.allow_pause === 1 && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Pause size={15} />}
                      onClick={() => handleStatusTransition(selectedSub.id, 'paused')}
                      sx={{ borderColor: tokens.status.warning.text, color: tokens.status.warning.text }}
                    >
                      Pause Subscription
                    </Button>
                  )}

                  {selectedSub.status === 'paused' && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Play size={15} />}
                      onClick={() => handleStatusTransition(selectedSub.id, 'active')}
                      sx={{ backgroundColor: tokens.status.success.text }}
                    >
                      Resume Subscription
                    </Button>
                  )}

                  {selectedSub.status !== 'closed' && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<XCircle size={15} />}
                      onClick={() => handleStatusTransition(selectedSub.id, 'closed')}
                      sx={{ borderColor: tokens.status.danger.text, color: tokens.status.danger.text }}
                    >
                      Close Subscription
                    </Button>
                  )}
                </Box>
              )}

              {/* Line Items Table */}
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                Contract Line Items
              </Typography>
              <TableContainer sx={{ border: `1px solid ${tokens.line}`, borderRadius: '8px', mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Description</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Tax Rate</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSub.lines?.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {line.description}
                          {line.attribute_value && (
                            <Typography variant="caption" sx={{ display: 'block', color: tokens.accent700 }}>
                              Variant: {line.attribute_name} — {line.attribute_value}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center" className="tabular-nums">{line.quantity}</TableCell>
                        <TableCell align="right" className="tabular-nums">${Number(line.unit_price).toFixed(2)}</TableCell>
                        <TableCell align="right" className="tabular-nums">{line.tax_rate ? `${line.tax_rate}%` : '0%'}</TableCell>
                        <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>
                          ${Number(line.line_total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Financial Summary */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 260 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Subtotal:</Typography>
                    <Typography variant="body2" className="tabular-nums">${Number(selectedSub.subtotal).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Taxes:</Typography>
                    <Typography variant="body2" className="tabular-nums">${Number(selectedSub.tax_total).toFixed(2)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700 }}>Grand Total:</Typography>
                    <Typography variant="h3" className="tabular-nums" sx={{ fontSize: '18px', fontWeight: 700, color: tokens.ink }}>
                      ${Number(selectedSub.grand_total).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailModalOpen(false)} variant="outlined">
                Close View
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* CREATE SUBSCRIPTION / QUOTE MODAL */}
      <Dialog
        open={createModalOpen}
        onClose={() => !submitting && setCreateModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
              Create New Quote or Subscription
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Start from scratch or pick a pre-set quotation template.
            </Typography>
          </Box>
          <IconButton onClick={() => setCreateModalOpen(false)} size="small" disabled={submitting}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveSubscription}>
          <DialogContent sx={{ pt: 1 }}>
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {errorMsg}
              </Alert>
            )}

            <Stack spacing={2.5}>
              {/* Optional Template Quick Picker */}
              <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Start From Quotation Template (Optional):
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={form.template_id}
                  onChange={(e) => handleTemplateSelection(e.target.value)}
                  disabled={submitting}
                >
                  <MenuItem value="">Custom / Start From Scratch</MenuItem>
                  {templates.map(t => (
                    <MenuItem key={t.id} value={t.id}>
                      {t.name} (Valid for {t.validity_days} days)
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Customer and Plan */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Customer Account *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                    disabled={submitting}
                  >
                    {customers.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} ({c.company_name || c.email})
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Recurring Plan *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={form.plan_id}
                    onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                    disabled={submitting}
                  >
                    {plans.map(p => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} (${Number(p.price).toFixed(2)}/{p.billing_interval})
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Initial Status
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    disabled={submitting}
                  >
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="quotation">Quotation (Active Offer)</MenuItem>
                    <MenuItem value="confirmed">Confirmed</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Start Date *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    disabled={submitting}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Expiry / Renewal Date
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                    disabled={submitting}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Payment Terms
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={form.payment_terms}
                    onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                    disabled={submitting}
                  >
                    <MenuItem value="Immediate">Immediate</MenuItem>
                    <MenuItem value="Net 15">Net 15</MenuItem>
                    <MenuItem value="Net 30">Net 30</MenuItem>
                    <MenuItem value="Net 60">Net 60</MenuItem>
                  </TextField>
                </Box>
              </Box>

              {/* LINE ITEMS TABLE */}
              <Box sx={{ borderTop: `1px solid ${tokens.line}`, pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '14px' }}>
                    Subscription Products & Taxes
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={14} />}
                    onClick={handleAddLine}
                    disabled={submitting}
                    sx={{ fontSize: '12px' }}
                  >
                    Add Product Line
                  </Button>
                </Box>

                <Stack spacing={1.5}>
                  {form.lines.map((line, idx) => {
                    const selProd = products.find(p => p.id === parseInt(line.product_id, 10));
                    const variants = selProd?.variants || [];
                    const lineSub = (parseInt(line.quantity, 10) || 0) * (parseFloat(line.unit_price) || 0);

                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1.5fr 80px 110px 150px 100px 40px',
                          gap: 1.5,
                          alignItems: 'center',
                          p: 1.25,
                          borderRadius: '8px',
                          backgroundColor: tokens.canvas,
                          border: `1px solid ${tokens.line}`
                        }}
                      >
                        <TextField
                          select
                          size="small"
                          label="Product"
                          value={line.product_id}
                          onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                          disabled={submitting}
                        >
                          {products.map(p => (
                            <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          select
                          size="small"
                          label="Variant"
                          value={line.variant_id}
                          onChange={(e) => handleLineChange(idx, 'variant_id', e.target.value)}
                          disabled={submitting || variants.length === 0}
                        >
                          <MenuItem value="">Standard (Included)</MenuItem>
                          {variants.map(v => (
                            <MenuItem key={v.id} value={v.id}>
                              {v.attribute_value} (+${Number(v.price_extra).toFixed(2)})
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          size="small"
                          type="number"
                          label="Qty"
                          value={line.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                          disabled={submitting}
                        />

                        <TextField
                          size="small"
                          type="number"
                          step="0.01"
                          label="Unit Price"
                          value={line.unit_price}
                          onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                          disabled={submitting}
                        />

                        <TextField
                          select
                          size="small"
                          label="Tax Rule"
                          value={line.tax_id}
                          onChange={(e) => handleLineChange(idx, 'tax_id', e.target.value)}
                          disabled={submitting}
                        >
                          {taxes.map(t => (
                            <MenuItem key={t.id} value={t.id}>
                              {t.name}
                            </MenuItem>
                          ))}
                        </TextField>

                        <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600, textAlign: 'right' }}>
                          ${lineSub.toFixed(2)}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={form.lines.length <= 1 || submitting}
                          sx={{ color: tokens.status.danger.text }}
                        >
                          <X size={16} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>

              {/* Running Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: `1px solid ${tokens.line}` }}>
                <Box sx={{ width: 280 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Subtotal:</Typography>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                      ${totals.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Taxes:</Typography>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                      ${totals.taxTotal.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h3" sx={{ fontSize: '15px', fontWeight: 700 }}>Contract Total:</Typography>
                    <Typography variant="h3" className="tabular-nums" sx={{ fontSize: '18px', fontWeight: 700, color: tokens.accent }}>
                      ${totals.grandTotal.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setCreateModalOpen(false)} disabled={submitting} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
            >
              {submitting ? 'Generating...' : 'Save Subscription Offer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CLOSE REASON DIALOG */}
      <Dialog open={closeDialogOpen} onClose={() => setCloseDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Close Subscription</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: tokens.muted, mb: 2 }}>
            Please record the reason for terminating or closing this subscription.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="e.g. Customer migrated to new system / Contract ended"
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCloseDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button onClick={handleConfirmClose} variant="contained" sx={{ backgroundColor: tokens.status.danger.text }}>
            Confirm Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
