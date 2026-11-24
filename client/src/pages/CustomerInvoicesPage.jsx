import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Alert,
  CircularProgress, Divider, Dialog, IconButton, TextField, InputAdornment
} from '@mui/material';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaymentRoundedIcon from '@mui/icons-material/PaymentRounded';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import { invoicesApi, startOnlinePayment } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function CustomerInvoicesPage({ onNavigate }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, unpaid, paid

  // Modal Sheet State
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await invoicesApi.getAll();
      setInvoices(res.invoices || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenInvoice = async (inv) => {
    try {
      const res = await invoicesApi.getById(inv.id);
      setActiveInvoice(res.invoice);
      setInvoiceModalOpen(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load invoice details.');
    }
  };

  const handleExecutePayment = async () => {
    if (!activeInvoice) return;
    try {
      setPayingInvoice(true);
      // Redirects to Stripe's secure payment page; the return page records the payment.
      await startOnlinePayment(activeInvoice.id);
    } catch (err) {
      setErrorMsg(err.message || 'Could not start the online payment. Please try again.');
      setPayingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Metrics
  const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0);
  const totalDue = invoices.reduce((sum, inv) => sum + Number(inv.amount_due || 0), 0);
  const unpaidCount = invoices.filter(inv => Number(inv.amount_due) > 0 && inv.status !== 'cancelled').length;

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.plan_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.subscription_number?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'unpaid') {
      return Number(inv.amount_due) > 0 && inv.status !== 'cancelled';
    }
    if (statusFilter === 'paid') {
      return Number(inv.amount_due) === 0 && Number(inv.total_amount) > 0;
    }
    return true;
  });

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }} className="no-print">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
              <ReceiptLongRoundedIcon sx={{ fontSize: 28, color: tokens.accent }} />
              <Typography variant="h1" sx={{ fontSize: '26px', fontWeight: 700 }}>
                My Invoices & Statements
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: tokens.muted }}>
              Review itemized invoices, track payments, download printable receipts, and settle balances instantly.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Notifications */}
      {successToast && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setSuccessToast('')}
          className="no-print"
        >
          {successToast}
        </Alert>
      )}

      {errorMsg && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '8px' }}
          onClose={() => setErrorMsg('')}
          className="no-print"
        >
          {errorMsg}
        </Alert>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }} className="no-print">
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Invoiced
                </Typography>
                <MonetizationOnRoundedIcon sx={{ fontSize: 20, color: tokens.accent }} />
              </Box>
              <Typography variant="h2" className="tabular-nums" sx={{ fontSize: '24px', fontWeight: 700, color: tokens.ink }}>
                ${totalInvoiced.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted, fontSize: '12px' }}>
                Across {invoices.length} total billing statements
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, textTransform: 'uppercase' }}>
                  Paid to Date
                </Typography>
                <CheckCircleRoundedIcon sx={{ fontSize: 20, color: tokens.status.success.text }} />
              </Box>
              <Typography variant="h2" className="tabular-nums" sx={{ fontSize: '24px', fontWeight: 700, color: tokens.status.success.text }}>
                ${totalPaid.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: tokens.muted, fontSize: '12px' }}>
                Settled through digital payment methods
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card
            sx={{
              border: `1px solid ${totalDue > 0 ? tokens.status.danger.text + '50' : tokens.line}`,
              backgroundColor: totalDue > 0 ? tokens.status.danger.bg : tokens.surface,
              borderRadius: '12px'
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: totalDue > 0 ? tokens.status.danger.text : tokens.muted,
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}
                >
                  Balance Outstanding
                </Typography>
                <AccountBalanceWalletRoundedIcon
                  sx={{ fontSize: 20, color: totalDue > 0 ? tokens.status.danger.text : tokens.muted }}
                />
              </Box>
              <Typography
                variant="h2"
                className="tabular-nums"
                sx={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: totalDue > 0 ? tokens.status.danger.text : tokens.ink
                }}
              >
                ${totalDue.toFixed(2)}
              </Typography>
              <Typography variant="caption" sx={{ color: totalDue > 0 ? tokens.status.danger.text : tokens.muted, fontSize: '12px' }}>
                {unpaidCount > 0 ? `${unpaidCount} invoice(s) awaiting payment` : 'All accounts settled and up to date'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table Card */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }} className="no-print">
        {/* Filter bar */}
        <Box sx={{ p: 2.5, borderBottom: `1px solid ${tokens.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('all')}
              sx={{
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                ...(statusFilter === 'all' ? { backgroundColor: tokens.ink, color: '#FFFFFF' } : { borderColor: tokens.line, color: tokens.ink })
              }}
            >
              All Invoices ({invoices.length})
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'unpaid' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('unpaid')}
              sx={{
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                ...(statusFilter === 'unpaid'
                  ? { backgroundColor: tokens.status.danger.text, color: '#FFFFFF' }
                  : { borderColor: tokens.line, color: tokens.status.danger.text })
              }}
            >
              Unpaid ({unpaidCount})
            </Button>
            <Button
              size="small"
              variant={statusFilter === 'paid' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('paid')}
              sx={{
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                ...(statusFilter === 'paid'
                  ? { backgroundColor: tokens.status.success.text, color: '#FFFFFF' }
                  : { borderColor: tokens.line, color: tokens.ink })
              }}
            >
              Paid ({invoices.length - unpaidCount})
            </Button>
          </Stack>

          <TextField
            size="small"
            placeholder="Search invoice number, plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                </InputAdornment>
              ),
              sx: { borderRadius: '8px', fontSize: '13px', width: { xs: '100%', sm: 260 } }
            }}
          />
        </Box>

        {/* Content Table */}
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress size={28} sx={{ color: tokens.accent }} />
              <Typography variant="body2" sx={{ mt: 2, color: tokens.muted }}>
                Loading billing history...
              </Typography>
            </Box>
          ) : filteredInvoices.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8, color: tokens.muted }}>
              <ReceiptLongRoundedIcon sx={{ fontSize: 44, color: tokens.line, mb: 1 }} />
              <Typography variant="body1" sx={{ fontWeight: 600, color: tokens.ink }}>
                No invoices found
              </Typography>
              <Typography variant="body2" sx={{ color: tokens.muted, maxWidth: 360, mx: 'auto', mt: 0.5 }}>
                {searchTerm || statusFilter !== 'all'
                  ? 'Try clearing your search query or switching the status filter.'
                  : 'You do not have any invoices issued under your account yet.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: tokens.canvas }}>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>INVOICE #</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>DATE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>DUE DATE</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>SUBSCRIPTION</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>STATUS</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px' }}>TOTAL</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px' }}>BALANCE DUE</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px' }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.map((inv) => {
                    const isDue = Number(inv.amount_due) > 0 && inv.status !== 'cancelled';
                    return (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 700 }} className="tabular-nums">
                          {inv.invoice_number}
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px', color: tokens.ink }}>
                          {inv.invoice_date}
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px', color: isDue ? tokens.status.danger.text : tokens.muted, fontWeight: isDue ? 600 : 400 }}>
                          {inv.due_date}
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px' }}>
                            {inv.plan_name || 'Service Plan'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: tokens.muted }}>
                            {inv.subscription_number || 'Direct Invoice'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={inv.status} />
                        </TableCell>
                        <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600, fontSize: '13px' }}>
                          ${Number(inv.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" className="tabular-nums">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontSize: '13px',
                              color: isDue ? tokens.status.danger.text : tokens.status.success.text
                            }}
                          >
                            ${Number(inv.amount_due).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<ReceiptLongRoundedIcon sx={{ fontSize: 16 }} />}
                              onClick={() => handleOpenInvoice(inv)}
                              sx={{
                                borderColor: tokens.line,
                                color: tokens.ink,
                                fontSize: '12px',
                                textTransform: 'none',
                                py: 0.5,
                                px: 1.5
                              }}
                            >
                              View / Print
                            </Button>
                            {isDue && (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CreditCardRoundedIcon sx={{ fontSize: 16 }} />}
                                onClick={() => {
                                  setActiveInvoice(inv);
                                  setPayConfirmOpen(true);
                                }}
                                sx={{
                                  backgroundColor: tokens.status.success.text,
                                  color: '#FFFFFF',
                                  fontSize: '12px',
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  py: 0.5,
                                  px: 1.5,
                                  '&:hover': { backgroundColor: tokens.status.success.text }
                                }}
                              >
                                Pay Online
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* INSTANT PAY CONFIRMATION DIALOG */}
      <Dialog
        open={payConfirmOpen}
        onClose={() => !payingInvoice && setPayConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        {activeInvoice && (
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '10px',
                  backgroundColor: tokens.status.success.bg,
                  color: tokens.status.success.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <PaymentRoundedIcon sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
                  Settle Invoice Online
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted }}>
                  {activeInvoice.invoice_number}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: tokens.canvas, mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: tokens.muted }}>Total Invoice Amount:</Typography>
                <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                  ${Number(activeInvoice.total_amount).toFixed(2)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: tokens.muted }}>Already Paid:</Typography>
                <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                  ${Number(activeInvoice.amount_paid).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>Due Today:</Typography>
                <Typography variant="body1" className="tabular-nums" sx={{ fontWeight: 800, color: tokens.status.danger.text, fontSize: '18px' }}>
                  ${Number(activeInvoice.amount_due).toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: tokens.muted, display: 'block', mb: 3 }}>
              You will be taken to Stripe's secure payment page to pay by card. Your invoice is updated automatically once payment is confirmed.
            </Typography>

            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => setPayConfirmOpen(false)}
                disabled={payingInvoice}
                sx={{ borderColor: tokens.line, color: tokens.ink, textTransform: 'none' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleExecutePayment}
                disabled={payingInvoice}
                startIcon={payingInvoice ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  backgroundColor: tokens.status.success.text,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { backgroundColor: tokens.status.success.text }
                }}
              >
                {payingInvoice ? 'Processing...' : `Confirm & Pay $${Number(activeInvoice.amount_due).toFixed(2)}`}
              </Button>
            </Stack>
          </Box>
        )}
      </Dialog>

      {/* FULL PRINTABLE TAX INVOICE MODAL */}
      <Dialog
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 0 } }}
      >
        {activeInvoice && (
          <Box sx={{ p: { xs: 2, sm: 4 } }}>
            {/* Action Bar (hidden on print) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
              <Box>
                {Number(activeInvoice.amount_due) > 0 && activeInvoice.status !== 'cancelled' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CreditCardRoundedIcon sx={{ fontSize: 16 }} />}
                    onClick={() => {
                      setInvoiceModalOpen(false);
                      setPayConfirmOpen(true);
                    }}
                    sx={{
                      backgroundColor: tokens.status.success.text,
                      color: '#FFFFFF',
                      fontWeight: 600,
                      textTransform: 'none',
                      mr: 1.5,
                      '&:hover': { backgroundColor: tokens.status.success.text }
                    }}
                  >
                    Pay ${Number(activeInvoice.amount_due).toFixed(2)} Online
                  </Button>
                )}
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PrintRoundedIcon sx={{ fontSize: 16 }} />}
                  onClick={handlePrint}
                  sx={{ borderColor: tokens.line, color: tokens.ink, textTransform: 'none' }}
                >
                  Print / Save PDF
                </Button>
                <IconButton onClick={() => setInvoiceModalOpen(false)} size="small">
                  <CloseRoundedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>
            </Box>

            {/* Printable Paper Sheet */}
            <Card sx={{ p: { xs: 2.5, sm: 4 }, border: `1px solid ${tokens.line}`, borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
              {/* Sheet Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, pb: 3, borderBottom: `2px solid ${tokens.ink}` }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        backgroundColor: tokens.ink,
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 18
                      }}
                    >
                      B
                    </Box>
                    <Typography variant="h2" sx={{ fontSize: '22px', fontWeight: 800 }}>
                      Brightloop Software Inc.
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
                    100 Innovation Way, Suite 400 • billing@brightloop.io • +1 (800) 555-0199
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 800, mb: 0.5 }}>
                    TAX INVOICE
                  </Typography>
                  <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 700, fontSize: '16px', color: tokens.ink, mb: 0.5 }}>
                    {activeInvoice.invoice_number}
                  </Typography>
                  <StatusBadge status={activeInvoice.status} />
                </Box>
              </Box>

              {/* Billed To & Metadata Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4, mb: 4 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                    Billed To:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '16px' }}>
                    {activeInvoice.customer_name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.ink }}>
                    {activeInvoice.customer_company || 'Corporate Client'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: tokens.muted }}>
                    {activeInvoice.customer_email}
                  </Typography>
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
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{activeInvoice.subscription_number || 'Direct Invoice'}</Typography>

                    <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontWeight: 700, textTransform: 'uppercase', mt: 1.5 }}>
                      Billing Period:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '12.5px', color: tokens.muted }}>
                      {activeInvoice.billing_period_start || 'N/A'} → {activeInvoice.billing_period_end || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Line Items Table */}
              <TableContainer sx={{ border: `1px solid ${tokens.line}`, borderRadius: '8px', mb: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: tokens.canvas }}>
                      <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Quantity</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Tax Rate</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Line Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeInvoice.lines && activeInvoice.lines.length > 0 ? (
                      activeInvoice.lines.map((line) => (
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: tokens.muted }}>
                          Single service subscription charge
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Totals & Breakdown */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ maxWidth: 360 }}>
                  {activeInvoice.notes && (
                    <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: tokens.accent50, border: `1px solid ${tokens.accent}30` }}>
                      <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: tokens.accent700, mb: 0.25 }}>
                        BILLING / DISCOUNT NOTICE:
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '13px', color: tokens.ink }}>
                        {activeInvoice.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ width: 280, ml: 'auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ color: tokens.muted }}>Subtotal:</Typography>
                    <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                      ${Number(activeInvoice.subtotal).toFixed(2)}
                    </Typography>
                  </Box>

                  {Number(activeInvoice.discount_amount) > 0 && (
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

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: `1px solid ${tokens.line}` }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>Balance Due:</Typography>
                    <Typography
                      variant="body1"
                      className="tabular-nums"
                      sx={{
                        fontWeight: 800,
                        fontSize: '18px',
                        color: Number(activeInvoice.amount_due) > 0 ? tokens.status.danger.text : tokens.status.success.text
                      }}
                    >
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
