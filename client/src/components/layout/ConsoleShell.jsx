import React from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Typography, Avatar, IconButton, Chip, Menu, MenuItem, Tooltip
} from '@mui/material';
import {
  LayoutDashboard, RefreshCw, FileText, Receipt, CreditCard,
  Package, Percent, Landmark, Users, UserCog, BarChart3, LogOut, ChevronDown, ShieldCheck, Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../StatusBadge';
import { tokens } from '../../theme';

const DRAWER_WIDTH = 250;

export default function ConsoleShell({ currentView, onNavigate, children }) {
  const { user, logout, isAdmin, switchRoleDemo } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Console nav items. Staff management is ADMIN ONLY.
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subscriptions', label: 'Subscriptions', icon: RefreshCw },
    { id: 'templates', label: 'Quotation Templates', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'products', label: 'Products & Plans', icon: Package },
    { id: 'discounts', label: 'Discounts', icon: Percent },
    { id: 'taxes', label: 'Taxes', icon: Landmark },
    { id: 'customers', label: 'Customers', icon: Users },
    // "Only the admin can add a new member of staff" -> Staff nav item is hidden for non-admins
    ...(isAdmin ? [{ id: 'staff', label: 'Staff Management', icon: UserCog }] : []),
    { id: 'reports', label: 'Reports', icon: BarChart3 }
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: tokens.canvas }}>
      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: tokens.surface,
            borderRight: `1px solid ${tokens.line}`,
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Brand Header */}
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: `1px solid ${tokens.line}` }}>
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
              Operations Console
            </Typography>
          </Box>
        </Box>

        {/* Navigation Menu */}
        <Box sx={{ flexGrow: 1, py: 2, px: 1.5, overflowY: 'auto' }}>
          <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = currentView === item.id;
              return (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    onClick={() => onNavigate(item.id)}
                    sx={{
                      borderRadius: '8px',
                      py: 1,
                      px: 1.5,
                      backgroundColor: isSelected ? tokens.ink : 'transparent',
                      color: isSelected ? '#FFFFFF' : tokens.muted,
                      '&:hover': {
                        backgroundColor: isSelected ? tokens.ink : tokens.canvas,
                        color: isSelected ? '#FFFFFF' : tokens.ink
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: isSelected ? '#FFFFFF' : tokens.muted }}>
                      <Icon size={18} strokeWidth={isSelected ? 2.2 : 1.8} />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '13.5px',
                        fontWeight: isSelected ? 600 : 500
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* User Card & Role Switcher */}
        <Box sx={{ p: 2, borderTop: `1px solid ${tokens.line}`, backgroundColor: tokens.canvas }}>
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              p: 1,
              borderRadius: '8px',
              '&:hover': { backgroundColor: tokens.canvas200 }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  fontSize: '13px',
                  fontWeight: 600,
                  backgroundColor: isAdmin ? tokens.ink : tokens.accent
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px', noWrap: true }}>
                  {user?.name || 'Operations User'}
                </Typography>
                <StatusBadge status={user?.role} size="small" />
              </Box>
            </Box>
            <ChevronDown size={14} color={tokens.muted} />
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            PaperProps={{
              sx: { width: 220, borderRadius: '8px', border: `1px solid ${tokens.line}`, mt: 1 }
            }}
          >
            <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${tokens.line}` }}>
              <Typography variant="caption" sx={{ color: tokens.muted, fontWeight: 600, display: 'block' }}>
                QUICK ROLE SWITCH:
              </Typography>
            </Box>
            <MenuItem onClick={() => { setAnchorEl(null); switchRoleDemo('admin'); }}>
              <ShieldCheck size={14} style={{ marginRight: 8, color: tokens.status.danger.text }} />
              <Typography variant="body2" sx={{ fontSize: '13px' }}>Switch to Admin</Typography>
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); switchRoleDemo('staff'); }}>
              <Briefcase size={14} style={{ marginRight: 8, color: tokens.status.info.text }} />
              <Typography variant="body2" sx={{ fontSize: '13px' }}>Switch to Staff</Typography>
            </MenuItem>
            <MenuItem onClick={() => { setAnchorEl(null); switchRoleDemo('customer'); }}>
              <Users size={14} style={{ marginRight: 8, color: tokens.status.success.text }} />
              <Typography variant="body2" sx={{ fontSize: '13px' }}>Switch to Customer</Typography>
            </MenuItem>
            <Box sx={{ borderTop: `1px solid ${tokens.line}`, mt: 0.5 }}>
              <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: tokens.status.danger.text }}>
                <LogOut size={14} style={{ marginRight: 8 }} />
                <Typography variant="body2" sx={{ fontSize: '13px', fontWeight: 600 }}>Sign Out</Typography>
              </MenuItem>
            </Box>
          </Menu>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    </Box>
  );
}
