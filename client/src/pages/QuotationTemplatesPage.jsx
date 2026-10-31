import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Stack, IconButton, Chip
} from '@mui/material';
import { FileText, Plus, Trash2, ArrowRight, Layers, X } from 'lucide-react';
import { templatesApi, productsApi, plansApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../theme';

export default function QuotationTemplatesPage({ onUseTemplate }) {
  const { isInternal } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Modal State
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    plan_id: '',
    validity_days: '30',
    notes: '',
    lines: [
      { product_id: '', variant_id: '', quantity: '1', unit_price: '', discount_percent: '0' }
    ]
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tmplRes, prodRes, planRes] = await Promise.all([
        templatesApi.getAll(),
        productsApi.getAll(),
        plansApi.getAll()
      ]);
      setTemplates(tmplRes.templates || []);
      setProducts(prodRes.products || []);
      setPlans(planRes.plans || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setForm({
      name: '',
      plan_id: plans[0]?.id || '',
      validity_days: '30',
      notes: '',
      lines: [
        { product_id: products[0]?.id || '', variant_id: '', quantity: '1', unit_price: String(products[0]?.sales_price || 0), discount_percent: '0' }
      ]
    });
    setOpenModal(true);
  };

  const handleAddLine = () => {
    const firstProd = products[0];
    setForm(prev => ({
      ...prev,
      lines: [
        ...prev.lines,
        { product_id: firstProd?.id || '', variant_id: '', quantity: '1', unit_price: String(firstProd?.sales_price || 0), discount_percent: '0' }
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
          updated[idx].unit_price = String(prod.sales_price);
          updated[idx].variant_id = '';
        }
      } else if (field === 'variant_id' && value) {
        const prod = products.find(p => p.id === parseInt(updated[idx].product_id, 10));
        const variant = prod?.variants?.find(v => v.id === parseInt(value, 10));
        if (variant && prod) {
          updated[idx].unit_price = String(prod.sales_price + variant.price_extra);
        }
      }

      return { ...prev, lines: updated };
    });
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('Template name is required');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      await templatesApi.create(form);
      setSuccessToast(`Quotation template "${form.name}" created successfully.`);
      setOpenModal(false);
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      await templatesApi.delete(id);
      setSuccessToast('Template removed.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete template');
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700, mb: 0.5 }}>
            Quotation Templates
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Standardize sales offers with pre-configured plans and product lines valid for a set number of days.
          </Typography>
        </Box>

        {isInternal && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={handleOpenModal}
            sx={{
              backgroundColor: tokens.accent,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13.5px',
              '&:hover': { backgroundColor: tokens.accent600 }
            }}
          >
            Create Quotation Template
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

      {/* Templates List */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Template Name</TableCell>
                <TableCell>Default Recurring Plan</TableCell>
                <TableCell>Validity Window</TableCell>
                <TableCell>Pre-configured Lines</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: tokens.accent }} />
                  </TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                    No quotation templates found.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((tmpl) => (
                  <TableRow key={tmpl.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: tokens.ink }}>
                      {tmpl.name}
                      {tmpl.notes && (
                        <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontSize: '12px' }}>
                          {tmpl.notes}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {tmpl.plan_name ? (
                        <Chip
                          label={`${tmpl.plan_name} ($${Number(tmpl.plan_price).toFixed(2)}/${tmpl.billing_interval})`}
                          size="small"
                          sx={{ fontSize: '12px', fontWeight: 500 }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: tokens.muted }}>Custom / Flexible</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: tokens.muted, fontSize: '13px' }}>
                      {tmpl.validity_days} days
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        {tmpl.lines?.map((line) => (
                          <Typography key={line.id} variant="body2" sx={{ fontSize: '12.5px', color: tokens.ink }}>
                            • {line.quantity}x {line.product_name} {line.attribute_value ? `(${line.attribute_value})` : ''} — ${Number(line.unit_price).toFixed(2)}
                            {line.discount_percent > 0 ? ` (${line.discount_percent}% off)` : ''}
                          </Typography>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={<ArrowRight size={14} />}
                          onClick={() => onUseTemplate(tmpl)}
                          sx={{ fontSize: '12px', py: 0.5, borderColor: tokens.accent, color: tokens.accent }}
                        >
                          Start Quote
                        </Button>
                        <IconButton size="small" onClick={() => handleDeleteTemplate(tmpl.id)}>
                          <Trash2 size={15} color={tokens.status.danger.text} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* CREATE TEMPLATE DIALOG */}
      <Dialog
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
              Build Quotation Template
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Save preset product bundles so sales reps don't have to build quotes from scratch.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small" disabled={submitting}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveTemplate}>
          <DialogContent sx={{ pt: 1 }}>
            <Stack spacing={2.5}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Template Name *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. Enterprise Cloud + Dedicated Support"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Validity Window (Days) *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={form.validity_days}
                    onChange={(e) => setForm({ ...form, validity_days: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Associated Recurring Plan
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={form.plan_id}
                    onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                    disabled={submitting}
                  >
                    <MenuItem value="">None / Flexible</MenuItem>
                    {plans.map(p => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name} (${Number(p.price).toFixed(2)}/{p.billing_interval})
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Notes
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Internal reference notes..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              {/* LINE ITEMS */}
              <Box sx={{ borderTop: `1px solid ${tokens.line}`, pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '14px' }}>
                    Preset Line Items
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={14} />}
                    onClick={handleAddLine}
                    disabled={submitting}
                    sx={{ fontSize: '12px' }}
                  >
                    Add Line
                  </Button>
                </Box>

                <Stack spacing={1.5}>
                  {form.lines.map((l, idx) => {
                    const selectedProd = products.find(p => p.id === parseInt(l.product_id, 10));
                    const prodVariants = selectedProd?.variants || [];

                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1.5fr 1fr 1.2fr 1fr 40px',
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
                          value={l.product_id}
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
                          value={l.variant_id}
                          onChange={(e) => handleLineChange(idx, 'variant_id', e.target.value)}
                          disabled={submitting || prodVariants.length === 0}
                        >
                          <MenuItem value="">Standard (Included)</MenuItem>
                          {prodVariants.map(v => (
                            <MenuItem key={v.id} value={v.id}>
                              {v.attribute_value} (+${Number(v.price_extra).toFixed(2)})
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          size="small"
                          type="number"
                          label="Qty"
                          value={l.quantity}
                          onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                          disabled={submitting}
                        />

                        <TextField
                          size="small"
                          type="number"
                          step="0.01"
                          label="Unit Price ($)"
                          value={l.unit_price}
                          onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                          disabled={submitting}
                        />

                        <TextField
                          size="small"
                          type="number"
                          label="Disc %"
                          value={l.discount_percent}
                          onChange={(e) => handleLineChange(idx, 'discount_percent', e.target.value)}
                          disabled={submitting}
                        />

                        <IconButton
                          size="small"
                          onClick={() => handleRemoveLine(idx)}
                          disabled={form.lines.length <= 1 || submitting}
                          sx={{ color: tokens.status.danger.text }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Stack>
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
              {submitting ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
