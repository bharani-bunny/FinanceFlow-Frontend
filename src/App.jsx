import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Accounts from './pages/Accounts.jsx';
import Transactions from './pages/Transactions.jsx';
import Budgets from './pages/Budgets.jsx';
import RecurringExpenses from './pages/RecurringExpenses.jsx';
import SavingsGoals from './pages/SavingsGoals.jsx';
import Welcome from './pages/Welcome.jsx';

export default function App() {
  const { token } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={token ? <Navigate to="/app" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/app" replace /> : <Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="recurring-expenses" element={<RecurringExpenses />} />
          <Route path="savings-goals" element={<SavingsGoals />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={token ? '/app' : '/'} replace />} />
    </Routes>
  );
}
