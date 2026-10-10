import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import PageHeader from '../components/PageHeader.jsx';
import StatusMessage from '../components/StatusMessage.jsx';

const currency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0));
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN') : '—';
const monthLabel = (month, year) => month && year ? new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'This month';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get('/dashboard'), api.get('/insights')]).then(([summaryResult, insightResult]) => {
      if (!active) return;
      if (summaryResult.status === 'fulfilled') setDashboard(summaryResult.value.data);
      else setError(summaryResult.reason.response?.data?.message || 'Could not load dashboard data.');
      if (insightResult.status === 'fulfilled') setInsights(Array.isArray(insightResult.value.data) ? insightResult.value.data : []);
      else setError((current) => current || insightResult.reason.response?.data?.message || 'Could not load financial insights.');
      setLoading(false); setInsightsLoading(false);
    });
    return () => { active = false; };
  }, []);

  if (loading) return <><PageHeader title="Dashboard" description="A current view of your personal finances." /><p className="muted">Loading your dashboard…</p></>;
  if (!dashboard) return <><PageHeader title="Dashboard" description="A current view of your personal finances." /><StatusMessage error={error || 'Dashboard data is unavailable.'} /></>;

  const budgets = dashboard.budgetSummary || [];
  const payments = dashboard.upcomingPayments || [];
  const goals = dashboard.savingsGoals || [];
  const transactions = dashboard.recentTransactions || [];
  const categoryData = dashboard.expenseByCategory || [];
  const income = Number(dashboard.currentMonthIncome || 0);
  const expenses = Number(dashboard.currentMonthExpenses || 0);
  const flowMax = Math.max(income, expenses, 1);
  const categoryMax = Math.max(...categoryData.map((item) => Number(item.amount || 0)), 1);
  const period = monthLabel(dashboard.month, dashboard.year);

  return <>
    <PageHeader eyebrow="YOUR FINANCIAL OVERVIEW" title="Your money, in focus." description={`A clear look at your accounts and activity for ${period}.`} />
    <StatusMessage error={error} />
    <section className="dashboard-stats dashboard-stats-five">
      {[ 
        ['Total balance', dashboard.totalAccountBalance], ['Monthly income', dashboard.currentMonthIncome],
        ['Monthly expenses', dashboard.currentMonthExpenses], ['Monthly savings', dashboard.currentMonthSavings],
      ].map(([label, value]) => <article className="summary-card" key={label}><p>{label}</p><strong>{currency(value)}</strong></article>)}
      <article className="summary-card"><p>Savings rate</p><strong>{Number(dashboard.savingsRate || 0).toFixed(1)}%</strong><small>Monthly savings as a share of income</small></article>
    </section>

    <div className="dashboard-grid">
      <section className="dashboard-panel dashboard-chart-panel"><header><div><h2>Income vs expense</h2><p>{period}</p></div></header>
        {income === 0 && expenses === 0 ? <p className="panel-empty chart-empty">No income or expense data for this month.</p> :
          <div className="income-expense-chart" role="img" aria-label={`Income ${currency(income)} compared with expenses ${currency(expenses)}`}>
            <div className="chart-axis"><span>{currency(flowMax)}</span><span>{currency(flowMax * 0.5)}</span><span>₹0</span></div>
            <div className="bar-chart-area"><div className="bar-column"><strong>{currency(income)}</strong><div className="vertical-bar-track"><span className="income-bar" style={{ height: `${Math.max((income / flowMax) * 100, income > 0 ? 3 : 0)}%` }} /></div><small>Income</small></div>
              <div className="bar-column"><strong>{currency(expenses)}</strong><div className="vertical-bar-track"><span className="expense-bar" style={{ height: `${Math.max((expenses / flowMax) * 100, expenses > 0 ? 3 : 0)}%` }} /></div><small>Expenses</small></div></div>
          </div>}
      </section>

      <section className="dashboard-panel dashboard-chart-panel"><header><div><h2>Expenses by category</h2><p>{period}</p></div></header>
        {categoryData.length === 0 ? <p className="panel-empty chart-empty">No expense data by category for this month.</p> :
          <div className="category-chart" aria-label="Monthly expenses by category">{categoryData.map((item) => <div className="category-chart-row" key={item.category}>
            <div className="category-chart-label"><strong>{item.category}</strong><span>{currency(item.amount)}</span></div><div className="progress-track"><span style={{ width: `${Math.max((Number(item.amount || 0) / categoryMax) * 100, 2)}%` }} /></div>
          </div>)}</div>}
      </section>

      <section className="dashboard-panel"><header><div><h2>Budget summary</h2><p>Category spending against this month’s limits.</p></div></header>
        {budgets.length === 0 ? <p className="panel-empty">No budgets set for this month.</p> : budgets.map((item) => {
          const percent = Number(item.percentageUsed || 0); const state = percent >= 100 ? 'over' : percent >= 80 ? 'near' : '';
          return <div className="mini-budget" key={item.id}><div className="mini-budget-heading"><strong>{item.category}</strong><span>{currency(item.amountSpent)} / {currency(item.amount)}</span></div>
            <div className="progress-track"><span className={state} style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }} /></div><small>{item.status}</small></div>;
        })}
      </section>

      <section className="dashboard-panel"><header><div><h2>Upcoming payments</h2><p>Next scheduled recurring expenses.</p></div></header>
        {payments.length === 0 ? <p className="panel-empty">No upcoming recurring payments.</p> : payments.map((item) => <div className="dashboard-list-row" key={item.id}><div><strong>{item.name}</strong><small>{item.category} · {dateLabel(item.nextPaymentDate)}</small></div><b>{currency(item.amount)}</b></div>)}
      </section>

      <section className="dashboard-panel"><header><div><h2>Savings goals</h2><p>Progress toward your targets.</p></div></header>
        {goals.length === 0 ? <p className="panel-empty">No savings goals yet.</p> : goals.map((goal) => {
          const progress = Number(goal.progressPercentage || 0);
          return <div className="dashboard-goal" key={goal.id}><div className="mini-budget-heading"><strong>{goal.name}</strong><span>{progress.toFixed(0)}%</span></div>
            <div className="progress-track"><span style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }} /></div><small>{currency(goal.currentAmount)} saved of {currency(goal.targetAmount)}{goal.targetDate ? ` · target ${dateLabel(goal.targetDate)}` : ''}</small></div>;
        })}
      </section>

      <section className="dashboard-panel"><header><div><h2>Recent transactions</h2><p>Latest account activity.</p></div></header>
        {transactions.length === 0 ? <p className="panel-empty">No transactions recorded yet.</p> : transactions.map((item) => <div className="dashboard-list-row" key={item.id}><div><strong>{item.description || item.category}</strong><small>{item.category} · {item.accountName} · {dateLabel(item.date)}</small></div><b className={item.type === 'INCOME' ? 'income-value' : ''}>{item.type === 'INCOME' ? '+' : '−'}{currency(item.amount)}</b></div>)}
      </section>

      <section className="dashboard-panel dashboard-insights"><header><div><h2>Financial insights</h2><p>Rule-based observations from your financial activity.</p></div></header>
        {insightsLoading ? <p className="panel-empty">Loading insights…</p> : insights.length === 0 ? <p className="panel-empty">No insights available yet.</p> : <ul className="insight-list">{insights.map((message, index) => <li key={`${message}-${index}`}>{message}</li>)}</ul>}
      </section>
    </div>
  </>;
}
