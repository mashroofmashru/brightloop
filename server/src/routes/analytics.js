import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/analytics/dashboard (High-speed indexed finance queries under 2-second SLA)
router.get('/dashboard', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Core KPIs
    const activeSubsRow = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(grand_total), 0) as mrr_estimate
      FROM subscriptions
      WHERE status = 'active'
    `).get();

    const collectionsRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_collected
      FROM payments
      WHERE status = 'completed'
    `).get();

    const receivablesRow = db.prepare(`
      SELECT COALESCE(SUM(amount_due), 0) as total_outstanding,
             COALESCE(SUM(total_amount), 0) as total_billed
      FROM invoices
      WHERE status IN ('confirmed', 'draft')
    `).get();

    const overdueCountRow = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount_due), 0) as total_overdue
      FROM invoices
      WHERE status = 'confirmed' AND due_date < ? AND amount_due > 0
    `).get(today);

    // 2. Overdue Invoices Actionable List (top priorities to chase)
    const overdueList = db.prepare(`
      SELECT i.id, i.invoice_number, i.due_date, i.total_amount, i.amount_due,
             u.name as customer_name, u.company_name as customer_company, u.email as customer_email,
             (julianday(?) - julianday(i.due_date)) as days_overdue
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      WHERE i.status = 'confirmed' AND i.due_date < ? AND i.amount_due > 0
      ORDER BY days_overdue DESC, i.amount_due DESC
      LIMIT 10
    `).all(today, today);

    // 3. Revenue Breakdown by Plan
    const revenueByPlan = db.prepare(`
      SELECT p.name as plan_name, p.billing_interval,
             COUNT(s.id) as active_subscriptions,
             COALESCE(SUM(s.grand_total), 0) as recurring_value
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
      GROUP BY p.id
      ORDER BY recurring_value DESC
    `).all();

    // 4. Invoice Status Distribution
    const statusSplit = db.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total_volume
      FROM invoices
      GROUP BY status
    `).all();

    res.json({
      kpis: {
        active_subscriptions: activeSubsRow.count,
        mrr_estimate: activeSubsRow.mrr_estimate,
        total_collected: collectionsRow.total_collected,
        total_billed: receivablesRow.total_billed,
        outstanding_balance: receivablesRow.total_outstanding,
        overdue_invoices_count: overdueCountRow.count,
        overdue_invoices_amount: overdueCountRow.total_overdue
      },
      overdue_list: overdueList,
      revenue_by_plan: revenueByPlan,
      status_split: statusSplit,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Failed to compile executive analytics' });
  }
});

export default router;
