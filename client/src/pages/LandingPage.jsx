import React from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { ArrowRight, BarChart3, CreditCard, FileText, Percent, Repeat, ShieldCheck, Users } from 'lucide-react';
import { tokens } from '../theme';

// Uses the app theme (theme.js): fonts, type scale, radii, buttons, cards and chips all come from the theme.

const features = [
  { icon: Repeat, title: 'Recurring plans', text: 'Daily, weekly, monthly and yearly plans with pause, renewal and early-close rules set per plan.' },
  { icon: FileText, title: 'Quotes to subscriptions', text: 'Build quotation templates, send them to customers, and turn accepted quotes into active subscriptions.' },
  { icon: CreditCard, title: 'Automated billing', text: 'Run a billing cycle that creates each invoice once, with due dates from your payment terms.' },
  { icon: Percent, title: 'Taxes and discounts', text: 'Apply tax rules and conditional discounts by order value, quantity or product, with redemption limits.' },
  { icon: Users, title: 'Customer 360', text: 'See every subscription, invoice and payment for a customer in one place.' },
  { icon: BarChart3, title: 'Live finance dashboard', text: 'MRR, ARR, collections, overdue aging and payment methods, updated as money moves.' }
];

const steps = [
  { n: '01', title: 'Set up your catalogue', text: 'Add products, variants, plans, taxes and discounts once. Your team reuses them on every quote.' },
  { n: '02', title: 'Quote and activate', text: 'Create a subscription from a template, confirm it, and it becomes active on its start date.' },
  { n: '03', title: 'Bill and get paid', text: 'Invoices are generated automatically. Customers pay online, and every payment is reconciled.' }
];

const previewStats = [
  { label: 'Active subscriptions', value: '10' },
  { label: 'Collected this month', value: '$11,575' },
  { label: 'Outstanding', value: '$4,268' },
  { label: 'Collection rate', value: '73%' }
];

const sectionPadding = { py: { xs: 6, md: 8 } };

export default function LandingPage({ onNavigate }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', overflowX: 'hidden' }}>
      {/* Top navigation (same brand mark as the sign-in page) */}
      <Box
        component="header"
        sx={{
          position: 'sticky', top: 0, zIndex: 10,
          bgcolor: 'rgba(247,248,250,0.92)', backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${tokens.line}`
        }}
      >
        <Box sx={{ maxWidth: 1280, mx: 'auto', px: 2, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: tokens.ink, color: '#FFFFFF', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16 }}>
              B
            </Box>
            <Typography variant="h3">Brightloop</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button color="inherit" onClick={() => onNavigate('login')}>Sign in</Button>
            <Button variant="contained" onClick={() => onNavigate('register')} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              Create account
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Hero */}
      <Box component="section" sx={{ maxWidth: 1280, mx: 'auto', px: 2, pt: { xs: 7, md: 10 }, pb: { xs: 6, md: 8 } }}>
        <Box sx={{ display: 'grid', gap: 6, gridTemplateColumns: { xs: '1fr', md: '1.05fr 0.95fr' }, alignItems: 'center' }}>
          <Box>
            <Chip label="Subscription management for B2B teams" color="primary" variant="outlined" size="small" sx={{ mb: 2, fontWeight: 600 }} />
            <Typography variant="h1" sx={{ fontSize: { xs: '34px', md: '50px' }, lineHeight: 1.1 }}>
              Run recurring revenue without the spreadsheets.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2.5, color: 'text.secondary', fontSize: { xs: '16px', md: '18px' }, lineHeight: 1.6, maxWidth: 520 }}>
              Brightloop takes a customer from quote to subscription, bills them on schedule, collects payment online, and shows you exactly where your money stands.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
              <Button variant="contained" size="large" endIcon={<ArrowRight size={18} />} onClick={() => onNavigate('register')}>
                Get started
              </Button>
              <Button variant="outlined" size="large" onClick={() => onNavigate('login')}>
                Sign in to your account
              </Button>
            </Stack>
          </Box>

          {/* Product preview (sample figures) */}
          <Card>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Typography variant="body2">Monthly recurring revenue</Typography>
              <Typography variant="h1" className="tabular-nums" sx={{ fontSize: '34px', mt: 0.5 }}>$14,370</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mt: 2.5 }}>
                {previewStats.map((s) => (
                  <Box key={s.label} sx={{ p: 1.75, borderRadius: '8px', bgcolor: 'background.default', border: `1px solid ${tokens.line}` }}>
                    <Typography variant="body2" sx={{ fontSize: 12 }}>{s.label}</Typography>
                    <Typography variant="h4" className="tabular-nums" sx={{ mt: 0.25 }}>{s.value}</Typography>
                  </Box>
                ))}
              </Box>
              <Box sx={{ mt: 2, p: 1.75, borderRadius: '8px', bgcolor: tokens.status.success.tint, color: tokens.status.success.text, fontSize: 13, fontWeight: 600 }}>
                Invoice INV-2026-0005 paid online via card
              </Box>
              <Typography variant="body2" sx={{ mt: 1.5, fontSize: 11 }}>Illustrative sample figures.</Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Features */}
      <Box component="section" sx={{ maxWidth: 1280, mx: 'auto', px: 2, ...sectionPadding }}>
        <Typography variant="h2" sx={{ fontSize: { xs: '26px', md: '32px' } }}>Everything from first quote to final payment</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1, maxWidth: 620 }}>
          One system for the people who sell subscriptions, the people who bill them, and the customers who pay.
        </Typography>
        <Box sx={{ mt: 4, display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' } }}>
          {features.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: 'primary.light', color: 'primary.main', display: 'grid', placeItems: 'center', mb: 2 }}>
                  <Icon size={20} />
                </Box>
                <Typography variant="h4">{title}</Typography>
                <Typography variant="body2" sx={{ mt: 0.75, lineHeight: 1.6 }}>{text}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* How it works */}
      <Box component="section" sx={{ bgcolor: 'background.paper', borderTop: `1px solid ${tokens.line}`, borderBottom: `1px solid ${tokens.line}` }}>
        <Box sx={{ maxWidth: 1280, mx: 'auto', px: 2, ...sectionPadding }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '26px', md: '32px' } }}>How it works</Typography>
          <Box sx={{ mt: 4, display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
            {steps.map((s) => (
              <Box key={s.n}>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>{s.n}</Typography>
                <Typography variant="h3" sx={{ mt: 1 }}>{s.title}</Typography>
                <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>{s.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Customer portal + security */}
      <Box component="section" sx={{ maxWidth: 1280, mx: 'auto', px: 2, ...sectionPadding }}>
        <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Card sx={{ bgcolor: tokens.ink, border: 'none' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h2" sx={{ color: '#FFFFFF', fontSize: '22px' }}>A portal your customers will use</Typography>
              <Typography variant="body2" sx={{ color: '#CBD5E1', mt: 1.5, lineHeight: 1.6 }}>
                Customers see their subscriptions and invoices, pause or resume where your plan allows, and pay by card on a secure Stripe page. They never see another customer's data.
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShieldCheck size={22} color={tokens.accent} />
                <Typography variant="h2" sx={{ fontSize: '22px' }}>Built for control</Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1.5, lineHeight: 1.6 }}>
                Role-based access separates admins, staff and customers. Online payments are confirmed with the payment provider and recorded exactly once, and every payment is linked to its invoice.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Closing call to action */}
      <Box component="section" sx={{ maxWidth: 1280, mx: 'auto', px: 2, pb: { xs: 8, md: 10 } }}>
        <Card sx={{ bgcolor: 'primary.main', border: 'none' }}>
          <CardContent sx={{ p: { xs: 3.5, md: 5 }, textAlign: 'center' }}>
            <Typography variant="h2" sx={{ color: '#FFFFFF', fontSize: { xs: '24px', md: '30px' } }}>Start billing your subscriptions properly</Typography>
            <Typography variant="body1" sx={{ mt: 1.5, color: '#E0E7FF', maxWidth: 520, mx: 'auto' }}>
              Create an account and set up your first plan in minutes.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
              <Button variant="contained" size="large" onClick={() => onNavigate('register')} sx={{ bgcolor: '#FFFFFF', color: tokens.accent700, '&:hover': { bgcolor: tokens.accent50 } }}>
                Create account
              </Button>
              <Button variant="outlined" size="large" onClick={() => onNavigate('login')} sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFFFFF', bgcolor: 'rgba(255,255,255,0.08)' } }}>
                Sign in
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box component="footer" sx={{ borderTop: `1px solid ${tokens.line}`, py: 3 }}>
        <Typography variant="body2" sx={{ textAlign: 'center' }}>
          © {new Date().getFullYear()} Brightloop. Subscription management system.
        </Typography>
      </Box>
    </Box>
  );
}
