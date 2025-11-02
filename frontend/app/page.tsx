'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface DashboardMetrics {
  revenue: number;
  outstandingReceivables: number;
  outstandingPayables: number;
  utilization: number;
  completedTrips: number;
  totalTrips: number;
  topCustomers: { name: string; total: number }[];
}

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [fleets, setFleets] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const client = useMemo(() => {
    return axios.create({
      baseURL: API_URL,
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  }, [token]);

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? window.localStorage.getItem('flexiapp_token') : null;
    const savedUser = typeof window !== 'undefined' ? window.localStorage.getItem('flexiapp_user') : null;
    if (savedToken) {
      setToken(savedToken);
    }
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function refreshAll() {
    try {
      await Promise.all([
        loadDashboard(),
        loadFleets(),
        loadDrivers(),
        loadSuppliers(),
        loadCustomers(),
        loadTrips(),
        loadInvoices(),
        loadPayments()
      ]);
    } catch (error) {
      console.error('Failed to refresh data', error);
    }
  }

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      setToken(response.data.access_token);
      setUser(response.data.user);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('flexiapp_token', response.data.access_token);
        window.localStorage.setItem('flexiapp_user', JSON.stringify(response.data.user));
      }
      setLoginError(null);
    } catch (error: any) {
      setLoginError(error?.response?.data?.message || 'Unable to login');
    }
  }

  async function loadDashboard() {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    try {
      const { data } = await client.get(`/dashboard?${params.toString()}`);
      setMetrics(data);
    } catch (error) {
      setMetrics(null);
    }
  }

  async function loadFleets() {
    const { data } = await client.get('/fleets');
    setFleets(data);
  }

  async function loadDrivers() {
    const { data } = await client.get('/drivers');
    setDrivers(data);
  }

  async function loadSuppliers() {
    const { data } = await client.get('/suppliers');
    setSuppliers(data);
  }

  async function loadCustomers() {
    const { data } = await client.get('/customers');
    setCustomers(data);
  }

  async function loadTrips() {
    const { data } = await client.get('/trips');
    setTrips(data);
  }

  async function loadInvoices() {
    const { data } = await client.get('/invoices');
    setInvoices(data);
  }

  async function loadPayments() {
    const { data } = await client.get('/payments');
    setPayments(data);
  }

  async function createFleet(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = formDataToObject(form);
    await client.post('/fleets', payload);
    event.currentTarget.reset();
    await loadFleets();
  }

  async function createDriver(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = formDataToObject(form);
    await client.post('/drivers', payload);
    event.currentTarget.reset();
    await loadDrivers();
  }

  async function createSupplier(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = formDataToObject(form);
    await client.post('/suppliers', payload);
    event.currentTarget.reset();
    await loadSuppliers();
  }

  async function createCustomer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = formDataToObject(form);
    await client.post('/customers', payload);
    event.currentTarget.reset();
    await loadCustomers();
  }

  async function createTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, any> = formDataToObject(form);
    payload.rate = Number(payload.rate);
    await client.post('/trips', payload);
    event.currentTarget.reset();
    await loadTrips();
    await loadInvoices();
  }

  async function completeTrip(id: string) {
    await client.put(`/trips/${id}`, { status: 'COMPLETED' });
    await loadTrips();
    await loadInvoices();
  }

  async function recordPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload: Record<string, any> = formDataToObject(form);
    payload.amount = Number(payload.amount);
    await client.post('/payments', payload);
    event.currentTarget.reset();
    await loadInvoices();
    await loadPayments();
  }

  async function downloadInvoice(id: string, invoiceNumber: string) {
    setDownloading(id);
    try {
      const response = await client.get(`/invoices/${id}/pdf`, { responseType: 'arraybuffer' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${invoiceNumber}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(null);
    }
  }

  async function applyDashboardFilter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadDashboard();
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-md rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-2xl font-semibold text-slate-700">Sign in</h2>
        <p className="mb-6 text-sm text-slate-500">
          Use the seeded admin account (<code>admin@flexiapp.local</code> / <code>password123</code>) to explore the
          platform.
        </p>
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              defaultValue="admin@flexiapp.local"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              defaultValue="password123"
            />
          </div>
          {loginError && <p className="text-sm text-red-500">{loginError}</p>}
          <button
            type="submit"
            className="w-full rounded bg-indigo-600 px-4 py-2 text-white shadow hover:bg-indigo-700"
          >
            Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Welcome back{user ? `, ${user.name}` : ''}!</h1>
          <p className="text-sm text-slate-500">Manage your fleet, contracts, and finances from one dashboard.</p>
        </div>
        <div className="rounded border border-slate-200 px-3 py-2 text-right text-xs text-slate-500">
          <div>Role: <span className="font-semibold uppercase text-slate-700">{user?.role}</span></div>
          <div>{user?.email}</div>
        </div>
      </div>

      <section className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-700">Dashboard</h2>
            <p className="text-sm text-slate-500">Overview of revenue, payables and fleet utilization.</p>
          </div>
          <form onSubmit={applyDashboardFilter} className="flex flex-wrap items-end gap-2 text-sm">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500">Start date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="rounded border border-slate-200 px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500">End date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="rounded border border-slate-200 px-2 py-1"
              />
            </div>
            <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-white">
              Apply
            </button>
          </form>
        </div>
        {metrics ? (
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Revenue" value={`$${metrics.revenue.toFixed(2)}`} subtitle="Collected payments" />
            <MetricCard
              title="Outstanding Receivables"
              value={`$${metrics.outstandingReceivables.toFixed(2)}`}
              subtitle="Customer invoices due"
            />
            <MetricCard
              title="Outstanding Payables"
              value={`$${metrics.outstandingPayables.toFixed(2)}`}
              subtitle="Supplier invoices due"
            />
            <MetricCard
              title="Fleet Utilization"
              value={`${metrics.utilization}%`}
              subtitle={`${metrics.completedTrips} completed trips`}
            />
            <MetricCard
              title="Trips"
              value={`${metrics.completedTrips}/${metrics.totalTrips}`}
              subtitle="Completed vs total"
            />
            <div className="rounded border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-600">Top Customers</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-500">
                {metrics.topCustomers.length === 0 && <li>No data</li>}
                {metrics.topCustomers.map((customer) => (
                  <li key={customer.name} className="flex justify-between">
                    <span>{customer.name}</span>
                    <span>${customer.total.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <EntityForm title="New Fleet" onSubmit={createFleet}>
          <TextField name="fleetCode" label="Fleet Code" required />
          <TextField name="serial" label="Serial" required />
          <TextField name="type" label="Type" required />
          <SelectField name="ownership" label="Ownership" options={['OWNED', 'RENT_IN', 'LEASED']} required />
          <SelectField
            name="supplierId"
            label="Supplier"
            options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
          />
        </EntityForm>
        <EntityForm title="New Driver" onSubmit={createDriver}>
          <TextField name="name" label="Name" required />
          <TextField name="phone" label="Phone" required />
          <SelectField name="type" label="Driver Type" options={['OUR_DRIVER', 'SUPPLIER_DRIVER']} required />
          <SelectField
            name="supplierId"
            label="Supplier"
            options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
          />
        </EntityForm>
        <EntityForm title="New Supplier" onSubmit={createSupplier}>
          <TextField name="name" label="Name" required />
          <TextField name="contact" label="Contact" />
          <TextField name="email" label="Email" />
        </EntityForm>
        <EntityForm title="New Customer" onSubmit={createCustomer}>
          <TextField name="name" label="Name" required />
          <TextField name="email" label="Email" />
          <TextField name="phone" label="Phone" />
          <TextField name="address" label="Address" />
        </EntityForm>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-slate-700">Trips</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <EntityForm title="Schedule Trip" onSubmit={createTrip}>
            <TextField name="reference" label="Reference" required />
            <SelectField name="fleetId" label="Fleet" options={fleets.map((f) => ({ label: f.fleetCode, value: f.id }))} required />
            <SelectField name="driverId" label="Driver" options={drivers.map((d) => ({ label: d.name, value: d.id }))} required />
            <SelectField
              name="customerId"
              label="Customer"
              options={customers.map((c) => ({ label: c.name, value: c.id }))}
              required
            />
            <SelectField
              name="supplierId"
              label="Supplier"
              options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
            />
            <SelectField name="rentalMode" label="Rental Mode" options={['MONTHLY', 'DAILY', 'PER_TRIP']} required />
            <TextField name="rate" label="Rate" type="number" step="0.01" required />
            <TextField name="startDate" label="Start Date" type="date" required />
            <TextField name="endDate" label="End Date" type="date" required />
          </EntityForm>
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Reference</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Rate</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {trips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2">{trip.reference}</td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                        {trip.status}
                      </span>
                    </td>
                    <td className="px-3 py-2">${Number(trip.rate).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      {trip.status !== 'COMPLETED' && (
                        <button
                          onClick={() => completeTrip(trip.id)}
                          className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          Mark Completed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold text-slate-700">Invoices</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2 text-left">Invoice #</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-3 py-2">{invoice.invoiceNumber}</td>
                    <td className="px-3 py-2">{invoice.type}</td>
                    <td className="px-3 py-2">{invoice.status}</td>
                    <td className="px-3 py-2 text-right">${Number(invoice.amount).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => downloadInvoice(invoice.id, invoice.invoiceNumber)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        disabled={downloading === invoice.id}
                      >
                        {downloading === invoice.id ? 'Preparing...' : 'PDF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <EntityForm title="Record Payment" onSubmit={recordPayment}>
          <SelectField
            name="invoiceId"
            label="Invoice"
            required
            options={invoices.map((invoice) => ({
              label: `${invoice.invoiceNumber} (${invoice.type})` || invoice.id,
              value: invoice.id
            }))}
          />
          <TextField name="amount" label="Amount" type="number" step="0.01" required />
          <TextField name="method" label="Method" />
          <TextField name="note" label="Note" />
        </EntityForm>
      </section>

      <section className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-slate-700">Audit Logs</h2>
        <AuditLogList token={token} />
      </section>
    </main>
  );
}

function formDataToObject(form: FormData) {
  const payload: Record<string, any> = {};
  form.forEach((value, key) => {
    if (value !== '') {
      payload[key] = value;
    }
  });
  return payload;
}

function MetricCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-600">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  );
}

function EntityForm({ title, onSubmit, children }: { title: string; onSubmit: (event: any) => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 text-lg font-semibold text-slate-700">{title}</h3>
      <form onSubmit={onSubmit} className="space-y-3 text-sm">
        {children}
        <button type="submit" className="rounded bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
          Save
        </button>
      </form>
    </div>
  );
}

function TextField({ name, label, type = 'text', required, step }: { name: string; label: string; type?: string; required?: boolean; step?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  required
}: {
  name: string;
  label: string;
  options: (string | { label: string; value: string })[];
  required?: boolean;
}) {
  const normalized = options.map((option) =>
    typeof option === 'string' ? { label: option.replace('_', ' '), value: option } : option
  );
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor={name}>
        {label}
      </label>
      <select
        id={name}
        name={name}
        required={required}
        className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        defaultValue=""
      >
        <option value="" disabled>
          Select {label}
        </option>
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function AuditLogList({ token }: { token: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const client = useMemo(
    () =>
      axios.create({
        baseURL: API_URL,
        headers: { Authorization: `Bearer ${token}` }
      }),
    [token]
  );

  useEffect(() => {
    async function load() {
      try {
        const { data } = await client.get('/audit-logs');
        setLogs(data);
      } catch (error) {
        setLogs([]);
      }
    }
    load();
  }, [client]);

  return (
    <div className="max-h-64 overflow-y-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="px-3 py-2 text-left">Action</th>
            <th className="px-3 py-2 text-left">Entity</th>
            <th className="px-3 py-2 text-left">Metadata</th>
            <th className="px-3 py-2 text-left">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-3 py-2">{log.action}</td>
              <td className="px-3 py-2">{log.entity}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{JSON.stringify(log.metadata)}</td>
              <td className="px-3 py-2">{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
