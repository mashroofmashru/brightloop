import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Stack, IconButton,
  Chip, LinearProgress
} from '@mui/material';
import { Percent, Plus, Edit3, Tag, X } from 'lucide-react';
import { discountsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../theme';

export default function DiscountsPage() {
  const { isAdmin } = useAuth();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

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

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const discRes = await discountsApi.getAll();
      setDiscounts(discRes.discounts || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleOpenDiscountModal = (discount = null) => {
    setErrorMsg('');
    if (discount) {
      setEditingDiscountId(discount.id);
      setDiscountForm({
        name: discount.name,
        code: discount.code,
        discount_type: discount.discount_type,
        value: String(discount.value),
        min_order_amount: String(discount.min_order_amount || 0),
        min_quantity: String(discount.min_quantity || 0),
        start_date: discount.start_date || '',
        end_date: discount.end_date || '',
        usage_limit: discount.usage_limit ? String(discount.usage_limit) : '',
        scope: discount.scope || 'order',
        target_product_id: discount.target_product_id || ''
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
        usage_limit: '',
        scope: 'order',
        target_product_id: ''
      });
    }
    setDiscountModalOpen(true);
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    if (!discountForm.name.trim() || !discountForm.code.trim() || discountForm.value === '') {
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
      fetchDiscounts();
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
            Conditional Discounts
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Define automated volume/seat discounts, promotional promo codes, and redemption caps applied on billing days.
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => handleOpenDiscountModal()}
            sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
          >
            Create Discount Rule
          </Button>
        )}
      </Box>

      {successToast && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setSuccessToast('')}>
          {successToast}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setErrorMsg('')}>
          {errorMsg}
        </Alert>
      )}

      {/* DISCOUNTS TABLE */}
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
                    No conditional discount rules defined.
                  </TableCell>
                </TableRow>
              ) : (
                discounts.map((disc) => {
                  const percentUsed = disc.usage_limit
                    ? Math.min(100, Math.round((disc.redemption_count / disc.usage_limit) * 100))
                    : 0;

                  return (
                    <TableRow key={disc.id} hover>
                      <TableCell>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{disc.name}</Typography>
                        <Chip
                          label={disc.code}
                          size="small"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: tokens.accent50,
                            color: tokens.accent700,
                            mt: 0.5
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={disc.discount_type === 'percent' ? `${disc.value}% OFF` : `-$${Number(disc.value).toFixed(2)}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            backgroundColor: tokens.status.success.tint,
                            color: tokens.status.success.text
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '12.5px' }}>
                          {disc.min_order_amount > 0 && `Min $${disc.min_order_amount} `}
                          {disc.min_quantity > 0 && `Min ${disc.min_quantity} seats`}
                          {disc.min_order_amount === 0 && disc.min_quantity === 0 && 'Any Order'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={disc.scope === 'order' ? 'Entire Subscription' : 'Specific Product'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '11px' }}
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 180 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            used {disc.redemption_count} of {disc.usage_limit || '∞'}
                          </Typography>
                          {disc.usage_limit && (
                            <Typography variant="caption" sx={{ color: tokens.muted }}>
                              {percentUsed}%
                            </Typography>
                          )}
                        </Box>
                        {disc.usage_limit && (
                          <LinearProgress
                            variant="determinate"
                            value={percentUsed}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: tokens.line,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: percentUsed >= 90 ? tokens.status.danger.text : tokens.accent
                              }
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12.5px', color: tokens.muted }}>
                        {disc.start_date || 'Evergreen'} → {disc.end_date || 'No Expiry'}
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
                    onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
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
