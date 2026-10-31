# Brightloop — Modern B2B Subscription & Billing Platform

Brightloop is a high-performance, unified subscription management and billing platform engineered for B2B recurring revenue operations. It eliminates spreadsheet tracking, manual invoicing, missed renewals, and revenue reconciliation bottlenecks with a sleek, Swiss-style high-contrast interface.

---

## Key Platform Capabilities

- **Role-Based Access Control (RBAC)**: Dedicated shells for **Admin** (full governance & staff provisioning), **Internal Staff** (daily sales & quotation operations), and **Customer Portal** (isolated self-service).
- **Product Catalog & Variant Pricing**: Multi-type products (software, services, physical) with custom variant price deltas (e.g. `Brand: Odoo` adds `+$560.00`).
- **Flexible Recurring Cadences & Lifecycle Policies**: Daily, weekly, monthly, and yearly recurring plans with granular policies: auto-close on term end, early termination, pausing, and renewal.
- **Sales & Quotation Engine**: Quotation templates with pre-configured line items and discount rules that seamlessly convert to active subscriptions with sequential numbering (`SUB-2026-XXXX`).
- **Automated Idempotent Billing Engine**: Batch billing execution with strict composite locking `(subscription_id, billing_period_start)` preventing duplicate or skipped charges.
- **Taxes & Conditional Discounts Engine**: Support for inclusive/exclusive tax rates and conditional promotional discounts with minimum volume, order thresholds, expiration dates, and live redemption tracking.
- **Multi-Method Payments & Auto-Reconciliation**: Record credit card, bank wire, check, and cash payments. Real-time balance calculations automatically advance fully settled invoices to `Paid`.
- **Executive Finance Dashboard (<2s SLA)**: Real-time MRR, ARR, Total Cash Collected, Net Receivables, and Aging Overdue tracking with instant query performance.
- **Self-Service Customer Portal**: Isolated customer view to manage subscriptions, pause/resume services, inspect itemized statements, and settle balances with instant receipts.

---

## Login Credentials & Seeded Accounts

All accounts are pre-seeded in the database and ready for instant login at [http://localhost:3000](http://localhost:3000):

### 1. Administrative Console Access (`Admin`)
Full system configuration, staff management, product catalog, tax rules, and batch billing execution.

| Role | Email | Password | Name | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@brightloop.io` | `BrightAdmin2026!` | Elena Vance (Admin) | Full system administrative console & executive analytics |

### 2. Operations & Sales Staff Access (`Staff`)
Daily operational workflow: quotation generation, subscription management, and payment reconciliation.

| Role | Email | Password | Name | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Internal Staff** | `staff@brightloop.io` | `BrightStaff2026!` | Marcus Reed (Operations) | Quotations, subscriptions, billing runs & invoice reconciliation |

### 3. Customer Self-Service Portal Access (`Customer`)
Isolated customer portal for viewing active subscriptions, pausing/resuming services, downloading statements, and settling invoices online.

| Customer Name | Company / Organization | Email | Password | Subscription Scenario |
| :--- | :--- | :--- | :--- | :--- |
| **Sarah Jenkins** | TechCorp Global Solutions | `sarah@techcorp.com` | `CustomerPass2026!` | Active Monthly subscription & paid invoices |
| **John Davis** | Urban Retailers Ltd | `john@urbanretail.com` | `CustomerPass2026!` | Active Yearly subscription with **Odoo Variant (+$560.00)** & overdue invoice |
| **Alex Rivera** | QuickStart Studio | `alex@quickstart.co` | `CustomerPass2026!` | Pending sandbox quotation awaiting customer approval |
| **Emily Watson** | Apex Freight & Logistics | `emily.watson@apexlogistics.com` | `CustomerPass2026!` | Active Enterprise Custom cluster with partial payment |
| **Robert Kim** | FinTech Pulse Technologies | `robert.kim@fintechpulse.io` | `CustomerPass2026!` | Regulatory SaaS deployment with hardware 2FA tokens & Stripe payment |
| **Clara Moreau** | Lyon Advisory Group | `clara.moreau@lyonconsulting.eu` | `CustomerPass2026!` | Paused subscription lifecycle demo with EU digital tax (10%) |
| **Samuel Okonkwo** | Sahara Clean Power | `sam.okonkwo@saharaenergy.org` | `CustomerPass2026!` | Annual renewable grid monitoring contract settled via SWIFT wire |
| **Dr. Priya Nair** | Vertex Health Analytics | `priya.nair@vertexhealth.com` | `CustomerPass2026!` | Draft stage HIPAA-compliant analytics quote |
| **Hannah Schmidt** | Nordic Cloud Systems GmbH | `hannah.schmidt@nordiccloud.de` | `CustomerPass2026!` | Active weekly dev sprint with invoice due soon |
| **Carlos Mendoza** | LatAm Commerce Hub | `carlos.mendoza@latamgrowth.com` | `CustomerPass2026!` | Closed subscription showing term completion policy |

> [!NOTE]
> All passwords strictly enforce the system security policy: minimum 9 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character (`!@#$%^&*`).

---

## Tech Stack & Architecture

### Frontend (`client/`)
- **Core**: React 18 with Vite
- **Styling**: Material-UI (MUI v5) styled with a high-contrast **Swiss B2B design system**
  - Hairline 1px borders (`rgba(17, 24, 39, 0.08)`)
  - DM Sans typography with high typographic hierarchy
  - Tabular numerals (`tabular-nums`) for currency and decimal alignment
  - Curated status chips (Active: Emerald, Paused: Amber, Closed: Slate, Quotation: Sky)
- **Shells**: Dual navigational shells — Collapsible drawer **ConsoleShell** for staff/admins and top AppBar **PortalShell** for customers.

### Backend (`server/`)
- **Runtime**: Node.js ES Modules with Express
- **Database**: SQLite 3 with Write-Ahead Logging (`WAL`) mode enabled via `better-sqlite3` for sub-millisecond concurrent read/write transactions.
- **Security**: JWT session tokens with HTTP-only Authorization bearer headers, bcryptjs password hashing, and role middleware.

---

## Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Installation
Install root, server, and client dependencies:
```bash
# In the root repository directory
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Initialize & Seed Database
Seed standard products, Odoo variants, plans, tax rules, conditional discounts, and demo accounts:
```bash
npm run seed
```

### 4. Run the Development Platform
Run both the backend API and frontend client in separate terminals:

**Terminal 1 — Backend API (Port 5000):**
```bash
npm run server
```

**Terminal 2 — Frontend Client (Port 3000):**
```bash
npm run client
```

Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

---

## Automated Verification & Test Suites

Brightloop includes automated test coverage across all architectural pillars:

```bash
npm test
```

### Test Suites Executed:
1. `server/tests/auth.test.js`: Password complexity checklist rules, JWT validation, and RBAC integrity.
2. `server/tests/products_plans.test.js`: Product creation, variant pricing delta verification (`+$560.00 Odoo`), and recurring cadences.
3. `server/tests/subscriptions.test.js`: Quotation templates, sequential reference formatting (`SUB-XXXX`), line math, and state machine transitions.
4. `server/tests/billing_invoices.test.js`: Automated billing run idempotency, tax computations, conditional discount validation, and overdue tracking.
5. `server/tests/payments_analytics.test.js`: Payment capture, auto-reconciliation of invoice balance, and sub-2s executive analytics SLA benchmark.
6. `server/tests/e2e_scenarios.test.js`: Complete end-to-end multi-role lifecycle walkthrough from quote to final settlement.

---

## API Reference Summary

| Method | Endpoint | Description | Auth Scope |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & issue JWT token | Public |
| `POST` | `/api/auth/register` | Register new customer account | Public |
| `POST` | `/api/auth/forgot-password` | Generate reset token | Public |
| `POST` | `/api/auth/reset-password` | Validate token & reset password | Public |
| `GET` | `/api/products` | Retrieve products catalog with variants | Authenticated |
| `POST` | `/api/products` | Create product & variant attribute deltas | Admin |
| `GET` | `/api/plans` | Retrieve recurring plans & lifecycle rules | Authenticated |
| `POST` | `/api/plans` | Create recurring plan | Admin |
| `GET` | `/api/templates` | Retrieve quotation templates | Staff / Admin |
| `GET` | `/api/subscriptions` | Retrieve subscriptions list | Staff / Admin |
| `POST` | `/api/subscriptions` | Create new subscription or quote | Staff / Admin |
| `PUT` | `/api/subscriptions/:id/status`| Transition subscription status | Staff / Admin / Customer |
| `POST` | `/api/invoices/run-billing` | Trigger batch idempotent billing run | Staff / Admin |
| `GET` | `/api/invoices` | List invoices with status & balance due | Staff / Admin |
| `POST` | `/api/payments` | Record payment against invoice | Staff / Admin / Customer |
| `GET` | `/api/analytics/dashboard` | Executive KPI cards & overdue receivables | Staff / Admin |
| `GET` | `/api/portal/subscriptions`| Scoped subscriptions for current customer | Customer |
| `GET` | `/api/portal/invoices` | Scoped invoices & receipts for customer | Customer |

---

## Production Build Verification

To verify production bundling and optimization:
```bash
npm run build
```
Builds the optimized single-page application into `client/dist/` in ~6 seconds with 0 errors.

---

## License
Proprietary — Brightloop Software Inc. All rights reserved.
