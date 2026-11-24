import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { gatewayApi } from '../api';
import { tokens } from '../theme';

// Stripe redirects here after Checkout: /payment-return?session_id=... or ?cancelled=1.
// The server confirms the payment with Stripe; the browser's redirect alone is never trusted.
export default function PaymentReturnPage({ onNavigate, initialParams }) {
  const [params] = useState(() => initialParams || new URLSearchParams(window.location.search));
  const sessionId = params.get('session_id');
  const cancelled = params.get('cancelled') === '1';

  const [state, setState] = useState(() => {
    if (sessionId) return { phase: 'checking', message: '' };
    if (cancelled) return { phase: 'cancelled', message: 'Payment was cancelled. Your invoice has not been changed.' };
    return { phase: 'unknown', message: 'Nothing to confirm here.' };
  });

  // Guards against React StrictMode running the effect twice in development.
  const confirmed = useRef(false);

  useEffect(() => {
    // Clear the query string so a refresh doesn't re-run the page with stale params.
    window.history.replaceState({}, '', '/');

    if (!sessionId || confirmed.current) return;
    confirmed.current = true;

    gatewayApi.confirm(sessionId)
      .then((res) => {
        if (res.status === 'completed') {
          setState({ phase: 'paid', message: 'Thank you. Your payment was received and your invoice is updated.' });
        } else {
          setState({ phase: 'pending', message: 'Your payment is still being processed. Your invoice will update automatically once it is confirmed.' });
        }
      })
      .catch((err) => {
        setState({ phase: 'error', message: err.message || 'We could not confirm the payment. Please check your invoices shortly.' });
      });
  }, [sessionId]);

  const tone = {
    paid: tokens.status.success,
    pending: tokens.status.info,
    cancelled: tokens.status.neutral,
    error: tokens.status.danger,
    checking: tokens.status.info,
    unknown: tokens.status.neutral
  }[state.phase];

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', mt: 6, p: 4, borderRadius: 2, bgcolor: tokens.surface, border: `1px solid ${tokens.line}` }}>
      <Stack spacing={2} alignItems="flex-start">
        {state.phase === 'checking' ? (
          <CircularProgress size={28} sx={{ color: tokens.accent }} />
        ) : (
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: 1, bgcolor: tone.tint, color: tone.text, fontWeight: 700, fontSize: 13 }}>
            {state.phase === 'paid' ? 'Payment received' : state.phase === 'checking' ? '' : state.phase === 'cancelled' ? 'Payment cancelled' : state.phase === 'error' ? 'Something went wrong' : 'Payment status'}
          </Box>
        )}

        <Typography variant="body1" sx={{ color: tokens.ink }}>
          {state.phase === 'checking' ? 'Confirming your payment with Stripe…' : state.message}
        </Typography>

        {state.phase !== 'checking' && (
          <Button variant="contained" onClick={() => onNavigate('portal-invoices')} sx={{ textTransform: 'none' }}>
            Back to my invoices
          </Button>
        )}
      </Stack>
    </Box>
  );
}
