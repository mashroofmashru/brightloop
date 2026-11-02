import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Stack, IconButton
} from '@mui/material';
import { Landmark, Plus, Edit3 } from 'lucide-react';
import { taxesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { tokens } from '../theme';

export default function TaxesPage() {
  const { isAdmin } = useAuth();
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Tax Modal State
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  const [editingTaxId, setEditingTaxId] = useState(null);
  const [taxForm, setTaxForm] = useState({ name: '', rate: '', tax_type: 'exclusive' });
  const [submitting, setSubmitting] = useState(false);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const taxRes = await taxesApi.getAll();
      setTaxes(taxRes.taxes || []);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load tax rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

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
      fetchTaxes();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save tax rule');
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
            Tax Rules & Rates
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Define regional sales taxes, VAT rules, and inclusive/exclusive price calculations applied to recurring subscriptions.
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => handleOpenTaxModal()}
            sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
          >
            Add Tax Rule
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

      {/* TAX RULES TABLE */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tax Rule Name</TableCell>
                <TableCell align="right">Tax Rate (%)</TableCell>
                <TableCell>Tax Calculation Type</TableCell>
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
                      {Number(tax.rate).toFixed(1)}%
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize', color: tokens.muted }}>
                      {tax.tax_type === 'exclusive' ? 'Exclusive (Added to Subtotal)' : 'Inclusive (Embedded in Price)'}
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
                  <MenuItem value="exclusive">Exclusive (Added to Subtotal)</MenuItem>
                  <MenuItem value="inclusive">Inclusive (Embedded in Price)</MenuItem>
                </TextField>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setTaxModalOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: tokens.accent }}>
              Save Tax Rule
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
