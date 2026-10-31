import { createTheme } from '@mui/material/styles';

export const tokens = {
  ink: '#111827',
  accent: '#4F46E5',
  accent600: '#4338CA',
  accent700: '#3730A3',
  accent50: '#EEF2FF',
  canvas: '#F7F8FA',
  canvas200: '#EEF0F3',
  surface: '#FFFFFF',
  line: '#E5E7EB',
  muted: '#5B6472',
  status: {
    neutral: { text: '#475569', tint: '#F1F5F9' },
    info: { text: '#1D4ED8', tint: '#EFF6FF' },
    success: { text: '#047857', tint: '#ECFDF5' },
    warning: { text: '#B45309', tint: '#FFFBEB' },
    danger: { text: '#B91C1C', tint: '#FEF2F2' }
  }
};

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: tokens.accent,
      dark: tokens.accent700,
      light: tokens.accent50,
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: tokens.ink,
      contrastText: '#FFFFFF'
    },
    background: {
      default: tokens.canvas,
      paper: tokens.surface
    },
    divider: tokens.line,
    text: {
      primary: tokens.ink,
      secondary: tokens.muted
    },
    error: {
      main: tokens.status.danger.text,
      light: tokens.status.danger.tint
    },
    warning: {
      main: tokens.status.warning.text,
      light: tokens.status.warning.tint
    },
    info: {
      main: tokens.status.info.text,
      light: tokens.status.info.tint
    },
    success: {
      main: tokens.status.success.text,
      light: tokens.status.success.tint
    }
  },
  typography: {
    fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', color: tokens.ink },
    h2: { fontSize: '22px', fontWeight: 700, letterSpacing: '-0.015em', color: tokens.ink },
    h3: { fontSize: '18px', fontWeight: 600, color: tokens.ink },
    h4: { fontSize: '16px', fontWeight: 600, color: tokens.ink },
    body1: { fontSize: '15px', fontWeight: 400, color: tokens.ink },
    body2: { fontSize: '14px', fontWeight: 400, color: tokens.muted },
    button: { textTransform: 'none', fontWeight: 500, fontSize: '14px' }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${tokens.line}`,
          borderRadius: 12
        }
      }
    },
    MuiCard: {
      defaultProps: {
        elevation: 0
      },
      styleOverrides: {
        root: {
          border: `1px solid ${tokens.line}`,
          borderRadius: 12,
          boxShadow: 'none'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 500
        },
        containedPrimary: {
          backgroundColor: tokens.accent,
          '&:hover': {
            backgroundColor: tokens.accent600
          }
        },
        containedSecondary: {
          backgroundColor: tokens.ink,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#000000'
          }
        },
        outlined: {
          borderColor: tokens.line,
          color: tokens.ink,
          '&:hover': {
            backgroundColor: tokens.canvas,
            borderColor: tokens.line
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: tokens.surface,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.line
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.muted
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.accent,
            borderWidth: 2
          }
        },
        input: {
          padding: '10px 14px',
          fontSize: '14px'
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.canvas200,
          '& .MuiTableCell-head': {
            color: tokens.muted,
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: `1px solid ${tokens.line}`
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.line}`,
          padding: '12px 16px',
          fontSize: '14px'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: `${tokens.canvas} !important`
          }
        }
      }
    }
  }
});
