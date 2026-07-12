import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';

const expenseTypes = ['Toll', 'Maintenance', 'Miscellaneous', 'Insurance', 'Permit', 'Fine', 'Parking'];

const FuelExpensePage = () => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fuel');
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [fuelForm, setFuelForm] = useState({
    vehicle: '', trip: '', liters: '', cost: '', pricePerLiter: '',
    date: new Date().toISOString().slice(0, 10),
    odometer: '', station: '', fuelType: 'Diesel'
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicle: '', trip: '', type: 'Toll', amount: '',
    description: '', date: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [fuelRes, expRes, vRes, tRes] = await Promise.all([
        api.get('/fuel'),
        api.get('/expenses'),
        api.get('/vehicles'),
        api.get('/trips')
      ]);
      setFuelLogs(fuelRes.data);
      setExpenses(expRes.data);
      setVehicles(vRes.data);
      setTrips(tRes.data);
    } catch {
      toast.error('Failed to load data', { theme: 'dark' });
    } finally {
      setLoading(false);
    }
  };

  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/fuel', fuelForm);
      toast.success('Fuel log added!', { theme: 'dark' });
      setShowFuelModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving fuel log');
    } finally { setSubmitting(false); }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/expenses', expenseForm);
      toast.success('Expense added!', { theme: 'dark' });
      setShowExpenseModal(false);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving expense');
    } finally { setSubmitting(false); }
  };

  const handleDeleteFuel = async (id) => {
    if (!confirm('Delete this fuel log?')) return;
    try {
      await api.delete(`/fuel/${id}`);
      toast.success('Deleted', { theme: 'dark' });
      fetchAll();
    } catch { toast.error('Cannot delete', { theme: 'dark' }); }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted', { theme: 'dark' });
      fetchAll();
    } catch { toast.error('Cannot delete', { theme: 'dark' }); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN').format(n || 0);
  const fuelTotal = fuelLogs.reduce((s, l) => s + (l.cost || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalLiters = fuelLogs.reduce((s, l) => s + (l.liters || 0), 0);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <h1>⛽ Fuel & Expenses</h1>
            <p>Track operational costs</p>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn btn-secondary" onClick={() => { setShowFuelModal(true); setError(''); }}>⛽ Add Fuel Log</button>
            <button className="topbar-btn btn-primary" onClick={() => { setShowExpenseModal(true); setError(''); }}>+ Add Expense</button>
          </div>
        </div>

        <div className="page-container">
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Total Fuel Cost', value: `₹${fmt(fuelTotal)}`, icon: '⛽', color: 'var(--warning)' },
              { label: 'Total Liters', value: `${totalLiters.toFixed(1)} L`, icon: '🛢️', color: 'var(--secondary)' },
              { label: 'Other Expenses', value: `₹${fmt(expenseTotal)}`, icon: '💸', color: 'var(--danger)' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{s.icon}</div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', borderRadius: '8px', padding: '3px', marginBottom: '20px', width: 'fit-content' }}>
            {['fuel', 'expenses'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
                  background: activeTab === tab ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab ? 'white' : 'var(--text-muted)'
                }}
              >
                {tab === 'fuel' ? '⛽ Fuel Logs' : '💸 Expenses'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : activeTab === 'fuel' ? (
            <div className="table-container">
              <div className="table-header">
                <div className="table-title">Fuel Logs ({fuelLogs.length})</div>
              </div>
              {fuelLogs.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">⛽</div><div className="empty-title">No fuel logs</div></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Trip</th>
                      <th>Date</th>
                      <th>Liters</th>
                      <th>Price/L</th>
                      <th>Cost</th>
                      <th>Odometer</th>
                      <th>Station</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelLogs.map(l => (
                      <tr key={l._id}>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{l.vehicle?.registrationNumber}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.vehicle?.name}</div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{l.trip?.tripNumber || '—'}</td>
                        <td style={{ fontSize: '12px' }}>{new Date(l.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontWeight: 600 }}>{l.liters} L</td>
                        <td>{l.pricePerLiter ? `₹${l.pricePerLiter.toFixed(2)}` : '—'}</td>
                        <td style={{ fontWeight: 700, color: 'var(--warning)' }}>₹{fmt(l.cost)}</td>
                        <td>{l.odometer ? `${fmt(l.odometer)} km` : '—'}</td>
                        <td>{l.station || '—'}</td>
                        <td>
                          <button className="topbar-btn btn-danger btn-sm" onClick={() => handleDeleteFuel(l._id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="table-container">
              <div className="table-header">
                <div className="table-title">Expenses ({expenses.length})</div>
              </div>
              {expenses.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">💸</div><div className="empty-title">No expenses recorded</div></div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Trip</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e._id}>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>{e.vehicle?.registrationNumber}</div>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{e.trip?.tripNumber || '—'}</td>
                        <td>
                          <span style={{ background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', color: 'var(--primary-light)' }}>
                            {e.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{fmt(e.amount)}</td>
                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</td>
                        <td style={{ fontSize: '12px' }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                        <td>
                          <button className="topbar-btn btn-danger btn-sm" onClick={() => handleDeleteExpense(e._id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Fuel Modal */}
        {showFuelModal && (
          <div className="modal-overlay" onClick={() => setShowFuelModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">⛽ Add Fuel Log</div>
                <button className="modal-close" onClick={() => setShowFuelModal(false)}>✕</button>
              </div>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <form onSubmit={handleFuelSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Vehicle *</label>
                    <select value={fuelForm.vehicle} onChange={e => setFuelForm({ ...fuelForm, vehicle: e.target.value })} required>
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Trip (Optional)</label>
                    <select value={fuelForm.trip} onChange={e => setFuelForm({ ...fuelForm, trip: e.target.value })}>
                      <option value="">No trip</option>
                      {trips.map(t => <option key={t._id} value={t._id}>{t.tripNumber} — {t.source}→{t.destination}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Liters *</label>
                    <input type="number" value={fuelForm.liters} onChange={e => setFuelForm({ ...fuelForm, liters: e.target.value })} placeholder="e.g. 50" required step="0.1" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Total Cost (₹) *</label>
                    <input type="number" value={fuelForm.cost} onChange={e => setFuelForm({ ...fuelForm, cost: e.target.value })} placeholder="e.g. 4750" required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Odometer (km)</label>
                    <input type="number" value={fuelForm.odometer} onChange={e => setFuelForm({ ...fuelForm, odometer: e.target.value })} placeholder="km" />
                  </div>
                  <div className="form-group">
                    <label>Fuel Station</label>
                    <input value={fuelForm.station} onChange={e => setFuelForm({ ...fuelForm, station: e.target.value })} placeholder="Station name" />
                  </div>
                  <div className="form-group">
                    <label>Fuel Type</label>
                    <select value={fuelForm.fuelType} onChange={e => setFuelForm({ ...fuelForm, fuelType: e.target.value })}>
                      {['Diesel', 'Petrol', 'Electric', 'CNG'].map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowFuelModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-primary" disabled={submitting}>
                    {submitting ? '⏳...' : '✅ Add Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expense Modal */}
        {showExpenseModal && (
          <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-title">💸 Add Expense</div>
                <button className="modal-close" onClick={() => setShowExpenseModal(false)}>✕</button>
              </div>
              {error && <div className="alert alert-error">⚠️ {error}</div>}
              <form onSubmit={handleExpenseSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Vehicle *</label>
                    <select value={expenseForm.vehicle} onChange={e => setExpenseForm({ ...expenseForm, vehicle: e.target.value })} required>
                      <option value="">Select vehicle</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.registrationNumber} — {v.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Expense Type *</label>
                    <select value={expenseForm.type} onChange={e => setExpenseForm({ ...expenseForm, type: e.target.value })}>
                      {expenseTypes.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} placeholder="e.g. 500" required min="0" />
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <input type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} />
                  </div>
                  <div className="form-group full-width">
                    <label>Description *</label>
                    <input value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Describe the expense..." required />
                  </div>
                  <div className="form-group">
                    <label>Trip (Optional)</label>
                    <select value={expenseForm.trip} onChange={e => setExpenseForm({ ...expenseForm, trip: e.target.value })}>
                      <option value="">No trip</option>
                      {trips.map(t => <option key={t._id} value={t._id}>{t.tripNumber} — {t.source}→{t.destination}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-footer">
                  <button type="button" className="topbar-btn btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                  <button type="submit" className="topbar-btn btn-primary" disabled={submitting}>
                    {submitting ? '⏳...' : '✅ Add Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelExpensePage;
