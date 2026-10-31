import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, FormControlLabel, Switch, Alert,
  CircularProgress, Stack, IconButton, Chip, InputAdornment, Tooltip
} from '@mui/material';
import {
  Package, Plus, Trash2, Edit3, Search, Calendar, Tag, Layers, CheckCircle2, X
} from 'lucide-react';
import { productsApi, plansApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function ProductsPlansPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0 = Products, 1 = Plans

  // Products state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');

  // Plans state
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [planIntervalFilter, setPlanIntervalFilter] = useState('');

  // Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    type: 'software',
    sales_price: '',
    cost_price: '',
    notes: '',
    variants: [
      { attribute_name: 'Brand', attribute_value: 'Standard', price_extra: '0.00', sku: '' }
    ]
  });

  // Plan Modal State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    code: '',
    price: '',
    billing_interval: 'monthly',
    min_quantity: '1',
    available_from: '',
    available_until: '',
    auto_close_on_end: false,
    allow_early_close: true,
    allow_pause: true,
    allow_renewal: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Fetch Data
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const params = {};
      if (productSearch) params.search = productSearch;
      if (productTypeFilter) params.type = productTypeFilter;
      const res = await productsApi.getAll(params);
      setProducts(res.products || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const params = {};
      if (planIntervalFilter) params.interval = planIntervalFilter;
      const res = await plansApi.getAll(params);
      setPlans(res.plans || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load recurring plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchPlans();
  }, [productSearch, productTypeFilter, planIntervalFilter]);

  // Product Form Handlers
  const handleOpenProductModal = (product = null) => {
    setErrorMsg('');
    if (product) {
      setEditingProductId(product.id);
      setProductForm({
        name: product.name,
        type: product.type,
        sales_price: String(product.sales_price),
        cost_price: String(product.cost_price || ''),
        notes: product.notes || '',
        variants: product.variants?.length > 0 ? product.variants.map(v => ({
          attribute_name: v.attribute_name,
          attribute_value: v.attribute_value,
          price_extra: String(v.price_extra),
          sku: v.sku || ''
        })) : [{ attribute_name: 'Brand', attribute_value: 'Standard', price_extra: '0.00', sku: '' }]
      });
    } else {
      setEditingProductId(null);
      setProductForm({
        name: '',
        type: 'software',
        sales_price: '',
        cost_price: '',
        notes: '',
        variants: [
          { attribute_name: 'Brand', attribute_value: 'Standard', price_extra: '0.00', sku: '' },
          { attribute_name: 'Brand', attribute_value: 'Odoo', price_extra: '560.00', sku: 'ODOO-ADDON' }
        ]
      });
    }
    setProductModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...prev.variants, { attribute_name: 'Brand', attribute_value: '', price_extra: '0.00', sku: '' }]
    }));
  };

  const handleRemoveVariantRow = (index) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index)
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setProductForm(prev => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name.trim() || !productForm.sales_price) {
      setErrorMsg('Product name and sales price are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      if (editingProductId) {
        await productsApi.update(editingProductId, productForm);
        setSuccessToast(`Product "${productForm.name}" updated successfully.`);
      } else {
        await productsApi.create(productForm);
        setSuccessToast(`Product "${productForm.name}" created successfully.`);
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  // Plan Form Handlers
  const handleOpenPlanModal = (plan = null) => {
    setErrorMsg('');
    if (plan) {
      setEditingPlanId(plan.id);
      setPlanForm({
        name: plan.name,
        code: plan.code,
        price: String(plan.price),
        billing_interval: plan.billing_interval,
        min_quantity: String(plan.min_quantity),
        available_from: plan.available_from || '',
        available_until: plan.available_until || '',
        auto_close_on_end: Boolean(plan.auto_close_on_end),
        allow_early_close: Boolean(plan.allow_early_close),
        allow_pause: Boolean(plan.allow_pause),
        allow_renewal: Boolean(plan.allow_renewal)
      });
    } else {
      setEditingPlanId(null);
      setPlanForm({
        name: '',
        code: '',
        price: '',
        billing_interval: 'monthly',
        min_quantity: '1',
        available_from: '',
        available_until: '',
        auto_close_on_end: false,
        allow_early_close: true,
        allow_pause: true,
        allow_renewal: true
      });
    }
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    if (!planForm.name.trim() || !planForm.code.trim() || !planForm.price) {
      setErrorMsg('Plan name, code, and price are required.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      if (editingPlanId) {
        await plansApi.update(editingPlanId, planForm);
        setSuccessToast(`Plan "${planForm.name}" updated successfully.`);
      } else {
        await plansApi.create(planForm);
        setSuccessToast(`Plan "${planForm.name}" created successfully.`);
      }
      setPlanModalOpen(false);
      fetchPlans();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save recurring plan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h1" sx={{ fontSize: '24px', fontWeight: 700, mb: 0.5 }}>
            Products, Variants & Recurring Plans
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Configure software offerings, custom brand pricing variants, and recurring billing cadences.
          </Typography>
        </Box>

        {isAdmin && (
          <Stack direction="row" spacing={1.5}>
            {activeTab === 0 ? (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => handleOpenProductModal()}
                sx={{
                  backgroundColor: tokens.accent,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  '&:hover': { backgroundColor: tokens.accent600 }
                }}
              >
                Add Product
              </Button>
            ) : (
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={() => handleOpenPlanModal()}
                sx={{
                  backgroundColor: tokens.accent,
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  '&:hover': { backgroundColor: tokens.accent600 }
                }}
              >
                Create Recurring Plan
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
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '14px',
              color: tokens.muted,
              minHeight: 48,
              '&.Mui-selected': { color: tokens.accent }
            },
            '& .MuiTabs-indicator': { backgroundColor: tokens.accent, height: 2 }
          }}
        >
          <Tab label={`Products & Variants (${products.length})`} />
          <Tab label={`Recurring Plans (${plans.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: PRODUCTS & VARIANTS */}
      {activeTab === 0 && (
        <Box>
          {/* Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search products or notes..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              sx={{ width: 300, backgroundColor: tokens.surface }}
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
              value={productTypeFilter}
              onChange={(e) => setProductTypeFilter(e.target.value)}
              sx={{ width: 180, backgroundColor: tokens.surface }}
            >
              <MenuItem value="">All Product Types</MenuItem>
              <MenuItem value="software">Software</MenuItem>
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="physical">Physical</MenuItem>
            </TextField>
          </Box>

          {/* Products Table */}
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell align="right">Base Sales Price</TableCell>
                    <TableCell align="right">Cost Price</TableCell>
                    <TableCell>Configured Variants</TableCell>
                    <TableCell>Status</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingProducts ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: tokens.accent }} />
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                        No products match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((prod) => (
                      <TableRow key={prod.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: tokens.ink }}>
                          {prod.name}
                          {prod.notes && (
                            <Typography variant="caption" sx={{ display: 'block', color: tokens.muted, fontSize: '12px' }}>
                              {prod.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={prod.type}
                            size="small"
                            sx={{
                              backgroundColor: tokens.canvas,
                              textTransform: 'capitalize',
                              fontSize: '11px',
                              fontWeight: 500,
                              border: `1px solid ${tokens.line}`
                            }}
                          />
                        </TableCell>
                        <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600 }}>
                          ${Number(prod.sales_price).toFixed(2)}
                        </TableCell>
                        <TableCell align="right" className="tabular-nums" sx={{ color: tokens.muted }}>
                          ${Number(prod.cost_price || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                            {prod.variants?.length > 0 ? (
                              prod.variants.map((v) => (
                                <Chip
                                  key={v.id}
                                  label={`${v.attribute_name}: ${v.attribute_value} (${v.price_extra > 0 ? `+$${Number(v.price_extra).toFixed(2)}` : 'Included'})`}
                                  size="small"
                                  sx={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    backgroundColor: v.attribute_value === 'Odoo' ? tokens.accent50 : tokens.canvas,
                                    color: v.attribute_value === 'Odoo' ? tokens.accent700 : tokens.ink,
                                    border: `1px solid ${v.attribute_value === 'Odoo' ? tokens.accent + '40' : tokens.line}`
                                  }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption" sx={{ color: tokens.muted }}>
                                No variants defined
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={prod.is_active ? 'active' : 'closed'} customLabel={prod.is_active ? 'Available' : 'Archived'} size="small" />
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenProductModal(prod)}>
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
        </Box>
      )}

      {/* TAB 1: RECURRING PLANS */}
      {activeTab === 1 && (
        <Box>
          {/* Plan Filter Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <TextField
              select
              size="small"
              value={planIntervalFilter}
              onChange={(e) => setPlanIntervalFilter(e.target.value)}
              sx={{ width: 220, backgroundColor: tokens.surface }}
            >
              <MenuItem value="">All Billing Intervals</MenuItem>
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </TextField>
          </Box>

          {/* Plans Table */}
          <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Plan Name</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Recurring Price</TableCell>
                    <TableCell>Billing Interval</TableCell>
                    <TableCell align="center">Min Qty</TableCell>
                    <TableCell>Lifecycle Rules</TableCell>
                    <TableCell>Availability</TableCell>
                    {isAdmin && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingPlans ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 8 : 7} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={24} sx={{ color: tokens.accent }} />
                      </TableCell>
                    </TableRow>
                  ) : plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 8 : 7} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                        No recurring plans found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan) => (
                      <TableRow key={plan.id} hover>
                        <TableCell sx={{ fontWeight: 600, color: tokens.ink }}>
                          {plan.name}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="tabular-nums" sx={{ fontFamily: 'monospace', fontSize: '12px', color: tokens.muted }}>
                            {plan.code}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" className="tabular-nums" sx={{ fontWeight: 600, fontSize: '15px' }}>
                          ${Number(plan.price).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={plan.billing_interval}
                            size="small"
                            sx={{
                              textTransform: 'capitalize',
                              fontWeight: 600,
                              fontSize: '11px',
                              backgroundColor: tokens.status.info.tint,
                              color: tokens.status.info.text
                            }}
                          />
                        </TableCell>
                        <TableCell align="center" className="tabular-nums">
                          {plan.min_quantity}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {plan.auto_close_on_end === 1 && (
                              <Chip label="Auto-Close" size="small" sx={{ fontSize: '10px', height: 20 }} />
                            )}
                            {plan.allow_early_close === 1 && (
                              <Chip label="Early Close" size="small" sx={{ fontSize: '10px', height: 20 }} />
                            )}
                            {plan.allow_pause === 1 && (
                              <Chip label="Pausable" size="small" sx={{ fontSize: '10px', height: 20, backgroundColor: tokens.status.warning.tint, color: tokens.status.warning.text }} />
                            )}
                            {plan.allow_renewal === 1 && (
                              <Chip label="Renewable" size="small" sx={{ fontSize: '10px', height: 20, backgroundColor: tokens.status.success.tint, color: tokens.status.success.text }} />
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', color: tokens.muted }}>
                          {plan.available_from ? `${plan.available_from} → ${plan.available_until || 'Ongoing'}` : 'Always Active'}
                        </TableCell>
                        {isAdmin && (
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => handleOpenPlanModal(plan)}>
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
        </Box>
      )}

      {/* CREATE/EDIT PRODUCT MODAL */}
      <Dialog
        open={productModalOpen}
        onClose={() => !submitting && setProductModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
              {editingProductId ? 'Edit Product & Variants' : 'Launch New Product'}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Specify sales price, cost price, and attribute modifiers (e.g. Odoo brand +560).
            </Typography>
          </Box>
          <IconButton onClick={() => setProductModalOpen(false)} size="small" disabled={submitting}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSaveProduct}>
          <DialogContent sx={{ pt: 1 }}>
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {errorMsg}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Product Name *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. Brightloop Cloud Platform"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Type *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                    disabled={submitting}
                  >
                    <MenuItem value="software">Software</MenuItem>
                    <MenuItem value="service">Service</MenuItem>
                    <MenuItem value="physical">Physical</MenuItem>
                  </TextField>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Sales Price ($) *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    step="0.01"
                    placeholder="1200.00"
                    value={productForm.sales_price}
                    onChange={(e) => setProductForm({ ...productForm, sales_price: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Cost Price ($)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    step="0.01"
                    placeholder="350.00"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                  Internal Notes & Description
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Notes for sales team and quotation builders..."
                  value={productForm.notes}
                  onChange={(e) => setProductForm({ ...productForm, notes: e.target.value })}
                  disabled={submitting}
                />
              </Box>

              {/* VARIANTS SECTION */}
              <Box sx={{ borderTop: `1px solid ${tokens.line}`, pt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '14px' }}>
                      Product Variants & Surcharges
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.muted }}>
                      Configure attributes such as Brand where choosing Odoo adds $560.00.
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Plus size={14} />}
                    onClick={handleAddVariantRow}
                    disabled={submitting}
                    sx={{ fontSize: '12px' }}
                  >
                    Add Variant Row
                  </Button>
                </Box>

                <Stack spacing={1.5}>
                  {productForm.variants.map((v, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1.5fr 1.2fr 1.2fr 40px',
                        gap: 1.5,
                        alignItems: 'center',
                        p: 1.25,
                        borderRadius: '8px',
                        backgroundColor: tokens.canvas,
                        border: `1px solid ${tokens.line}`
                      }}
                    >
                      <TextField
                        size="small"
                        placeholder="Attribute (e.g. Brand)"
                        value={v.attribute_name}
                        onChange={(e) => handleVariantChange(idx, 'attribute_name', e.target.value)}
                        disabled={submitting}
                      />
                      <TextField
                        size="small"
                        placeholder="Value (e.g. Odoo)"
                        value={v.attribute_value}
                        onChange={(e) => handleVariantChange(idx, 'attribute_value', e.target.value)}
                        disabled={submitting}
                      />
                      <TextField
                        size="small"
                        type="number"
                        step="0.01"
                        placeholder="Price Extra ($)"
                        value={v.price_extra}
                        onChange={(e) => handleVariantChange(idx, 'price_extra', e.target.value)}
                        disabled={submitting}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">+$</InputAdornment>
                        }}
                      />
                      <TextField
                        size="small"
                        placeholder="SKU Code"
                        value={v.sku}
                        onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                        disabled={submitting}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveVariantRow(idx)}
                        disabled={productForm.variants.length <= 1 || submitting}
                        sx={{ color: tokens.status.danger.text }}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setProductModalOpen(false)} disabled={submitting} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
            >
              {submitting ? 'Saving...' : editingProductId ? 'Update Product' : 'Save & Launch Product'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CREATE/EDIT PLAN MODAL */}
      <Dialog
        open={planModalOpen}
        onClose={() => !submitting && setPlanModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
              {editingPlanId ? 'Edit Recurring Plan' : 'Create Recurring Plan'}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Define cadence (daily/weekly/monthly/yearly) and lifecycle policies.
            </Typography>
          </Box>
          <IconButton onClick={() => setPlanModalOpen(false)} size="small" disabled={submitting}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSavePlan}>
          <DialogContent sx={{ pt: 1 }}>
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {errorMsg}
              </Alert>
            )}

            <Stack spacing={2.5}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Plan Name *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. Monthly Pro Business"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Plan Code *
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="PLAN-MTH-PRO"
                    value={planForm.code}
                    onChange={(e) => setPlanForm({ ...planForm, code: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Recurring Price ($) *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    step="0.01"
                    placeholder="199.00"
                    value={planForm.price}
                    onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Billing Interval *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={planForm.billing_interval}
                    onChange={(e) => setPlanForm({ ...planForm, billing_interval: e.target.value })}
                    disabled={submitting}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </TextField>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Minimum Quantity *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={planForm.min_quantity}
                    onChange={(e) => setPlanForm({ ...planForm, min_quantity: e.target.value })}
                    disabled={submitting}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Available From (Date)
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={planForm.available_from}
                    onChange={(e) => setPlanForm({ ...planForm, available_from: e.target.value })}
                    disabled={submitting}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                    Available Until (Date)
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={planForm.available_until}
                    onChange={(e) => setPlanForm({ ...planForm, available_until: e.target.value })}
                    disabled={submitting}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              {/* LIFECYCLE RULES */}
              <Box sx={{ borderTop: `1px solid ${tokens.line}`, pt: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '14px', mb: 0.5 }}>
                  Plan Lifecycle & Cancellation Rules
                </Typography>
                <Typography variant="caption" sx={{ color: tokens.muted, display: 'block', mb: 1.5 }}>
                  Decide plan by plan if subscriptions can close early, pause, or renew automatically.
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={planForm.auto_close_on_end}
                        onChange={(e) => setPlanForm({ ...planForm, auto_close_on_end: e.target.checked })}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontSize: '13px' }}>Auto-Close on Expiry Date</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={planForm.allow_early_close}
                        onChange={(e) => setPlanForm({ ...planForm, allow_early_close: e.target.checked })}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontSize: '13px' }}>Allow Early Closure</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={planForm.allow_pause}
                        onChange={(e) => setPlanForm({ ...planForm, allow_pause: e.target.checked })}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontSize: '13px' }}>Allow Customer / Staff to Pause</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={planForm.allow_renewal}
                        onChange={(e) => setPlanForm({ ...planForm, allow_renewal: e.target.checked })}
                      />
                    }
                    label={<Typography variant="body2" sx={{ fontSize: '13px' }}>Allow Renewal Cycles</Typography>}
                  />
                </Box>
              </Box>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2, pt: 1 }}>
            <Button onClick={() => setPlanModalOpen(false)} disabled={submitting} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
            >
              {submitting ? 'Saving...' : editingPlanId ? 'Update Plan' : 'Save Recurring Plan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
