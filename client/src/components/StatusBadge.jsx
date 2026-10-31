import React from 'react';
import { Box, Typography } from '@mui/material';
import { tokens } from '../theme';

const STATUS_MAP = {
  // Subscription statuses
  draft: { label: 'Draft', type: 'neutral' },
  quotation: { label: 'Quotation', type: 'info' },
  confirmed: { label: 'Confirmed', type: 'info' },
  active: { label: 'Active', type: 'success' },
  paused: { label: 'Paused', type: 'warning' },
  closed: { label: 'Closed', type: 'neutral' },

  // Invoice statuses
  paid: { label: 'Paid', type: 'success' },
  partially_paid: { label: 'Partially Paid', type: 'warning' },
  due_soon: { label: 'Due Soon', type: 'warning' },
  overdue: { label: 'Overdue', type: 'danger' },
  cancelled: { label: 'Cancelled', type: 'danger' },

  // Role badges
  admin: { label: 'Admin', type: 'danger' },
  staff: { label: 'Internal Staff', type: 'info' },
  customer: { label: 'Customer', type: 'neutral' }
};

export default function StatusBadge({ status, customLabel, size = 'medium' }) {
  const normalizedKey = String(status || '').toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_MAP[normalizedKey] || { label: status, type: 'neutral' };
  const style = tokens.status[config.type] || tokens.status.neutral;

  const isSmall = size === 'small';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        px: isSmall ? '8px' : '10px',
        py: isSmall ? '2px' : '4px',
        borderRadius: '9999px',
        backgroundColor: style.tint,
        color: style.text,
        border: `1px solid ${style.text}20`,
        width: 'fit-content',
        userSelect: 'none'
      }}
    >
      <Box
        sx={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: style.text,
          flexShrink: 0
        }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: isSmall ? '11px' : '12px',
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: '0.01em',
          textTransform: 'capitalize'
        }}
      >
        {customLabel || config.label}
      </Typography>
    </Box>
  );
}
