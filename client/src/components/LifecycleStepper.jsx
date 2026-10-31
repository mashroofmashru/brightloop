import React from 'react';
import { Box, Typography } from '@mui/material';
import { Check } from 'lucide-react';
import { tokens } from '../theme';

const SUBSCRIPTION_STAGES = ['draft', 'quotation', 'confirmed', 'active', 'closed'];

export default function LifecycleStepper({ currentStatus = 'draft', stages = SUBSCRIPTION_STAGES }) {
  const normalized = currentStatus.toLowerCase();
  const currentIndex = stages.indexOf(normalized);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: { xs: 1, sm: 2 },
        py: 1,
        overflowX: 'auto',
        userSelect: 'none'
      }}
    >
      {stages.map((stage, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isFuture = idx > currentIndex;

        let circleBg = 'transparent';
        let circleBorder = tokens.line;
        let circleColor = tokens.muted;

        if (isPast) {
          circleBg = tokens.ink;
          circleBorder = tokens.ink;
          circleColor = '#FFFFFF';
        } else if (isCurrent) {
          circleBg = tokens.accent;
          circleBorder = tokens.accent;
          circleColor = '#FFFFFF';
        }

        return (
          <React.Fragment key={stage}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: circleBg,
                  border: `1.5px solid ${circleBorder}`,
                  color: circleColor,
                  fontSize: '11px',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                {isPast ? <Check size={12} strokeWidth={3} /> : idx + 1}
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '13px',
                  fontWeight: isCurrent ? 700 : isPast ? 600 : 400,
                  color: isCurrent ? tokens.ink : isPast ? tokens.ink : tokens.muted,
                  textTransform: 'capitalize'
                }}
              >
                {stage}
              </Typography>
            </Box>

            {idx < stages.length - 1 && (
              <Box
                sx={{
                  height: '2px',
                  flexGrow: 1,
                  minWidth: { xs: 12, sm: 24 },
                  backgroundColor: isPast ? tokens.ink : tokens.line,
                  transition: 'background-color 0.2s ease'
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
  );
}
