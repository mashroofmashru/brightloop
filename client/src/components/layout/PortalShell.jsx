import React from 'react';
import {
  Box, AppBar, Toolbar, Typography, Button, Avatar, IconButton, Menu, MenuItem, Container
} from '@mui/material';
import { RefreshCw, Receipt, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../StatusBadge';
import { tokens } from '../../theme';

export default function PortalShell({ currentView, onNavigate, children }) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const navItems = [
    { id: 'portal-subscriptions', label: 'My Subscriptions', icon: RefreshCw },
    { id: 'portal-invoices', label: 'My Invoices', icon: Receipt },
    { id: 'portal-profile', label: 'Account Profile', icon: User }
  ];

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: tokens.canvas }}>
      {/* Top Navigation Bar */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: tokens.surface,
          borderBottom: `1px solid ${tokens.line}`,
          color: tokens.ink
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ minHeight: '64px', display: 'flex', justifyContent: 'space-between' }}>
            {/* Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
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
                      startIcon={<Icon size={16} />}
                      sx={{
                        color: isSelected ? tokens.accent : tokens.muted,
                        fontWeight: isSelected ? 600 : 500,
                        backgroundColor: isSelected ? tokens.accent50 : 'transparent',
                        borderRadius: '8px',
                        px: 1.5,
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
                <ChevronDown size={14} color={tokens.muted} />
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  sx: { width: 180, borderRadius: '8px', border: `1px solid ${tokens.line}`, mt: 1 }
                }}
              >
                <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: tokens.status.danger.text }}>
                  <LogOut size={14} style={{ marginRight: 8 }} />
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
