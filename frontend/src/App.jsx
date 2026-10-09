import React, { useEffect, useState } from 'react';
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate
} from 'react-router-dom';
import api from './api.js';
import { errorMessage, validateForm } from './utils.js';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

function Layout({ children }) {
  const user = getUser();
  const navigate = useNavigate();

  if (!user) return children;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => navigate('/')}>
          <span className="brand-mark">★</span>
          <span>StoreRate</span>
        </div>
        <div className="top-actions">
          <span className="user-chip">{user.name}</span>
          <span className="role-chip">{user.role.replaceAll('_', ' ')}</span>
          <button className="btn ghost" onClick={logout}>Logout</button>
        </div>
      </header>
      <div className="content-shell">{children}</div>
    </div>
  );
}

function Protected({ roles, children }) {
  const user = getUser();
  const location = useLocation();

  if (!user || !localStorage.getItem('token')) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function HomeRedirect() {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'SYSTEM_ADMIN') return <Navigate to="/admin" replace />;
  if (user.role === 'STORE_OWNER') return <Navigate to="/owner" replace />;
  return <Navigate to="/user" replace />;
}

function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-brand">
          <span className="brand-mark">★</span>
          <div>
            <strong>StoreRate</strong>
            <small>Rate better. Discover better.</small>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-copy">
        <h1>Welcome back</h1>
        <p>Sign in to manage stores, ratings and your account.</p>
      </div>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="form-stack">
        <Field label="Email">
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn primary full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="auth-switch">
        New user? <NavLink to="/register">Create an account</NavLink>
      </p>
      
    </AuthLayout>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', address: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const validation = validateForm(form);
    if (validation) return setError(validation);
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-copy">
        <h1>Create account</h1>
        <p>Register as a normal user and start rating stores.</p>
      </div>
      {error && <Alert>{error}</Alert>}
      <form onSubmit={submit} className="form-stack">
        <Field label="Full name" hint="20–60 characters">
          <input required value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email">
          <input type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Address" hint="Maximum 400 characters">
          <textarea required rows="3" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <Field label="Password" hint="8–16 chars, uppercase + special character">
          <input type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn primary full" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="auth-switch">
        Already registered? <NavLink to="/login">Sign in</NavLink>
      </p>
    </AuthLayout>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Alert({ children, type = 'error' }) {
  return <div className={`alert ${type}`}>{children}</div>;
}

function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SortButton({ label, field, sort, onSort }) {
  const active = sort.field === field;
  return (
    <button type="button" className="sort-button" onClick={() => onSort(field)}>
      {label} {active ? (sort.direction === 'ASC' ? '↑' : '↓') : '↕'}
    </button>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, stores: 0, ratings: 0 });
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [owners, setOwners] = useState([]);
  const [tab, setTab] = useState('overview');
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [storeFilters, setStoreFilters] = useState({ name: '', email: '', address: '' });
  const [sort, setSort] = useState({ field: 'name', direction: 'ASC' });
  const [storeSort, setStoreSort] = useState({ field: 'name', direction: 'ASC' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '', email: '', address: '', password: '', role: 'NORMAL_USER'
  });
  const [storeForm, setStoreForm] = useState({
    name: '', email: '', address: '', ownerId: ''
  });

  async function load() {
    try {
      const [s, u, st, ow] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/users', { params: { ...filters, sortBy: sort.field, direction: sort.direction } }),
        api.get('/stores', { params: { ...storeFilters, sortBy: storeSort.field, direction: storeSort.direction } }),
        // owners dropdown must not shrink when the user table filters are applied
        api.get('/users', { params: { role: 'STORE_OWNER' } })
      ]);
      setStats(s.data);
      setUsers(u.data);
      setStores(st.data);
      setOwners(ow.data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => { load(); }, [JSON.stringify(filters), sort.field, sort.direction, JSON.stringify(storeFilters), storeSort.field, storeSort.direction]);

  function toggleSort(setter, current, field) {
    setter({ field, direction: current.field === field && current.direction === 'ASC' ? 'DESC' : 'ASC' });
  }

  async function createUser(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const validation = validateForm(userForm);
    if (validation) return setError(validation);

    try {
      await api.post('/users', userForm);
      setMessage('User created successfully.');
      setUserForm({ name: '', email: '', address: '', password: '', role: 'NORMAL_USER' });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function createStore(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!storeForm.name.trim()) return setError('Store name is required.');
    const validation = validateForm({
      email: storeForm.email,
      address: storeForm.address
    });
    if (validation) return setError(validation);

    try {
      await api.post('/stores', {
        ...storeForm,
        ownerId: storeForm.ownerId || null
      });
      setMessage('Store created successfully.');
      setStoreForm({ name: '', email: '', address: '', ownerId: '' });
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function showUser(id) {
    try {
      const { data } = await api.get(`/users/${id}`);
      setSelectedUser(data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Administrator dashboard"
        subtitle="Manage platform users, stores and submitted ratings."
      />

      {error && <Alert>{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <div className="stats-grid">
        <StatCard label="Total users" value={stats.users} icon="👥" />
        <StatCard label="Total stores" value={stats.stores} icon="🏪" />
        <StatCard label="Submitted ratings" value={stats.ratings} icon="★" />
      </div>

      <div className="tabs">
        {[
          ['overview', 'Overview'],
          ['users', 'Users'],
          ['stores', 'Stores'],
          ['create-user', 'Add user'],
          ['create-store', 'Add store']
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? 'tab active' : 'tab'} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <section className="card">
          <h2>Platform overview</h2>
          <p className="muted">
            Use the tabs above to manage accounts and stores. Store-owner ratings are calculated from submitted user ratings.
          </p>
        </section>
      )}

      {tab === 'users' && (
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Users</h2>
              <p>Filter by name, email, address or role. Click a heading to sort.</p>
            </div>
          </div>
          <div className="filter-grid">
            <input placeholder="Name" value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
            <input placeholder="Email" value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })} />
            <input placeholder="Address" value={filters.address}
              onChange={(e) => setFilters({ ...filters, address: e.target.value })} />
            <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
              <option value="">All roles</option>
              <option value="SYSTEM_ADMIN">System Admin</option>
              <option value="NORMAL_USER">Normal User</option>
              <option value="STORE_OWNER">Store Owner</option>
            </select>
          </div>
          <DataTable>
            <thead>
              <tr>
                <th><SortButton label="Name" field="name" sort={sort} onSort={(f) => toggleSort(setSort, sort, f)} /></th>
                <th><SortButton label="Email" field="email" sort={sort} onSort={(f) => toggleSort(setSort, sort, f)} /></th>
                <th><SortButton label="Address" field="address" sort={sort} onSort={(f) => toggleSort(setSort, sort, f)} /></th>
                <th><SortButton label="Role" field="role" sort={sort} onSort={(f) => toggleSort(setSort, sort, f)} /></th>
                <th>Store / Rating</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.address}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>{u.store_name || '—'} {u.role === 'STORE_OWNER' ? `· ${Number(u.owner_rating || 0).toFixed(1)} ★` : ''}</td>
                  <td><button className="btn small" onClick={() => showUser(u.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      )}

      {tab === 'stores' && (
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Stores</h2>
              <p>Search and sort registered stores.</p>
            </div>
          </div>
          <div className="filter-grid three">
            <input placeholder="Store name" value={storeFilters.name}
              onChange={(e) => setStoreFilters({ ...storeFilters, name: e.target.value })} />
            <input placeholder="Store email" value={storeFilters.email}
              onChange={(e) => setStoreFilters({ ...storeFilters, email: e.target.value })} />
            <input placeholder="Address" value={storeFilters.address}
              onChange={(e) => setStoreFilters({ ...storeFilters, address: e.target.value })} />
          </div>
          <DataTable>
            <thead>
              <tr>
                <th><SortButton label="Name" field="name" sort={storeSort} onSort={(f) => toggleSort(setStoreSort, storeSort, f)} /></th>
                <th><SortButton label="Email" field="email" sort={storeSort} onSort={(f) => toggleSort(setStoreSort, storeSort, f)} /></th>
                <th><SortButton label="Address" field="address" sort={storeSort} onSort={(f) => toggleSort(setStoreSort, storeSort, f)} /></th>
                <th><SortButton label="Rating" field="average_rating" sort={storeSort} onSort={(f) => toggleSort(setStoreSort, storeSort, f)} /></th>
                <th><SortButton label="Ratings" field="rating_count" sort={storeSort} onSort={(f) => toggleSort(setStoreSort, storeSort, f)} /></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.email}</td>
                  <td>{s.address}</td>
                  <td><RatingValue value={s.average_rating} /></td>
                  <td>{s.rating_count}</td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        </section>
      )}

      {tab === 'create-user' && (
        <section className="card narrow-card">
          <h2>Add user</h2>
          <p className="muted">Admins can create all three supported roles.</p>
          <form onSubmit={createUser} className="form-grid">
            <Field label="Name"><input required value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} /></Field>
            <Field label="Email"><input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} /></Field>
            <Field label="Address"><textarea required rows="3" value={userForm.address} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} /></Field>
            <Field label="Password"><input type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} /></Field>
            <Field label="Role">
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="NORMAL_USER">Normal User</option>
                <option value="STORE_OWNER">Store Owner</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
              </select>
            </Field>
            <button className="btn primary">Create user</button>
          </form>
        </section>
      )}

      {tab === 'create-store' && (
        <section className="card narrow-card">
          <h2>Add store</h2>
          <p className="muted">Assign an existing STORE_OWNER to this store.</p>
          <form onSubmit={createStore} className="form-grid">
            <Field label="Store name"><input required value={storeForm.name} onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })} /></Field>
            <Field label="Store email"><input type="email" required value={storeForm.email} onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })} /></Field>
            <Field label="Address"><textarea required rows="3" value={storeForm.address} onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })} /></Field>
            <Field label="Store owner">
              <select value={storeForm.ownerId} onChange={(e) => setStoreForm({ ...storeForm, ownerId: e.target.value })}>
                <option value="">No owner assigned</option>
                {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name} — {owner.email}</option>)}
              </select>
            </Field>
            <button className="btn primary">Create store</button>
          </form>
        </section>
      )}

      {selectedUser && (
        <Modal title="User details" onClose={() => setSelectedUser(null)}>
          <div className="detail-list">
            <div><span>Name</span><strong>{selectedUser.name}</strong></div>
            <div><span>Email</span><strong>{selectedUser.email}</strong></div>
            <div><span>Address</span><strong>{selectedUser.address}</strong></div>
            <div><span>Role</span><strong><RoleBadge role={selectedUser.role} /></strong></div>
            {selectedUser.role === 'STORE_OWNER' && (
              <>
                <div><span>Store</span><strong>{selectedUser.store_name || '—'}</strong></div>
                <div><span>Rating</span><strong><RatingValue value={selectedUser.store_rating} /></strong></div>
                <div><span>Rating count</span><strong>{selectedUser.rating_count}</strong></div>
              </>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}

function DataTable({ children }) {
  return <div className="table-wrap"><table>{children}</table></div>;
}

function RoleBadge({ role }) {
  return <span className={`role-badge ${role.toLowerCase()}`}>{role.replaceAll('_', ' ')}</span>;
}

function RatingValue({ value }) {
  return <span className="rating-value"><span className="star">★</span> {Number(value || 0).toFixed(1)}</span>;
}

function RatingInput({ value, onChange }) {
  return (
    <div className="rating-input" aria-label="Choose rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          className={n <= value ? 'selected' : ''}
          onClick={() => onChange(n)}
          aria-label={`${n} star`}
        >★</button>
      ))}
    </div>
  );
}

function UserDashboard() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [sort, setSort] = useState({ field: 'name', direction: 'ASC' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [ratingDrafts, setRatingDrafts] = useState({});

  async function load() {
    try {
      const { data } = await api.get('/stores', {
        params: { ...filters, sortBy: sort.field, direction: sort.direction }
      });
      setStores(data);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  useEffect(() => { load(); }, [JSON.stringify(filters), sort.field, sort.direction]);

  async function saveRating(storeId) {
    const value = ratingDrafts[storeId];
    if (!value) return setError('Choose a rating from 1 to 5.');
    try {
      await api.post('/ratings', { storeId, rating: value });
      setMessage('Rating saved.');
      setError('');
      await load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  function toggleSort(field) {
    setSort({
      field,
      direction: sort.field === field && sort.direction === 'ASC' ? 'DESC' : 'ASC'
    });
  }

  return (
    <>
      <PageHeader
        title="Store directory"
        subtitle="Search stores, see overall ratings and submit or change your rating."
      />
      {error && <Alert>{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <section className="card">
        <div className="filter-grid two">
          <input placeholder="Search by store name" value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
          <input placeholder="Search by address" value={filters.address}
            onChange={(e) => setFilters({ ...filters, address: e.target.value })} />
        </div>

        <DataTable>
          <thead>
            <tr>
              <th><SortButton label="Store" field="name" sort={sort} onSort={toggleSort} /></th>
              <th><SortButton label="Address" field="address" sort={sort} onSort={toggleSort} /></th>
              <th><SortButton label="Overall rating" field="average_rating" sort={sort} onSort={toggleSort} /></th>
              <th>Your rating</th>
              <th>Submit / modify</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => {
              const current = Number(ratingDrafts[store.id] || store.user_rating || 0);
              return (
                <tr key={store.id}>
                  <td>
                    <strong>{store.name}</strong>
                    <small className="table-sub">{store.email}</small>
                  </td>
                  <td>{store.address}</td>
                  <td><RatingValue value={store.average_rating} /></td>
                  <td>{store.user_rating ? <RatingValue value={store.user_rating} /> : <span className="muted">Not rated</span>}</td>
                  <td>
                    <RatingInput value={current} onChange={(v) => setRatingDrafts({ ...ratingDrafts, [store.id]: v })} />
                    <button className="btn small primary" onClick={() => saveRating(store.id)}>
                      {store.user_rating ? 'Update rating' : 'Submit rating'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </section>

      <ChangePassword />
    </>
  );
}

function OwnerDashboard() {
  const [data, setData] = useState({ store: null, ratings: [] });
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ field: 'updated_at', direction: 'DESC' });

  useEffect(() => {
    api.get('/owner/dashboard', { params: { sortBy: sort.field, direction: sort.direction } })
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err)));
  }, [sort.field, sort.direction]);

  function toggleSort(field) {
    setSort({
      field,
      direction: sort.field === field && sort.direction === 'ASC' ? 'DESC' : 'ASC'
    });
  }

  return (
    <>
      <PageHeader title="Store owner dashboard" subtitle="Monitor your store's rating performance." />
      {error && <Alert>{error}</Alert>}

      {!data.store ? (
        <section className="card empty-state">
          <h2>No store assigned</h2>
          <p>Ask an administrator to assign a store to your store-owner account.</p>
        </section>
      ) : (
        <>
          <div className="owner-summary">
            <div className="card">
              <span>Store</span>
              <h2>{data.store.name}</h2>
              <p>{data.store.address}</p>
            </div>
            <div className="card rating-big">
              <span>Average rating</span>
              <strong>{Number(data.store.average_rating).toFixed(1)}</strong>
              <span>★ from {data.store.rating_count} submitted ratings</span>
            </div>
          </div>

          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Rating submitters</h2>
                <p>Users who have submitted ratings for your store.</p>
              </div>
            </div>
            <DataTable>
              <thead>
                <tr>
                  <th><SortButton label="Name" field="name" sort={sort} onSort={toggleSort} /></th>
                  <th><SortButton label="Email" field="email" sort={sort} onSort={toggleSort} /></th>
                  <th><SortButton label="Address" field="address" sort={sort} onSort={toggleSort} /></th>
                  <th><SortButton label="Rating" field="rating" sort={sort} onSort={toggleSort} /></th>
                  <th><SortButton label="Updated" field="updated_at" sort={sort} onSort={toggleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {data.ratings.map((r) => (
                  <tr key={r.user_id}>
                    <td>{r.name}</td>
                    <td>{r.email}</td>
                    <td>{r.address}</td>
                    <td><RatingValue value={r.rating} /></td>
                    <td>{new Date(r.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </section>
        </>
      )}

      <ChangePassword />
    </>
  );
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    const validation = validateForm({ password: form.newPassword });
    if (validation) return setError(validation);

    try {
      const { data } = await api.put('/users/me/password', form);
      setMessage(data.message);
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <section className="card password-card">
      <h2>Change password</h2>
      <p className="muted">Use the required 8–16 character password format.</p>
      {error && <Alert>{error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      <form className="password-form" onSubmit={submit}>
        <input type="password" required placeholder="Current password"
          value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <input type="password" required placeholder="New password"
          value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        <button className="btn primary">Update password</button>
      </form>
    </section>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Protected roles={['SYSTEM_ADMIN']}><AdminDashboard /></Protected>} />
        <Route path="/user" element={<Protected roles={['NORMAL_USER']}><UserDashboard /></Protected>} />
        <Route path="/owner" element={<Protected roles={['STORE_OWNER']}><OwnerDashboard /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
