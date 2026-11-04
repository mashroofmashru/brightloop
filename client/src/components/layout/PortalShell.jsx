import React from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button, Avatar, IconButton, Menu, MenuItem, Container, Divider
} from '@mui/material';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../StatusBadge';
import { tokens } from '../../theme';

export default function PortalShell({ currentView, onNavigate, children }) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const navItems = [
    { id: 'portal-subscriptions', label: 'My Subscriptions', icon: AutorenewRoundedIcon },
    { id: 'portal-invoices', label: 'My Invoices', icon: ReceiptLongRoundedIcon },
    { id: 'portal-profile', label: 'Account Profile', icon: AccountCircleRoundedIcon }
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: tokens.canvas }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        className="no-print"
        sx={{
          backgroundColor: tokens.surface,
          borderBottom: `1px solid ${tokens.line}`,
          color: tokens.ink,
          '@media print': {
            display: 'none !important'
          }
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '64px', display: 'flex', justifyContent: 'space-between' }}>
            {/* Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer' }} onClick={() => onNavigate('portal-subscriptions')}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    backgroundColor: tokens.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 16
                  }}
                >
                  B
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.2 }}>
                    Brightloop
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontSize: '11px', fontWeight: 500 }}>
                    Customer Portal
                  </Typography>
                </Box>
              </Box>

              {/* Navigation Tabs */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isSelected = currentView === item.id;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      startIcon={<Icon sx={{ fontSize: 18 }} />}
                      sx={{
                        color: isSelected ? tokens.accent : tokens.muted,
                        fontWeight: isSelected ? 600 : 500,
                        backgroundColor: isSelected ? tokens.accent50 : 'transparent',
                        borderRadius: '8px',
                        px: 1.75,
                        py: 0.75,
                        '&:hover': {
                          backgroundColor: isSelected ? tokens.accent50 : tokens.canvas,
                          color: isSelected ? tokens.accent : tokens.ink
                        }
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>

            {/* Right: User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  cursor: 'pointer',
                  p: 0.75,
                  borderRadius: '8px',
                  '&:hover': { backgroundColor: tokens.canvas }
                }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: '13px',
                    fontWeight: 600,
                    backgroundColor: tokens.accent
                  }}
                >
                  {user?.name?.charAt(0) || 'C'}
                </Avatar>
                <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px', lineHeight: 1.2 }}>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.muted, fontSize: '11px', display: 'block' }}>
                    {user?.company_name || 'Customer Account'}
                  </Typography>
                </Box>
                <KeyboardArrowDownRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: { width: 200, borderRadius: '8px', border: `1px solid ${tokens.line}`, mt: 1 }
                }}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    onNavigate('portal-profile');
                  }}
                  sx={{ color: tokens.ink, py: 1 }}
                >
                  <AccountCircleRoundedIcon sx={{ fontSize: 18, mr: 1.25, color: tokens.muted }} />
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>Account Profile</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    onNavigate('portal-invoices');
                  }}
                  sx={{ color: tokens.ink, py: 1 }}
                >
                  <ReceiptLongRoundedIcon sx={{ fontSize: 18, mr: 1.25, color: tokens.muted }} />
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 500 }}>My Invoices</Typography>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: tokens.status.danger.text, py: 1 }}>
                  <LogoutRoundedIcon sx={{ fontSize: 18, mr: 1.25 }} />
                  <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600 }}>Sign Out</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Portal Content Area */}
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="xl">{children}</Container>
      </Box>
    </Box>
  );
}
