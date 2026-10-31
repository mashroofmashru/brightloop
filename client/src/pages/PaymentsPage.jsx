import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Stack, IconButton,
  Chip, InputAdornment
} from '@mui/material';
import { CreditCard, Plus, Search, CheckCircle2, ArrowRight, X, Building, DollarSign } from 'lucide-react';
import { paymentsApi, invoicesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function PaymentsPage() {
  const { isInternal } = useAuth();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Record Payment Modal State
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    invoice_id: '',
    method: 'bank_transfer',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_note: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (methodFilter) params.method = methodFilter;
      if (search) params.search = search;

      const [payRes, invRes] = await Promise.all([
        paymentsApi.getAll(params),
        invoicesApi.getAll()
      ]);
      setPayments(payRes.payments || []);
      // Filter invoices with outstanding balance for recording new payments
      setInvoices((invRes.invoices || []).filter(i => i.amount_due > 0 && i.status !== 'cancelled'));
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [methodFilter, search]);

  const handleOpenModal = () => {
    const firstDueInv = invoices[0];
    setForm({
      invoice_id: firstDueInv?.id || '',
      method: 'bank_transfer',
      amount: firstDueInv ? String(firstDueInv.amount_due) : '',
      payment_date: new Date().toISOString().split('T')[0],
      reference_note: ''
    });
    setOpenModal(true);
  };

  // "Amount defaults to the outstanding balance."
  const handleInvoiceChange = (invId) => {
    const inv = invoices.find(i => i.id === parseInt(invId, 10));
    setForm(prev => ({
      ...prev,
      invoice_id: invId,
      amount: inv ? String(inv.amount_due) : prev.amount
    }));
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!form.invoice_id || !form.amount || parseFloat(form.amount) <= 0) {
      setErrorMsg('Please select an invoice and enter a valid payment amount.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      const res = await paymentsApi.record(form);
      setSuccessToast(res.message || 'Payment recorded successfully.');
      setOpenModal(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700, mb: 0.5 }}>
            Payment Records & Collections
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Match incoming wires, cards, and bank payments against invoices to reconcile receivables in real time.
          </Typography>
        </Box>

        {isInternal && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={handleOpenModal}
            disabled={invoices.length === 0}
            sx={{
              backgroundColor: tokens.accent,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13.5px',
              '&:hover': { backgroundColor: tokens.accent600 }
            }}
          >
            Record Incoming Payment
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

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search payments, invoice, or customer..."
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
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          sx={{ width: 200, backgroundColor: tokens.surface }}
        >
          <MenuItem value="">All Payment Methods</MenuItem>
          <MenuItem value="bank_transfer">Bank Transfer / Wire</MenuItem>
          <MenuItem value="credit_card">Credit Card</MenuItem>
          <MenuItem value="stripe">Stripe Gateway</MenuItem>
          <MenuItem value="check">Check</MenuItem>
          <MenuItem value="cash">Cash</MenuItem>
        </TextField>
      </Box>

      {/* Payments Table */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment Reference #</TableCell>
                <TableCell>Applied To Invoice</TableCell>
                <TableCell>Customer / Company</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell>Received Date</TableCell>
                <TableCell>Notes / Wire Ref</TableCell>
                <TableCell align="right">Amount Collected</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: tokens.accent }} />
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                    No payment records found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((pay) => (
                  <TableRow key={pay.id} hover>
                    <TableCell sx={{ fontWeight: 700 }} className="tabular-nums">
                      {pay.payment_number}
                    </TableCell>
                    <TableCell className="tabular-nums" sx={{ fontWeight: 600, color: tokens.accent }}>
                      {pay.invoice_number}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{pay.customer_name}</Typography>
                      <Typography variant="caption" sx={{ color: tokens.muted }}>{pay.customer_company}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={pay.method.replace('_', ' ').toUpperCase()}
                        size="small"
                        sx={{ fontSize: '11px', fontWeight: 600, backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px', color: tokens.muted }}>
                      {pay.payment_date}
                    </TableCell>
                    <TableCell sx={{ fontSize: '12.5px', color: tokens.muted }}>
                      {pay.reference_note || '—'}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 700, color: tokens.status.success.text, fontSize: '15px' }}>
                      +${Number(pay.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status="paid" customLabel="Settled" size="small" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* RECORD PAYMENT MODAL */}
      <Dialog
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
              Record Payment Receipt
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Reconcile incoming funds against outstanding client invoices.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small" disabled={submitting}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleRecordPayment}>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Select Invoice to Pay *
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={form.invoice_id}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  disabled={submitting}
                >
                  {invoices.map(inv => (
                    <MenuItem key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.customer_name} (Balance Due: ${Number(inv.amount_due).toFixed(2)})
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Payment Method *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={form.method}
                    onChange={(e) => setForm({ ...form, method: e.target.value })}
                    disabled={submitting}
                  >
                    <MenuItem value="bank_transfer">Bank Wire / ACH</MenuItem>
                    <MenuItem value="credit_card">Credit Card</MenuItem>
                    <MenuItem value="stripe">Stripe</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="cash">Cash</MenuItem>
                  </TextField>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Amount Collected ($) *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Date of Payment *
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  disabled={submitting}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Notes & Reference (Wire ID, Auth Code, Memo)
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g. Wire confirmation #449281 settled via Wells Fargo"
                  value={form.reference_note}
                  onChange={(e) => setForm({ ...form, reference_note: e.target.value })}
                  disabled={submitting}
                />
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setOpenModal(false)} disabled={submitting} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
            >
              {submitting ? 'Recording...' : 'Confirm & Reconcile Payment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
