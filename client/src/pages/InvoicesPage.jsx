import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Stack, IconButton,
  Chip, InputAdornment, Divider, Tooltip
} from '@mui/material';
import {
  Receipt, Play, Printer, Send, CheckCircle2, XCircle, Search, Calendar,
  AlertCircle, FileText, ArrowRight, X, ShieldAlert, Sparkles
} from 'lucide-react';
import { invoicesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function InvoicesPage() {
  const { isInternal } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Bulk Billing Modal State
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingDate, setBillingDate] = useState(new Date().toISOString().split('T')[0]);
  const [runningBilling, setRunningBilling] = useState(false);
  const [billingResults, setBillingResults] = useState(null);

  // Invoice Printable View Modal State
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter === 'overdue') {
        params.overdueOnly = 'true';
      } else if (statusFilter) {
        params.status = statusFilter;
      }
      if (search) params.search = search;

      const res = await invoicesApi.getAll(params);
      setInvoices(res.invoices || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, search]);

  const handleOpenBillingModal = () => {
    setBillingResults(null);
    setErrorMsg('');
    setBillingModalOpen(true);
  };

  const handleExecuteBilling = async () => {
    try {
      setRunningBilling(true);
      setErrorMsg('');
      const res = await invoicesApi.runBilling({ billing_date: billingDate });
      setBillingResults(res);
      fetchInvoices();
    } catch (err) {
      setErrorMsg(err.message || 'Billing run failed');
    } finally {
      setRunningBilling(false);
    }
  };

  const handleViewInvoice = async (inv) => {
    try {
      const res = await invoicesApi.getById(inv.id);
      setActiveInvoice(res.invoice);
      setInvoiceModalOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to open invoice');
    }
  };

  const handleInvoiceStatus = async (invId, targetStatus) => {
    try {
      setActionLoading(true);
      await invoicesApi.updateStatus(invId, { status: targetStatus });
      setSuccessToast(`Invoice updated to ${targetStatus}.`);
      const refreshed = await invoicesApi.getById(invId);
      setActiveInvoice(refreshed.invoice);
      fetchInvoices();
    } catch (err) {
      setErrorMsg(err.message || 'Status update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvoice = async (invId) => {
    try {
      setActionLoading(true);
      await invoicesApi.send(invId);
      setSuccessToast('Invoice dispatched to client email.');
      const refreshed = await invoicesApi.getById(invId);
      setActiveInvoice(refreshed.invoice);
      fetchInvoices();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }} className="no-print">
        <Box>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700, mb: 0.5 }}>
            Invoices & Automated Billing
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Run batch recurring billing, manage automated taxes, review discount deductions, and track aging receivables.
          </Typography>
        </Box>

        {isInternal && (
          <Button
            variant="contained"
            startIcon={<Play size={16} />}
            onClick={handleOpenBillingModal}
            sx={{
              backgroundColor: tokens.accent,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13.5px',
              '&:hover': { backgroundColor: tokens.accent600 }
            }}
          >
            Run Billing Day
          </Button>
        )}
      </Box>

      {successToast && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setSuccessToast('')} className="no-print">
          {successToast}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} className="no-print">
          {errorMsg}
        </Alert>
      )}

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }} className="no-print">
        <TextField
          size="small"
          placeholder="Search by invoice #, client, company..."
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
          <MenuItem value="">All Invoices</MenuItem>
          <MenuItem value="draft">Draft (Unconfirmed)</MenuItem>
          <MenuItem value="confirmed">Confirmed (Pending Payment)</MenuItem>
          <MenuItem value="overdue">Overdue (Past Due Date)</MenuItem>
          <MenuItem value="paid">Paid (Settled)</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
        </TextField>

        {statusFilter && (
          <Button variant="text" size="small" onClick={() => setStatusFilter('')} sx={{ color: tokens.muted, fontSize: '13px' }}>
            Clear Filter
          </Button>
        )}
      </Box>

      {/* Invoices Table */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }} className="no-print">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Billed To / Customer</TableCell>
                <TableCell>Subscription Ref</TableCell>
                <TableCell>Invoice Date</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Invoice Total</TableCell>
                <TableCell align="right">Amount Due</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: tokens.accent }} />
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                    No invoices match your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontWeight: 700 }} className="tabular-nums">
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{inv.customer_name}</Typography>
                      <Typography variant="caption" sx={{ color: tokens.muted }}>{inv.customer_company || inv.customer_email}</Typography>
                    </TableCell>
                    <TableCell sx={{ color: tokens.muted, fontSize: '13px' }} className="tabular-nums">
                      {inv.subscription_number || 'Standalone'}
                    </TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{inv.invoice_date}</TableCell>
                    <TableCell sx={{ fontSize: '13px', color: inv.is_overdue ? tokens.status.danger.text : tokens.ink, fontWeight: inv.is_overdue ? 700 : 400 }}>
                      {inv.due_date} {inv.is_overdue ? '(Overdue)' : ''}
                    </TableCell>
                    <TableCell>
                      {inv.is_overdue ? (
                        <StatusBadge status="overdue" />
                      ) : (
                        <StatusBadge status={inv.status} />
                      )}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>
                      ${Number(inv.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 700, color: inv.amount_due > 0 ? tokens.status.warning.text : tokens.status.success.text }}>
                      ${Number(inv.amount_due).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleViewInvoice(inv)}
                        sx={{ fontSize: '12px', py: 0.5, borderColor: tokens.line, color: tokens.ink }}
                      >
                        Print / View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* BULK BILLING RUN DIALOG */}
      <Dialog
        open={billingModalOpen}
        onClose={() => !runningBilling && setBillingModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
              Billing Day Automated Engine
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Batch process hundreds of due subscriptions with automated taxes and idempotent safeguard.
            </Typography>
          </Box>
          <IconButton onClick={() => setBillingModalOpen(false)} size="small" disabled={runningBilling}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ mb: 3, p: 2, borderRadius: '8px', backgroundColor: tokens.canvas, border: `1px solid ${tokens.line}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Billing Effective Date:
                </Typography>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  value={billingDate}
                  onChange={(e) => setBillingDate(e.target.value)}
                  disabled={runningBilling}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box sx={{ pt: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleExecuteBilling}
                  disabled={runningBilling}
                  startIcon={runningBilling ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
                  sx={{
                    py: 1,
                    px: 3,
                    backgroundColor: tokens.accent,
                    '&:hover': { backgroundColor: tokens.accent600 },
                    fontWeight: 600
                  }}
                >
                  {runningBilling ? 'Processing Batch...' : 'Execute Idempotent Billing Run'}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* RESULTS DISPLAY */}
          {billingResults && (
            <Box>
              <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
                {billingResults.message}
              </Alert>

              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                Per-Row Billing Execution Results:
              </Typography>

              <TableContainer sx={{ border: `1px solid ${tokens.line}`, borderRadius: '8px', maxHeight: 320 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subscription #</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Execution Result</TableCell>
                      <TableCell>Details / Reason</TableCell>
                      <TableCell>Generated Invoice #</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {billingResults.results?.map((res, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 600 }}>{res.subscription_number}</TableCell>
                        <TableCell>{res.customer_name}</TableCell>
                        <TableCell>
                          <Chip
                            label={res.result.toUpperCase()}
                            size="small"
                            sx={{
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: res.result === 'created' ? tokens.status.success.tint : tokens.status.warning.tint,
                              color: res.result === 'created' ? tokens.status.success.text : tokens.status.warning.text
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', color: tokens.muted }}>
                          {res.reason} {res.applied_discount ? `(Applied ${res.applied_discount})` : ''}
                        </TableCell>
                        <TableCell className="tabular-nums" sx={{ fontWeight: 600 }}>
                          {res.invoice_number || '—'}
                        </TableCell>
                        <TableCell align="right" className="tabular-nums">
                          ${Number(res.total_amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBillingModalOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRINTABLE INVOICE SHEET VIEW */}
      <Dialog
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 0 } }}
      >
        {activeInvoice && (
          <Box sx={{ p: 4 }}>
            {/* Action Bar (Hidden when printing) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
              <Stack direction="row" spacing={1}>
                {isInternal && activeInvoice.status === 'draft' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CheckCircle2 size={15} />}
                    onClick={() => handleInvoiceStatus(activeInvoice.id, 'confirmed')}
                    disabled={actionLoading}
                    sx={{ backgroundColor: tokens.ink }}
                  >
                    Confirm Invoice
                  </Button>
                )}

                {isInternal && activeInvoice.status === 'confirmed' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Send size={15} />}
                    onClick={() => handleSendInvoice(activeInvoice.id)}
                    disabled={actionLoading}
                  >
                    {activeInvoice.sent_at ? 'Re-send Email' : 'Send to Customer'}
                  </Button>
                )}

                {isInternal && activeInvoice.status !== 'cancelled' && activeInvoice.status !== 'paid' && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<XCircle size={15} />}
                    onClick={() => handleInvoiceStatus(activeInvoice.id, 'cancelled')}
                    disabled={actionLoading}
                    sx={{ borderColor: tokens.status.danger.text, color: tokens.status.danger.text }}
                  >
                    Cancel Invoice
                  </Button>
                )}
              </Stack>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Printer size={15} />}
                  onClick={handlePrint}
                  sx={{ borderColor: tokens.line, color: tokens.ink }}
                >
                  Print / Save PDF
                </Button>
                <IconButton onClick={() => setInvoiceModalOpen(false)} size="small">
                  <X size={18} />
                </IconButton>
              </Stack>
            </Box>

            {/* PRINTABLE INVOICE PAPER SHEET */}
            <Card sx={{ p: 4, border: `1px solid ${tokens.line}`, borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              {/* Sheet Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, pb: 3, borderBottom: `2px solid ${tokens.ink}` }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: tokens.ink, color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                      B
                    </Box>
                    <Typography variant="h2" sx={{ fontSize: '22px', fontWeight: 800 }}>
                      Brightloop Software
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
                    100 Innovation Way, Suite 400 • billing@brightloop.io
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 800, mb: 0.5 }}>
                    INVOICE
                  </Typography>
                  <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700, fontSize: '16px', color: tokens.ink, mb: 0.5 }}>
                    {activeInvoice.invoice_number}
                  </Typography>
                  <StatusBadge status={activeInvoice.status} />
                </Box>
              </Box>

              {/* Customer and Period Details */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, mb: 4 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                    Billed To:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px' }}>
                    {activeInvoice.customer_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.ink }}>
                    {activeInvoice.customer_company}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {activeInvoice.customer_email}
                  </Typography>
                  {activeInvoice.customer_phone && (
                    <Typography variant="body2" sx={{ color: tokens.muted }}>
                      {activeInvoice.customer_phone}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontWeight: 700, textTransform: 'uppercase' }}>
                      Invoice Date:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeInvoice.invoice_date}</Typography>

                    <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontWeight: 700, textTransform: 'uppercase', mt: 1.5 }}>
                      Due Date:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeInvoice.due_date}</Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontWeight: 700, textTransform: 'uppercase' }}>
                      Subscription Ref:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeInvoice.subscription_number || 'N/A'}</Typography>

                    <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontWeight: 700, textTransform: 'uppercase', mt: 1.5 }}>
                      Billing Period:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '12.5px', color: tokens.muted }}>
                      {activeInvoice.billing_period_start} → {activeInvoice.billing_period_end}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Invoice Lines Table */}
              <TableContainer sx={{ border: `1px solid ${tokens.line}`, borderRadius: '8px', mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: tokens.canvas }}>
                      <TableCell>Item Description</TableCell>
                      <TableCell align="center">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Tax Rate</TableCell>
                      <TableCell align="right">Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeInvoice.lines?.map((line) => (
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
                        <TableCell align="right" className="tabular-nums">{line.tax_rate}%</TableCell>
                        <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>
                          ${Number(line.total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Financial Totals Breakdown */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ maxWidth: 320 }}>
                  {activeInvoice.notes && (
                    <Box sx={{ p: 1.5, borderRadius: '8px', backgroundColor: tokens.accent50, border: `1px solid ${tokens.accent}30` }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: tokens.accent700 }}>
                        DISCOUNT NOTICE:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '12.5px', color: tokens.ink }}>
                        {activeInvoice.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ width: 280 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Subtotal:</Typography>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                      ${Number(activeInvoice.subtotal).toFixed(2)}
                    </Typography>
                  </Box>

                  {activeInvoice.discount_amount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, color: tokens.status.success.text }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Applied Discount:</Typography>
                      <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700 }}>
                        -${Number(activeInvoice.discount_amount).toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Tax Amount:</Typography>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                      +${Number(activeInvoice.tax_amount).toFixed(2)}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 800 }}>Invoice Total:</Typography>
                    <Typography variant="h3" className="tabular-nums" sx={{ fontSize: '18px', fontWeight: 800, color: tokens.ink }}>
                      ${Number(activeInvoice.total_amount).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Amount Paid:</Typography>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                      ${Number(activeInvoice.amount_paid).toFixed(2)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: `1px solid ${tokens.line}` }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>Balance Due:</Typography>
                    <Typography variant="body1" className="tabular-nums" sx={{ fontWeight: 800, color: activeInvoice.amount_due > 0 ? tokens.status.danger.text : tokens.status.success.text }}>
                      ${Number(activeInvoice.amount_due).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
