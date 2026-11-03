import { useState, useEffect } from 'react';
import { getDashboardSummary, getRiskDistribution } from '../services/api';
import { LoadingSpinner } from '../components/Navbar';
import { Activity, ShieldAlert, FileText, Gauge, Clock, CheckCircle2, XCircle, Flag, ShieldCheck, Coins } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

// Dummy data for sparklines
const dataBlue = [{ v: 10 }, { v: 15 }, { v: 13 }, { v: 20 }, { v: 18 }, { v: 25 }, { v: 22 }, { v: 30 }];
const dataRed = [{ v: 5 }, { v: 3 }, { v: 6 }, { v: 4 }, { v: 8 }, { v: 6 }, { v: 10 }, { v: 9 }];
const dataOrange = [{ v: 30 }, { v: 35 }, { v: 32 }, { v: 40 }, { v: 38 }, { v: 42 }, { v: 35 }, { v: 38 }];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, riskRes] = await Promise.all([
          getDashboardSummary(),
          getRiskDistribution(),
        ]);
        setSummary(summaryRes.data);
        setRiskDist(riskRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  const totalClaims = summary?.total_claims || 0;
  const fraudCount = summary?.fraud_count || 0;
  const fraudRate = summary?.fraud_rate || 0;
  const avgRisk = Math.round(summary?.avg_risk_score || 0);

  const statusMap = {
    processed: { label: 'Processed', icon: Clock, color: '#3b82f6', bg: '#eff6ff' },
    approved: { label: 'Approved', icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
    rejected: { label: 'Rejected', icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
    flagged: { label: 'Flagged', icon: Flag, color: '#f59e0b', bg: '#fffbeb' },
  };

  const riskColors = {
    High: { color: '#ef4444', icon: '#fee2e2' },
    Low: { color: '#10b981', icon: '#d1fae5' },
    Medium: { color: '#f59e0b', icon: '#fef3c7' }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Welcome Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '64px', height: '64px', background: '#eff6ff', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.1)' }}>
            <Activity size={32} color="#4318ff" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px', letterSpacing: '-0.02em' }}>Fraud Shield Analytics</h1>
            <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Overview of recent claims and model performance.</p>
          </div>
        </div>
        <a href="/claim-entry" style={{ background: '#4318ff', color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px rgba(67, 24, 255, 0.25)', border: 'none', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.2s' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>+</div>
          New Claim Entry
        </a>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>

        {/* Total Claims Card */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#4318ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(67, 24, 255, 0.2)' }}>
              <FileText color="white" size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Claims</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#4318ff', lineHeight: 1 }}>{totalClaims.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px', fontWeight: 500 }}>All time</div>
            </div>
          </div>
          <div style={{ width: '120px', height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataBlue}>
                <Line type="monotone" dataKey="v" stroke="#4318ff" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fraud Detected Card */}
        <div style={{ background: '#fff1f2', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #ffe4e6' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}>
              <ShieldAlert color="white" size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fraud Detected</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{fraudCount.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{fraudRate.toFixed(2)}% fraud rate</div>
            </div>
          </div>
          <div style={{ width: '120px', height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataRed}>
                <Line type="monotone" dataKey="v" stroke="#ef4444" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avg Risk Score Card */}
        <div style={{ background: '#fffbeb', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #fef3c7' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '56px', height: '56px', background: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)' }}>
              <Gauge color="white" size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Risk Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>{avgRisk}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>Across all claims</div>
            </div>
          </div>
          <div style={{ width: '120px', height: '60px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataOrange}>
                <Line type="monotone" dataKey="v" stroke="#f59e0b" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Main Content Areas */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Risk Distribution */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Risk Distribution</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>Claims by risk level</p>

            {riskDist && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                {['High', 'Low', 'Medium'].map((level) => {
                  const count = riskDist.distribution?.[level] || 0;
                  const total = riskDist.total || 1;
                  const pct = ((count / total) * 100).toFixed(1);
                  const colors = riskColors[level];

                  return (
                    <div key={level} style={{ background: 'white', border: `1px solid ${colors.icon}`, borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: colors.icon, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                        <Activity size={20} color={colors.color} />
                      </div>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: colors.color, lineHeight: 1 }}>{count}</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginTop: '8px' }}>{level} Risk</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.color, marginTop: '4px' }}>{pct}%</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'relative', zIndex: 2, width: '60%' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Financial Summary</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>Claims amount overview</p>

              {summary && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f1f5f9', borderRadius: '12px', padding: '1px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: '#f8fafc', borderRadius: '11px 11px 0 0' }}>
                    <span style={{ color: '#475569', fontWeight: 500, fontSize: '0.95rem' }}>Total Requested</span>
                    <span style={{ fontWeight: 800, color: '#1e293b' }}>
                      ₹{(summary.total_requested_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 20px', background: 'white', borderRadius: '0 0 11px 11px' }}>
                    <span style={{ color: '#475569', fontWeight: 500, fontSize: '0.95rem' }}>Total Estimated Settlement</span>
                    <span style={{ fontWeight: 800, color: '#10b981' }}>
                      ₹{(summary.total_estimated_amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Illustration on Right */}
            <div style={{ position: 'absolute', right: '40px', bottom: '20px', zIndex: 1 }}>
              <div style={{ position: 'relative', width: '120px', height: '140px' }}>
                <div style={{ position: 'absolute', width: '100px', height: '120px', background: '#e0e7ff', borderRadius: '12px', right: '10px', bottom: '10px' }}></div>
                <div style={{ position: 'absolute', width: '90px', height: '110px', background: 'white', borderRadius: '8px', right: '15px', bottom: '15px', border: '2px solid #cbd5e1' }}>
                  <div style={{ width: '40px', height: '6px', background: '#cbd5e1', borderRadius: '3px', position: 'absolute', top: '20px', left: '10px' }}></div>
                  <div style={{ width: '60px', height: '6px', background: '#cbd5e1', borderRadius: '3px', position: 'absolute', top: '35px', left: '10px' }}></div>
                  <div style={{ width: '50px', height: '6px', background: '#cbd5e1', borderRadius: '3px', position: 'absolute', top: '50px', left: '10px' }}></div>
                </div>
                <div style={{ position: 'absolute', width: '50px', height: '20px', background: '#cbd5e1', borderRadius: '4px', top: '0px', right: '35px' }}></div>
                <div style={{ position: 'absolute', right: '-10px', bottom: '10px' }}>
                  <div style={{ background: '#4318ff', borderRadius: '12px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    <ShieldCheck size={28} color="white" />
                  </div>
                </div>
                <div style={{ position: 'absolute', left: '10px', bottom: '0px' }}>
                  <Coins size={36} color="#f59e0b" fill="#fbbf24" strokeWidth={1} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Claim Status */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Claim Status</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>Current pipeline</p>

          {summary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['processed', 'approved', 'rejected', 'flagged'].map((status) => {
                const config = statusMap[status];
                const Icon = config.icon;
                const count = summary.status_breakdown?.[status] || 0;

                return (
                  <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} color={config.color} />
                      </div>
                      <span style={{ fontWeight: 600, color: '#1e293b' }}>{config.label}</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: config.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
        © 2026 Insurance Fraud Shield. All rights reserved.
      </div>
    </div>
  );
}
