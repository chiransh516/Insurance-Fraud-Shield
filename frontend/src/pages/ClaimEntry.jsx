import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { predictClaim } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';

const VEHICLE_CATALOG = {
  'Maruti Suzuki': ['Swift', 'Baleno', 'Alto', 'WagonR', 'Dzire', 'Brezza'],
  'Hyundai': ['i20', 'Creta', 'Venue', 'Verna', 'i10'],
  'Tata': ['Nexon', 'Punch', 'Harrier', 'Altroz', 'Tiago'],
  'Mahindra': ['Scorpio', 'XUV700', 'Thar', 'Bolero', 'XUV300'],
  'Kia': ['Seltos', 'Sonet', 'Carens'],
  'Toyota': ['Fortuner', 'Innova', 'Glanza', 'Urban Cruiser'],
  'Honda': ['City', 'Amaze', 'Elevate'],
  'MG': ['Hector', 'Astor', 'Gloster'],
  'Skoda': ['Slavia', 'Kushaq', 'Superb'],
  'Volkswagen': ['Virtus', 'Taigun', 'Polo'],
};

const DAMAGE_TYPES = ['Bumper Damage', 'Windshield Damage', 'Engine Damage', 'Airbag Deployment', 'Total Loss', 'Scratch-Dent', 'Electrical Damage'];
const SEVERITIES = ['Minor', 'Moderate', 'Severe'];
const POLICY_TYPES = ['Comprehensive', 'Third-Party', 'Own-Damage'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

export default function ClaimEntry() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useContext(AuthContext);

  const [form, setForm] = useState({
    customer_age: '',
    customer_gender: 'Male',
    customer_region: 'North',
    num_past_claims: '0',
    policy_type: 'Comprehensive',
    coverage_amount: '',
    policy_start_date: '',
    policy_end_date: '',
    vehicle_make: 'Maruti Suzuki',
    vehicle_model: 'Swift',
    vehicle_manufacture_year: '2020',
    insured_declared_value: '',
    damage_type: 'Bumper Damage',
    damage_severity: 'Minor',
    claim_amount_requested: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Reset vehicle model when make changes
      if (name === 'vehicle_make') {
        updated.vehicle_model = VEHICLE_CATALOG[value]?.[0] || '';
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        customer_age: parseInt(form.customer_age),
        num_past_claims: parseInt(form.num_past_claims),
        coverage_amount: parseFloat(form.coverage_amount),
        vehicle_manufacture_year: parseInt(form.vehicle_manufacture_year),
        insured_declared_value: parseFloat(form.insured_declared_value),
        claim_amount_requested: parseFloat(form.claim_amount_requested),
      };

      const res = await predictClaim(payload);
      
      if (user?.role === 'user') {
        const msg = 'Claim submitted successfully! It is now pending review by an agent.';
        setSuccess(msg);
        alert(msg);
        setForm({
            customer_age: '', customer_gender: 'Male', customer_region: 'North', num_past_claims: '0',
            policy_type: 'Comprehensive', coverage_amount: '', policy_start_date: '', policy_end_date: '',
            vehicle_make: 'Maruti Suzuki', vehicle_model: 'Swift', vehicle_manufacture_year: '2020',
            insured_declared_value: '', damage_type: 'Bumper Damage', damage_severity: 'Minor', claim_amount_requested: '',
        });
      } else {
        // Navigate to result page with the prediction data for admins
        navigate('/prediction-result', { state: { prediction: res.data } });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Prediction failed. Check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const vehicleModels = VEHICLE_CATALOG[form.vehicle_make] || [];

  return (
    <div>
      <div className="page-header">
        <h1>Submit New Claim</h1>
        <p>Enter claim details to get fraud prediction and amount estimate</p>
      </div>

      {error && (
        <div style={{ background: 'rgba(225,112,85,0.1)', border: '1px solid rgba(225,112,85,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '24px', color: 'var(--accent-danger)', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: 'rgba(0,206,201,0.1)', border: '1px solid rgba(0,206,201,0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '24px', color: '#00cec9', fontSize: '0.9rem' }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer Details */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">👤 Customer Details</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Age</label>
              <input type="number" name="customer_age" className="form-input" value={form.customer_age} onChange={handleChange} min="18" max="80" required placeholder="e.g. 35" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select name="customer_gender" className="form-select" value={form.customer_gender} onChange={handleChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Past Claims Count</label>
              <input type="number" name="num_past_claims" className="form-input" value={form.num_past_claims} onChange={handleChange} min="0" required />
            </div>
          </div>
        </div>

        {/* Policy Details */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">📋 Policy Details</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Policy Type</label>
              <select name="policy_type" className="form-select" value={form.policy_type} onChange={handleChange}>
                {POLICY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Coverage Amount (₹)</label>
              <input type="number" name="coverage_amount" className="form-input" value={form.coverage_amount} onChange={handleChange} min="0" required placeholder="e.g. 500000" />
            </div>
            <div className="form-group">
              <label className="form-label">Policy Start Date</label>
              <input type="date" name="policy_start_date" className="form-input" value={form.policy_start_date} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Policy End Date</label>
              <input type="date" name="policy_end_date" className="form-input" value={form.policy_end_date} onChange={handleChange} required />
            </div>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">🚗 Vehicle Details</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Vehicle Make</label>
              <select name="vehicle_make" className="form-select" value={form.vehicle_make} onChange={handleChange}>
                {Object.keys(VEHICLE_CATALOG).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Vehicle Model</label>
              <select name="vehicle_model" className="form-select" value={form.vehicle_model} onChange={handleChange}>
                {vehicleModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Manufacture Year</label>
              <input type="number" name="vehicle_manufacture_year" className="form-input" value={form.vehicle_manufacture_year} onChange={handleChange} min="2005" max="2026" required />
            </div>
            <div className="form-group">
              <label className="form-label">IDV — Insured Declared Value (₹)</label>
              <input type="number" name="insured_declared_value" className="form-input" value={form.insured_declared_value} onChange={handleChange} min="0" required placeholder="e.g. 450000" />
            </div>
          </div>
        </div>

        {/* Claim Details */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header">
            <div className="card-title">📑 Claim Details</div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Damage Type</label>
              <select name="damage_type" className="form-select" value={form.damage_type} onChange={handleChange}>
                {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Damage Severity</label>
              <select name="damage_severity" className="form-select" value={form.damage_severity} onChange={handleChange}>
                {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Claim Amount Requested (₹)</label>
              <input type="number" name="claim_amount_requested" className="form-input" value={form.claim_amount_requested} onChange={handleChange} min="0" required placeholder="e.g. 25000" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => setForm({
            customer_age: '', customer_gender: 'Male', customer_region: 'North', num_past_claims: '0',
            policy_type: 'Comprehensive', coverage_amount: '', policy_start_date: '', policy_end_date: '',
            vehicle_make: 'Maruti Suzuki', vehicle_model: 'Swift', vehicle_manufacture_year: '2020',
            insured_declared_value: '', damage_type: 'Bumper Damage', damage_severity: 'Minor', claim_amount_requested: '',
          })}>
            Reset
          </button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? '⏳ Processing...' : (user?.role === 'user' ? 'Submit Claim' : '🔍 Analyze Claim')}
          </button>
        </div>
      </form>
    </div>
  );
}
