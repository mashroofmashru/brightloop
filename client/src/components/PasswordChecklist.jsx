import React from 'react';
import { Box, Typography } from '@mui/material';
import { Check, X } from 'lucide-react';
import { tokens } from '../theme';

export default function PasswordChecklist({ password = '' }) {
  const rules = [
    {
      id: 'length',
      label: 'More than 8 characters',
      valid: password.length > 8
    },
    {
      id: 'upper',
      label: 'At least one uppercase letter (A-Z)',
      valid: /[A-Z]/.test(password)
    },
    {
      id: 'lower',
      label: 'At least one lowercase letter (a-z)',
      valid: /[a-z]/.test(password)
    },
    {
      id: 'special',
      label: 'At least one special character (!@#$%^&*)',
      valid: /[^a-zA-Z0-9]/.test(password)
    }
  ];

  return (
    <Box
      sx={{
        mt: 1.5,
        p: 1.5,
        borderRadius: '8px',
        backgroundColor: tokens.canvas,
        border: `1px solid ${tokens.line}`
      }}
      aria-label="Password requirement checklist"
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          fontWeight: 600,
          color: tokens.muted,
          mb: 1,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        Password Requirements:
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {rules.map((rule) => {
          const isValid = rule.valid;
          return (
            <Box
              key={rule.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: isValid ? tokens.status.success.text : tokens.muted,
                transition: 'color 0.15s ease'
              }}
            >
              {isValid ? (
                <Check size={14} strokeWidth={3} style={{ color: tokens.status.success.text }} />
              ) : (
                <X size={14} strokeWidth={2} style={{ color: tokens.muted, opacity: 0.6 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontSize: '12px',
                  fontWeight: isValid ? 500 : 400,
                  color: isValid ? tokens.status.success.text : tokens.muted
                }}
              >
                {rule.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
