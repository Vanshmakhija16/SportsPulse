import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', college: '',
    department: '', year: '', phone: '', role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome to SportsPulse 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide fade-in">
        <div className="auth-header">
          <div className="auth-icon">🏆</div>
          <h1>Create Account</h1>
          <p>Join the SportsPulse community today</p>
        </div>

        <form onSubmit={submit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" value={form.name}
                onChange={handle} placeholder="Your full name" required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className="form-input" type="email" name="email" value={form.email}
                onChange={handle} placeholder="you@college.edu" required />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="form-input" type="password" name="password" value={form.password}
                onChange={handle} placeholder="Min. 6 characters" required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">College / University *</label>
              <input className="form-input" name="college" value={form.college}
                onChange={handle} placeholder="e.g. IIT Delhi" required />
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input className="form-input" name="department" value={form.department}
                onChange={handle} placeholder="e.g. Computer Science" />
            </div>
            <div className="form-group">
              <label className="form-label">Year of Study</label>
              <select className="form-input" name="year" value={form.year} onChange={handle}>
                <option value="">Select year</option>
                {[1,2,3,4,5].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" name="phone" value={form.phone}
                onChange={handle} placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label className="form-label">Register As</label>
              <select className="form-input" name="role" value={form.role} onChange={handle}>
                <option value="student">Student / Athlete</option>
                <option value="coach">Coach / Faculty</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account →'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
