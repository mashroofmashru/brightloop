import React, { useState, useEffect } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress, Stack, IconButton
} from '@mui/material';
import { UserPlus, UserCog, Mail, Phone, Lock, X } from 'lucide-react';
import { usersApi } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import PasswordChecklist from '../components/PasswordChecklist';
import { tokens } from '../theme';

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add modal state
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await usersApi.getStaff();
      setStaff(res.staff || []);
    } catch (err) {
      setError(err.message || 'Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const isPasswordValid = (pwd) => {
    return pwd.length > 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[^a-zA-Z0-9]/.test(pwd);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setModalError('');
    const errors = {};

    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email address is required';
    if (!formData.password) {
      errors.password = 'Temporary password is required';
    } else if (!isPasswordValid(formData.password)) {
      errors.password = 'Password does not meet required security criteria';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      await usersApi.addStaff(formData);
      setSuccessToast(`Staff member "${formData.name}" added successfully.`);
      setOpenModal(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchStaff();
    } catch (err) {
      if (err.data?.field === 'email') {
        setFieldErrors({ email: err.data.error });
      } else {
        setModalError(err.message || 'Failed to add staff member');
      }
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
            Internal Staff & Permissions
          </Typography>
          <Typography variant="body2" sx={{ color: tokens.muted }}>
            Manage internal team members authorized to operate quotes, subscriptions, and invoices.
          </Typography>
        </Box>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<UserPlus size={16} />}
            onClick={() => {
              setFieldErrors({});
              setModalError('');
              setOpenModal(true);
            }}
            sx={{
              backgroundColor: tokens.accent,
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '13.5px',
              py: 1,
              px: 2,
              '&:hover': { backgroundColor: tokens.accent600 }
            }}
          >
            Add Staff Member
          </Button>
        )}
      </Box>

      {successToast && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setSuccessToast('')}>
          {successToast}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {/* Staff Table */}
      <Card sx={{ border: `1px solid ${tokens.line}`, borderRadius: '12px', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member Name</TableCell>
                <TableCell>Email Address</TableCell>
                <TableCell>Role & Tier</TableCell>
                <TableCell>Phone Contact</TableCell>
                <TableCell>Joined Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: tokens.accent }} />
                  </TableCell>
                </TableRow>
              ) : staff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: tokens.muted }}>
                    No staff records found.
                  </TableCell>
                </TableRow>
              ) : (
                staff.map((member) => (
                  <TableRow key={member.id} hover>
                    <TableCell sx={{ fontWeight: 600, color: tokens.ink }}>
                      {member.name}
                    </TableCell>
                    <TableCell sx={{ color: tokens.muted }}>
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={member.role} size="small" />
                    </TableCell>
                    <TableCell sx={{ color: tokens.muted }}>
                      {member.phone || '—'}
                    </TableCell>
                    <TableCell sx={{ color: tokens.muted, fontSize: '13px' }}>
                      {new Date(member.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog
        open={openModal}
        onClose={() => !submitting && setOpenModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: '18px', fontWeight: 700 }}>
              Add New Staff Member
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              Admin authorization: Provide login credentials for internal operations.
            </Typography>
          </Box>
          <IconButton onClick={() => setOpenModal(false)} size="small" disabled={submitting}>
            <X size={18} />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleAddStaff}>
          <DialogContent sx={{ pt: 1 }}>
            {modalError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {modalError}
              </Alert>
            )}

            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: tokens.ink }}>
                  Full Name *
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. David Miller"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name}
                  disabled={submitting}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: tokens.ink }}>
                  Corporate Email *
                </Typography>
                <TextField
                  fullWidth
                  type="email"
                  placeholder="david@brightloop.io"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  disabled={submitting}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: tokens.ink }}>
                  Phone Number (Optional)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="+1 (555) 019-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={submitting}
                />
              </Box>

              <Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: tokens.ink }}>
                  Temporary Password *
                </Typography>
                <TextField
                  fullWidth
                  type="password"
                  placeholder="Set initial strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                  disabled={submitting}
                />
                <PasswordChecklist password={formData.password} />
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
              disabled={submitting || !isPasswordValid(formData.password)}
              sx={{ backgroundColor: tokens.accent, '&:hover': { backgroundColor: tokens.accent600 } }}
            >
              {submitting ? 'Adding...' : 'Provision Staff Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
