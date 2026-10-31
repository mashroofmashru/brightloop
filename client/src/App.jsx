import React, { useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import ConsoleShell from './components/layout/ConsoleShell';
import PortalShell from './components/layout/PortalShell';
import DashboardPage from './pages/DashboardPage';
import StaffPage from './pages/StaffPage';
import ProductsPlansPage from './pages/ProductsPlansPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import { tokens } from './theme';

export default function App() {
  const { user, loading, isCustomer, isAdmin } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [resetToken, setResetToken] = useState('');
  const [consoleView, setConsoleView] = useState('dashboard');

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tokens.canvas
        }}
      >
        <CircularProgress size={32} sx={{ color: tokens.accent }} />
      </Box>
    );
  }

  // Unauthenticated Auth Routing
  if (!user) {
    const handleAuthNavigate = (view, params = {}) => {
      if (params.token) setResetToken(params.token);
      setAuthView(view);
    };

    switch (authView) {
      case 'register':
        return <RegisterPage onNavigate={handleAuthNavigate} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={handleAuthNavigate} />;
      case 'reset-password':
        return <ResetPasswordPage onNavigate={handleAuthNavigate} initialToken={resetToken} />;
      case 'login':
      default:
        return <LoginPage onNavigate={handleAuthNavigate} />;
    }
  }

  // Customer Portal Shell
  if (isCustomer) {
    return (
      <PortalShell currentView="portal-subscriptions" onNavigate={() => {}}>
        <CustomerPortalPage onNavigate={() => {}} />
      </PortalShell>
    );
  }

  // Console Shell (Admin & Staff)
  const renderConsoleContent = () => {
    switch (consoleView) {
      case 'staff':
        return isAdmin ? <StaffPage /> : <DashboardPage onNavigate={setConsoleView} />;
      case 'products':
        return <ProductsPlansPage />;
      case 'dashboard':
      default:
        return <DashboardPage onNavigate={setConsoleView} />;
    }
  };

  return (
    <ConsoleShell currentView={consoleView} onNavigate={setConsoleView}>
      {renderConsoleContent()}
    </ConsoleShell>
  );
}
