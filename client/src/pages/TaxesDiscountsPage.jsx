import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Stack, IconButton,
  Chip, LinearProgress
} from '@mui/material';
import { Landmark, Percent, Plus, Edit3, Trash2, Tag, CheckCircle2, X } from 'lucide-react';
import { taxesApi, discountsApi, productsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function TaxesDiscountsPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0 = Discounts, 1 = Taxes

  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Tax Modal State
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState(null);
  const [taxForm, setTaxForm] = useState({ name: '', rate: '', tax_type: 'exclusive' });

  // Discount Modal State
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    name: '',
    code: '',
    discount_type: 'percent',
    value: '',
    min_order_amount: '0',
    min_quantity: '0',
    start_date: '',
    end_date: '',
    usage_limit: '',
    scope: 'order',
    target_product_id: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [taxRes, discRes, prodRes] = await Promise.all([
        taxesApi.getAll(),
        discountsApi.getAll(),
        productsApi.getAll()
      ]);
      setTaxes(taxRes.taxes || []);
      setDiscounts(discRes.discounts || []);
      setProducts(prodRes.products || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Tax Handlers
  const handleOpenTaxModal = (tax = null) => {
    setErrorMsg('');
    if (tax) {
      setEditingTaxId(tax.id);
      setTaxForm({ name: tax.name, rate: String(tax.rate), tax_type: tax.tax_type });
    } else {
      setEditingTaxId(null);
      setTaxForm({ name: '', rate: '', tax_type: 'exclusive' });
    }
    setTaxModalOpen(true);
  };

  const handleSaveTax = async (e) => {
    e.preventDefault();
    if (!taxForm.name.trim() || taxForm.rate === '') {
      setErrorMsg('Tax name and rate are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      if (editingTaxId) {
        await taxesApi.update(editingTaxId, taxForm);
        setSuccessToast(`Tax rule "${taxForm.name}" updated.`);
      } else {
        await taxesApi.create(taxForm);
        setSuccessToast(`Tax rule "${taxForm.name}" created.`);
      }
      setTaxModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save tax rule');
    } finally {
      setSubmitting(false);
    }
  };

  // Discount Handlers
  const handleOpenDiscountModal = (disc = null) => {
    setErrorMsg('');
    if (disc) {
      setEditingDiscountId(disc.id);
      setDiscountForm({
        name: disc.name,
        code: disc.code,
        discount_type: disc.discount_type,
        value: String(disc.value),
        min_order_amount: String(disc.min_order_amount || 0),
        min_quantity: String(disc.min_quantity || 0),
        start_date: disc.start_date || '',
        end_date: disc.end_date || '',
        usage_limit: disc.usage_limit ? String(disc.usage_limit) : '',
        scope: disc.scope || 'order',
        target_product_id: disc.target_product_id || ''
      });
    } else {
      setEditingDiscountId(null);
      setDiscountForm({
        name: '',
        code: '',
        discount_type: 'percent',
        value: '',
        min_order_amount: '0',
        min_quantity: '0',
        start_date: '',
        end_date: '',
        usage_limit: '100',
        scope: 'order',
        target_product_id: ''
      });
    }
    setDiscountModalOpen(true);
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    if (!discountForm.name.trim() || !discountForm.code.trim() || !discountForm.value) {
      setErrorMsg('Discount name, promo code, and value are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      if (editingDiscountId) {
        await discountsApi.update(editingDiscountId, discountForm);
        setSuccessToast(`Discount rule "${discountForm.code}" updated.`);
      } else {
        await discountsApi.create(discountForm);
        setSuccessToast(`Discount rule "${discountForm.code}" created.`);
      }
      setDiscountModalOpen(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save discount rule');
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
            Taxes & Conditional Discounts
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Define tax calculation rules and automated volume/seat discounts applied on recurring billing days.
          </Typography>
        </Box>

        {isAdmin && (
          <Stack direction="row" spacing={1.5}>
            {activeTab === 0 ? (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => handleOpenDiscountModal()}
                sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
              >
                Create Discount Rule
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => handleOpenTaxModal()}
                sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
              >
                Add Tax Rule
              </Button>
            )}
          </Stack>
        )}
      </Box>

      {successToast && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setSuccessToast('')}>
          {successToast}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: `1px solid ${tokens.line}`, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '14px', color: tokens.muted },
            '& .MuiTabs-indicator': { backgroundColor: tokens.accent, height: 2 }
          }}
        >
          <Tab label={`Conditional Discounts (${discounts.length})`} />
          <Tab label={`Tax Rules (${taxes.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: DISCOUNTS */}
      {activeTab === 0 && (
        <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Discount Name & Code</TableCell>
                  <TableCell>Discount Value</TableCell>
                  <TableCell>Eligibility Criteria</TableCell>
                  <TableCell>Scope</TableCell>
                  <TableCell>Redemption Progress (used X of Y)</TableCell>
                  <TableCell>Validity Period</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress size={24} sx={{ color: tokens.accent }} />
                    </TableCell>
                  </TableRow>
                ) : discounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                      No discount rules defined.
                    </TableCell>
                  </TableRow>
                ) : (
                  discounts.map((disc) => {
                    const usageLimit = disc.usage_limit || 0;
                    const used = disc.redemption_count || 0;
                    const percentUsed = usageLimit > 0 ? Math.min(100, Math.round((used / usageLimit) * 100)) : 0;

                    return (
                      <TableRow key={disc.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {disc.name}
                          <Typography variant="body2" className="tabular-nums" sx={{ fontFamily: 'monospace', fontSize: '12px', color: tokens.accent, fontWeight: 700 }}>
                            {disc.code}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={disc.discount_type === 'percent' ? `${disc.value}% OFF` : `-$${Number(disc.value).toFixed(2)}`}
                            size="small"
                            sx={{
                              backgroundColor: tokens.status.success.tint,
                              color: tokens.status.success.text,
                              fontWeight: 700,
                              fontSize: '12px'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '13px', color: tokens.muted }}>
                          {disc.min_order_amount > 0 && `Min $${disc.min_order_amount} `}
                          {disc.min_quantity > 0 && `Min ${disc.min_quantity} seats`}
                          {disc.min_order_amount === 0 && disc.min_quantity === 0 && 'No minimum'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={disc.scope === 'order' ? 'Entire Subscription' : 'Specific Product'}
                            size="small"
                            sx={{ fontSize: '11px' }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 220 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: tokens.ink }}>
                              used {used} of {disc.usage_limit ? disc.usage_limit : '∞'}
                            </Typography>
                            {disc.usage_limit && (
                              <Typography variant="caption" sx={{ color: tokens.muted }}>
                                {percentUsed}%
                              </Typography>
                            )}
                          </Box>
                          {disc.usage_limit ? (
                            <LinearProgress
                              variant="determinate"
                              value={percentUsed}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: tokens.line,
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: percentUsed >= 100 ? tokens.status.danger.text : tokens.accent
                                }
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: tokens.muted }}>Unlimited redemptions</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '12.5px', color: tokens.muted }}>
                          {disc.start_date ? `${disc.start_date} → ${disc.end_date || 'No End'}` : 'Always Active'}
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenDiscountModal(disc)}>
                              <Edit3 size={15} color={tokens.muted} />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 1: TAXES */}
      {activeTab === 1 && (
        <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tax Rule Name</TableCell>
                  <TableCell align="right">Tax Rate (%)</TableCell>
                  <TableCell>Tax Type</TableCell>
                  <TableCell>Status</TableCell>
                  {isAdmin && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress size={24} sx={{ color: tokens.accent }} />
                    </TableCell>
                  </TableRow>
                ) : taxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                      No tax rules defined.
                    </TableCell>
                  </TableRow>
                ) : (
                  taxes.map((tax) => (
                    <TableRow key={tax.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{tax.name}</TableCell>
                      <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>
                        {tax.rate.toFixed(1)}%
                      </TableCell>
                      <TableCell sx={{ textTransform: 'capitalize', color: tokens.muted }}>
                        {tax.tax_type}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={tax.is_active ? 'active' : 'closed'} customLabel={tax.is_active ? 'Active' : 'Archived'} size="small" />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleOpenTaxModal(tax)}>
                            <Edit3 size={15} color={tokens.muted} />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAX MODAL */}
      <Dialog open={taxModalOpen} onClose={() => setTaxModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingTaxId ? 'Edit Tax Rule' : 'Add Tax Rule'}
        </DialogTitle>
        <form onSubmit={handleSaveTax}>
          <DialogContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Tax Rule Name *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. Standard VAT (15%)"
                  value={taxForm.name}
                  onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                  disabled={submitting}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Percentage Rate (%) *
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  step="0.1"
                  placeholder="15.0"
                  value={taxForm.rate}
                  onChange={(e) => setTaxForm({ ...taxForm, rate: e.target.value })}
                  disabled={submitting}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Calculation Type
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={taxForm.tax_type}
                  onChange={(e) => setTaxForm({ ...taxForm, tax_type: e.target.value })}
                  disabled={submitting}
                >
                  <MenuItem value="exclusive">Exclusive (Added to subtotal)</MenuItem>
                  <MenuItem value="inclusive">Inclusive (Embedded in price)</MenuItem>
                </TextField>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setTaxModalOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: tokens.accent }}>Save Tax Rule</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* DISCOUNT MODAL */}
      <Dialog open={discountModalOpen} onClose={() => setDiscountModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDiscountId ? 'Edit Discount Rule' : 'Create Discount Rule'}
        </DialogTitle>
        <form onSubmit={handleSaveDiscount}>
          <DialogContent>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Discount Name *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. High Volume Seat Credit"
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Promo Code *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="VOLUME100"
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Discount Type *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={discountForm.discount_type}
                    onChange={(e) => setDiscountForm({ ...discountForm, discount_type: e.target.value })}
                    disabled={submitting}
                  >
                    <MenuItem value="percent">Percentage (%)</MenuItem>
                    <MenuItem value="fixed">Fixed Amount ($)</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Value ({discountForm.discount_type === 'percent' ? '%' : '$'}) *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    step="0.01"
                    placeholder="20"
                    value={discountForm.value}
                    onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Min Purchase ($)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={discountForm.min_order_amount}
                    onChange={(e) => setDiscountForm({ ...discountForm, min_order_amount: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Min Quantity / Seats
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={discountForm.min_quantity}
                    onChange={(e) => setDiscountForm({ ...discountForm, min_quantity: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Usage Limit (Max Uses)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    placeholder="e.g. 50"
                    value={discountForm.usage_limit}
                    onChange={(e) => setDiscountForm({ ...discountForm, usage_limit: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Start Date
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={discountForm.start_date}
                    onChange={(e) => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                    disabled={submitting}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    End Date
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={discountForm.end_date}
                    onChange={(e) => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                    disabled={submitting}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDiscountModalOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: tokens.accent }}>
              Save Discount Rule
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
