import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Lock, User, AlertCircle, Mail, Type, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const result = await register(
      formData.username,
      formData.password,
      formData.fullName,
      formData.email
    );

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: 'var(--bg-primary)' }}>

      {/* Left Side - Image Background */}
      <div style={{
        flex: 1,
        backgroundImage: 'url("/register_bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '4rem',
        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,15,22,1) 0%, rgba(15,15,22,0.4) 50%, rgba(15,15,22,0.8) 100%)' }} />

        <div style={{ zIndex: 1, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
              <ShieldCheck size={32} color="#00cec9" />
            </div>
            <h1 style={{ fontSize: '2rem', margin: 0, color: '#fff', fontWeight: 700, letterSpacing: '-0.5px' }}>Customer Portal</h1>
          </div>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', maxWidth: '480px', lineHeight: 1.6, margin: 0 }}>
            Join our secure insurance portal today. Submit claims quickly and track their real-time approval status with complete transparency.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '3rem',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontWeight: 700 }}>Create Account</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Join the secure insurance portal.</p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)', color: '#e17055', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <Type size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    name="fullName"
                    className="form-input auth-input"
                    style={{ paddingLeft: '44px', height: '48px' }}
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Username *</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    name="username"
                    className="form-input auth-input"
                    style={{ paddingLeft: '44px', height: '48px' }}
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  name="email"
                  className="form-input auth-input"
                  style={{ paddingLeft: '44px', height: '48px' }}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  name="password"
                  className="form-input auth-input"
                  style={{ paddingLeft: '44px', height: '48px' }}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block', fontWeight: 500 }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input auth-input"
                  style={{ paddingLeft: '44px', height: '48px' }}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '52px', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', borderRadius: '10px', backgroundColor: '#00cec9', borderColor: '#00cec9' }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Register as Customer'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: '#00cec9', textDecoration: 'none', fontWeight: 600, marginLeft: '0.25rem' }}>Sign In here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
