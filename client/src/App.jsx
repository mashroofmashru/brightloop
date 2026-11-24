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
import QuotationTemplatesPage from './pages/QuotationTemplatesPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import InvoicesPage from './pages/InvoicesPage';
import PaymentsPage from './pages/PaymentsPage';
import DiscountsPage from './pages/DiscountsPage';
import TaxesPage from './pages/TaxesPage';
import CustomersPage from './pages/CustomersPage';
import ReportsPage from './pages/ReportsPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import CustomerInvoicesPage from './pages/CustomerInvoicesPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import { tokens } from './theme';

export default function App() {
  const { user, loading, isCustomer, isAdmin } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [resetToken, setResetToken] = useState('');
  const [consoleView, setConsoleView] = useState('dashboard');
  // Stripe returns customers to /payment-return; open that page directly if the URL says so.
  const [customerView, setCustomerView] = useState(() =>
    window.location.pathname === '/payment-return' ? 'payment-return' : 'portal-subscriptions'
  );
  const [templateToUse, setTemplateToUse] = useState(null);

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
    const renderCustomerContent = () => {
      switch (customerView) {
        case 'portal-invoices':
          return <CustomerInvoicesPage onNavigate={setCustomerView} />;
        case 'portal-profile':
          return <CustomerProfilePage onNavigate={setCustomerView} />;
        case 'payment-return':
          return <PaymentReturnPage onNavigate={setCustomerView} />;
        case 'portal-subscriptions':
        default:
          return <CustomerPortalPage onNavigate={setCustomerView} />;
      }
    };

    return (
      <PortalShell currentView={customerView} onNavigate={setCustomerView}>
        {renderCustomerContent()}
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
      case 'templates':
        return (
          <QuotationTemplatesPage
            onUseTemplate={(tmpl) => {
              setTemplateToUse(tmpl);
              setConsoleView('subscriptions');
            }}
          />
        );
      case 'subscriptions':
        return (
          <SubscriptionsPage
            initialTemplate={templateToUse}
            onClearInitialTemplate={() => setTemplateToUse(null)}
          />
        );
      case 'invoices':
        return <InvoicesPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'discounts':
        return <DiscountsPage />;
      case 'taxes':
        return <TaxesPage />;
      case 'customers':
        return <CustomersPage onNavigate={setConsoleView} />;
      case 'reports':
        return <ReportsPage />;
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
