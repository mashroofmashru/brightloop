import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Alert,
  CircularProgress, Divider, Tabs, Tab, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton
} from '@mui/material';
import {
  RefreshCw, Receipt, Building, Mail, Phone, Pause, Play, CheckCircle,
  Printer, CreditCard, X
} from 'lucide-react';
import { subscriptionsApi, invoicesApi, paymentsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LifecycleStepper from '../components/LifecycleStepper';
import { tokens } from '../theme';

export default function CustomerPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0 = Subscriptions, 1 = Invoices
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Invoice view sheet state
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(false);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const [subRes, invRes] = await Promise.all([
        subscriptionsApi.getAll(),
        invoicesApi.getAll()
      ]);
      setSubscriptions(subRes.subscriptions || []);
      setInvoices(invRes.invoices || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load your account data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, []);

  const handleTogglePause = async (sub) => {
    const nextStatus = sub.status === 'paused' ? 'active' : 'paused';
    try {
      await subscriptionsApi.updateStatus(sub.id, { status: nextStatus });
      setSuccessToast(`Subscription ${sub.subscription_number} is now ${nextStatus}.`);
      fetchPortalData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update subscription status');
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

  const handlePayInvoice = async (inv) => {
    try {
      setPayingInvoice(true);
      await paymentsApi.record({
        invoice_id: inv.id,
        method: 'credit_card',
        amount: inv.amount_due,
        payment_date: new Date().toISOString().split('T')[0],
        reference_note: 'Online payment via Customer Self-Service Portal'
      });
      setSuccessToast(`Invoice ${inv.invoice_number} paid successfully.`);
      const refreshed = await invoicesApi.getById(inv.id);
      setActiveInvoice(refreshed.invoice);
      fetchPortalData();
    } catch (err) {
      setErrorMsg(err.message || 'Payment settlement failed');
    } finally {
      setPayingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Customer Header */}
      <Box sx={{ mb: 4 }} className="no-print">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <Typography variant="h1" sx={{ fontSize: '26px', fontWeight: 700 }}>
            Welcome, {user?.name}
          </Typography>
          <StatusBadge status="active" customLabel="Account Verified" />
        </Box>
        <Typography variant="body2" sx={{ color: tokens.muted }}>
          Self-Service Portal for {user?.company_name || 'Client Account'} • View and manage your subscriptions & invoices without emailing support
        </Typography>
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

      <Grid container spacing={3} className="no-print">
        {/* Left: Account Card */}
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
                    <Typography variant="caption" sx={{ color: tokens.muted, display: 'block' }}>Phone Contact</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{user?.phone || '—'}</Typography>
                  </Box>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Subscriptions & Invoices Tabs */}
        <Grid item xs={12} md={8}>
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px' }}>
            <Box sx={{ borderBottom: `1px solid ${tokens.line}`, px: 2, pt: 1 }}>
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                sx={{
                  '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '14px', color: tokens.muted },
                  '& .MuiTabs-indicator': { backgroundColor: tokens.accent, height: 2 }
                }}
              >
                <Tab label={`My Subscriptions (${subscriptions.length})`} />
                <Tab label={`Invoices & Receipts (${invoices.length})`} />
              </Tabs>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* TAB 0: SUBSCRIPTIONS */}
              {activeTab === 0 && (
                <Box>
                  {loading ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <CircularProgress size={24} sx={{ color: tokens.accent }} />
                    </Box>
                  ) : subscriptions.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, color: tokens.muted }}>
                      <Typography variant="body2">You currently have no active subscriptions.</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={3}>
                      {subscriptions.map((sub) => (
                        <Box
                          key={sub.id}
                          sx={{
                            p: 2.5,
                            borderRadius: '10px',
                            border: `1px solid ${tokens.line}`,
                            backgroundColor: tokens.canvas
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                                <Typography variant="h3" sx={{ fontSize: '17px', fontWeight: 700 }}>
                                  {sub.subscription_number}
                                </Typography>
                                <StatusBadge status={sub.status} />
                              </Box>
                              <Typography variant="body2" sx={{ color: tokens.muted, fontSize: '13px' }}>
                                Plan: <strong>{sub.plan_name}</strong> • Billed {sub.billing_interval}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="h2" className="tabular-nums" sx={{ fontSize: '20px', fontWeight: 700, color: tokens.ink }}>
                                ${Number(sub.grand_total).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: tokens.muted }}>per {sub.billing_interval}</Typography>
                            </Box>
                          </Box>

                          {/* Stepper */}
                          <Box sx={{ my: 2, p: 1.5, borderRadius: '8px', backgroundColor: '#FFFFFF', border: `1px solid ${tokens.line}` }}>
                            <LifecycleStepper currentStatus={sub.status} />
                          </Box>

                          {/* Items */}
                          <Box sx={{ mb: 2 }}>
                            {sub.lines?.map((line) => (
                              <Box key={line.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography variant="body2" sx={{ fontSize: '13px', color: tokens.ink }}>
                                  {line.quantity}x {line.description}
                                </Typography>
                                <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600, fontSize: '13px' }}>
                                  ${Number(line.line_total).toFixed(2)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>

                          {/* Self-service pause/resume actions */}
                          {sub.allow_pause === 1 && (sub.status === 'active' || sub.status === 'paused') && (
                            <Box sx={{ pt: 1.5, borderTop: `1px solid ${tokens.line}`, display: 'flex', justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={sub.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                                onClick={() => handleTogglePause(sub)}
                                sx={{
                                  borderColor: sub.status === 'paused' ? tokens.status.success.text : tokens.status.warning.text,
                                  color: sub.status === 'paused' ? tokens.status.success.text : tokens.status.warning.text,
                                  fontSize: '12px'
                                }}
                              >
                                {sub.status === 'paused' ? 'Resume Subscription' : 'Pause Subscription'}
                              </Button>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {/* TAB 1: INVOICES & STATEMENTS */}
              {activeTab === 1 && (
                <Box>
                  {loading ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <CircularProgress size={24} sx={{ color: tokens.accent }} />
                    </Box>
                  ) : invoices.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5, color: tokens.muted }}>
                      <Typography variant="body2">No invoices issued yet.</Typography>
                    </Box>
                  ) : (
                    <TableContainer sx={{ border: `1px solid ${tokens.line}`, borderRadius: '8px' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Invoice #</TableCell>
                            <TableCell>Invoice Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {invoices.map((inv) => (
                            <TableRow key={inv.id} hover>
                              <TableCell sx={{ fontWeight: 700 }} className="tabular-nums">
                                {inv.invoice_number}
                              </TableCell>
                              <TableCell sx={{ fontSize: '13px', color: tokens.muted }}>
                                {inv.invoice_date}
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={inv.status} />
                              </TableCell>
                              <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>
                                ${Number(inv.total_amount).toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => handleViewInvoice(inv)}
                                  sx={{ fontSize: '12px', py: 0.25 }}
                                >
                                  View / Pay
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
            {/* Top Bar (Hidden when printing) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }} className="no-print">
              <Box>
                {activeInvoice.amount_due > 0 && activeInvoice.status !== 'cancelled' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<CreditCard size={15} />}
                    onClick={() => handlePayInvoice(activeInvoice)}
                    disabled={payingInvoice}
                    sx={{ backgroundColor: tokens.status.success.text, mr: 1.5 }}
                  >
                    {payingInvoice ? 'Processing Settlement...' : `Pay $${Number(activeInvoice.amount_due).toFixed(2)} Online`}
                  </Button>
                )}
              </Box>

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

            {/* PRINTABLE INVOICE SHEET */}
            <Card sx={{ p: 4, border: `1px solid ${tokens.line}`, borderRadius: '12px', backgroundColor: '#FFFFFF' }}>
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
