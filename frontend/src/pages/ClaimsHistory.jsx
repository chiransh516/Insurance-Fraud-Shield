import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getClaims, reviewClaim, deleteClaim } from '../services/api';
import { StatusBadge, RiskBadge, LoadingSpinner } from '../components/Navbar';
import { Trash2 } from 'lucide-react';

export default function ClaimsHistory() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', damage_type: '', is_fraud: '' });

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 15, ...filters };
      // Remove empty filters
      Object.keys(params).forEach(k => { if (params[k] === '') delete params[k]; });
      const res = await getClaims(params);
      setClaims(res.data.claims || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleReview = async (id, status, e) => {
    e.stopPropagation(); // Prevent row click navigation
    try {
      await reviewClaim(id, status);
      fetchClaims(); // Refresh the list
    } catch (err) {
      console.error('Error updating claim status:', err);
      alert('Failed to update claim status');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{user?.role === 'admin' ? 'Claim Management' : 'Claims History'}</h1>
        <p>View and filter all submitted claims</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select name="status" className="form-select" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processed">Processed</option>
          <option value="flagged">Flagged</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select name="damage_type" className="form-select" value={filters.damage_type} onChange={handleFilterChange}>
          <option value="">All Damage Types</option>
          <option value="Bumper Damage">Bumper Damage</option>
          <option value="Windshield Damage">Windshield Damage</option>
          <option value="Engine Damage">Engine Damage</option>
          <option value="Airbag Deployment">Airbag Deployment</option>
          <option value="Total Loss">Total Loss</option>
          <option value="Scratch-Dent">Scratch-Dent</option>
          <option value="Electrical Damage">Electrical Damage</option>
        </select>

        <select name="is_fraud" className="form-select" value={filters.is_fraud} onChange={handleFilterChange}>
          <option value="">All Claims</option>
          <option value="true">Fraud Only</option>
          <option value="false">Genuine Only</option>
        </select>

        <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ status: '', damage_type: '', is_fraud: '' }); setPage(1); }}>
          Clear Filters
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <>
          <div className="card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Damage Type</th>
                    <th>Severity</th>
                    <th>Requested (₹)</th>
                    {user?.role === 'admin' && <th>Estimated (₹)</th>}
                    {user?.role === 'admin' && <th>Fraud Prob</th>}
                    {user?.role === 'admin' && <th>Risk</th>}
                    <th>Status</th>
                    <th>Submitted</th>
                    {user?.role === 'admin' && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                        No claims found
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim, index) => (
                      <tr key={claim.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/claims/${claim.id}`)}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>#{(page - 1) * 15 + index + 1}</td>
                        <td>{claim.damage_type}</td>
                        <td>{claim.damage_severity}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {claim.claim_amount_requested?.toLocaleString()}
                        </td>
                        {user?.role === 'admin' && (
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-success)' }}>
                            {claim.estimated_amount ? claim.estimated_amount.toLocaleString() : '—'}
                          </td>
                        )}
                        {user?.role === 'admin' && (
                          <td>
                            <span style={{
                              fontFamily: 'var(--font-mono)',
                              color: claim.fraud_probability > 0.5 ? 'var(--accent-danger)' : 'var(--accent-success)',
                              fontWeight: 600,
                            }}>
                              {claim.fraud_probability != null ? `${(claim.fraud_probability * 100).toFixed(1)}%` : '—'}
                            </span>
                          </td>
                        )}
                        {user?.role === 'admin' && <td><RiskBadge level={claim.risk_level} /></td>}
                        <td><StatusBadge status={claim.status} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : '—'}
                        </td>
                        {user?.role === 'admin' && (
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                              {claim.status !== 'approved' && claim.status !== 'rejected' && (
                                <>
                                  <button className="btn btn-success btn-sm" style={{ padding: '4px 8px', height: '28px' }} onClick={(e) => handleReview(claim.id, 'approved', e)}>Approve</button>
                                  <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px', height: '28px' }} onClick={(e) => handleReview(claim.id, 'rejected', e)}>Reject</button>
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button key={pageNum} className={page === pageNum ? 'active' : ''} onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 7 && <span style={{ color: 'var(--text-muted)' }}>...</span>}
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
