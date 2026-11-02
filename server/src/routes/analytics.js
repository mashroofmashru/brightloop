import express from 'express';
import { db } from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/analytics/dashboard (High-speed indexed finance queries under 2-second SLA)
router.get('/dashboard', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Normalized MRR & ARR from active subscriptions
    const mrrRow = db.prepare(`
      SELECT 
        COUNT(s.id) as active_count,
        COALESCE(SUM(
          CASE 
            WHEN p.billing_interval = 'monthly' THEN s.grand_total
            WHEN p.billing_interval = 'yearly' THEN s.grand_total / 12.0
            WHEN p.billing_interval = 'weekly' THEN s.grand_total * 4.33
            WHEN p.billing_interval = 'daily' THEN s.grand_total * 30.0
            ELSE s.grand_total
          END
        ), 0) as mrr,
        COALESCE(SUM(s.grand_total), 0) as raw_contract_value
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
    `).get();

    const activeCount = mrrRow.active_count || 0;
    const mrr = mrrRow.mrr || 0;
    const arr = mrr * 12;
    const arpu = activeCount > 0 ? (mrr / activeCount) : 0;

    // 2. Collections & Receivables
    const collectionsRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total_collected, COUNT(*) as payment_count
      FROM payments
      WHERE status = 'completed'
    `).get();

    const receivablesRow = db.prepare(`
      SELECT 
        COALESCE(SUM(amount_due), 0) as total_outstanding,
        COALESCE(SUM(total_amount), 0) as total_billed,
        COUNT(CASE WHEN status = 'confirmed' AND amount_due > 0 THEN 1 END) as open_invoices_count
      FROM invoices
      WHERE status IN ('confirmed', 'draft', 'paid')
    `).get();

    const totalCollected = collectionsRow.total_collected || 0;
    const totalOutstanding = receivablesRow.total_outstanding || 0;
    const totalBilled = receivablesRow.total_billed || 0;
    const totalCombined = totalCollected + totalOutstanding;
    const collectionEfficiency = totalCombined > 0 ? Math.round((totalCollected / totalCombined) * 100) : 100;

    // 3. Overdue Aging Analysis
    const overdueRow = db.prepare(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(amount_due), 0) as total_overdue,
        COALESCE(AVG(julianday(?) - julianday(due_date)), 0) as avg_days_overdue
      FROM invoices
      WHERE status = 'confirmed' AND due_date < ? AND amount_due > 0
    `).get(today, today);

    // 4. Overdue Invoices Actionable List (top priorities to chase)
    const overdueList = db.prepare(`
      SELECT i.id, i.invoice_number, i.due_date, i.total_amount, i.amount_due,
             u.name as customer_name, u.company_name as customer_company, u.email as customer_email,
             CAST(ROUND(julianday(?) - julianday(i.due_date)) AS INTEGER) as days_overdue
      FROM invoices i
      JOIN users u ON i.customer_id = u.id
      WHERE i.status = 'confirmed' AND i.due_date < ? AND i.amount_due > 0
      ORDER BY days_overdue DESC, i.amount_due DESC
      LIMIT 10
    `).all(today, today);

    // 5. Subscription Lifecycle Pipeline Distribution
    const lifecycleRows = db.prepare(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total_value
      FROM subscriptions
      GROUP BY status
    `).all();

    const totalSubs = lifecycleRows.reduce((acc, row) => acc + row.count, 0);
    const lifecycleDistribution = ['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'].map(st => {
      const found = lifecycleRows.find(r => r.status === st);
      const count = found ? found.count : 0;
      return {
        status: st,
        count,
        percent: totalSubs > 0 ? Math.round((count / totalSubs) * 100) : 0,
        total_value: found ? found.total_value : 0
      };
    });

    // 6. Revenue Breakdown by Plan Cadence
    const revenueByPlan = db.prepare(`
      SELECT p.id, p.name as plan_name, p.billing_interval,
             COUNT(s.id) as active_subscriptions,
             COALESCE(SUM(s.grand_total), 0) as recurring_value
      FROM plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status = 'active'
      GROUP BY p.id
      ORDER BY recurring_value DESC
    `).all().map(plan => ({
      ...plan,
      percentage: mrr > 0 ? Math.round((plan.recurring_value / mrr) * 100) : 0
    }));

    // 7. Payment Methods Distribution
    const paymentMethods = db.prepare(`
      SELECT method, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_volume
      FROM payments
      WHERE status = 'completed'
      GROUP BY method
      ORDER BY total_volume DESC
    `).all().map(pm => ({
      ...pm,
      percentage: totalCollected > 0 ? Math.round((pm.total_volume / totalCollected) * 100) : 0
    }));

    // 8. Recent Financial Transactions Feed
    const recentPayments = db.prepare(`
      SELECT p.id, p.payment_number, p.amount, p.method, p.payment_date, p.reference_note,
             u.name as customer_name, u.company_name as customer_company,
             i.invoice_number
      FROM payments p
      JOIN users u ON p.customer_id = u.id
      JOIN invoices i ON p.invoice_id = i.id
      WHERE p.status = 'completed'
      ORDER BY p.id DESC
      LIMIT 5
    `).all();

    res.json({
      kpis: {
        active_subscriptions: activeCount,
        mrr: Number(mrr.toFixed(2)),
        arr: Number(arr.toFixed(2)),
        arpu: Number(arpu.toFixed(2)),
        total_collected: Number(totalCollected.toFixed(2)),
        total_billed: Number(totalBilled.toFixed(2)),
        outstanding_balance: Number(totalOutstanding.toFixed(2)),
        collection_efficiency: collectionEfficiency,
        open_invoices_count: receivablesRow.open_invoices_count || 0,
        overdue_invoices_count: overdueRow.count || 0,
        overdue_invoices_amount: Number((overdueRow.total_overdue || 0).toFixed(2)),
        avg_days_overdue: Math.round(overdueRow.avg_days_overdue || 0),
        mrr_estimate: Number(mrr.toFixed(2)) // backward compatibility
      },
      overdue_list: overdueList,
      revenue_by_plan: revenueByPlan,
      lifecycle_distribution: lifecycleDistribution,
      payment_methods: paymentMethods,
      recent_payments: recentPayments,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({ error: 'Failed to compile executive analytics' });
  }
});

export default router;
