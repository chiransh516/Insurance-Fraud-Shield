import { useState, useEffect } from 'react';
import { getFraudTrends, getDashboardSummary } from '../services/api';
import { LoadingSpinner } from '../components/Navbar';
import { Calendar, FileText, ShieldAlert, Gauge, CheckCircle2, TrendingUp, Wrench, AlertTriangle, ClipboardList, Activity } from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 700, marginBottom: '6px', color: '#1e293b' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: '2px 0', fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

export default function FraudTrends() {
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, summaryRes] = await Promise.all([
          getFraudTrends(),
          getDashboardSummary()
        ]);
        setData(trendsRes.data);
        setSummary(summaryRes.data);
      } catch (err) {
        console.error('Error fetching fraud trends:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner message="Loading fraud trends..." />;

  if (!data) return (
    <div style={{ textAlign: 'center', padding: '60px' }}>
      <Activity size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
      <h2 style={{ color: '#1e293b' }}>No Data Available</h2>
      <p style={{ color: '#64748b' }}>Submit some claims first to see fraud trends.</p>
    </div>
  );

  // Format data
  const monthlyData = (data.by_month || []).map(d => ({
    ...d,
    label: `${d.year}-${String(d.month).padStart(2, '0')}`,
    genuine_count: d.total - (d.fraud_count || 0)
  }));

  const damageData = (data.by_damage_type || []).map(d => ({
    ...d,
    genuine_count: d.total - (d.fraud_count || 0)
  }));

  const severityData = (data.by_severity || []).map(d => ({
    ...d,
    genuine_count: d.total - (d.fraud_count || 0)
  }));

  const policyData = data.by_policy_type || [];

  // Summary Metrics
  const totalClaims = summary?.total_claims || 0;
  const fraudCount = summary?.fraud_count || 0;
  const fraudRate = summary?.fraud_rate || 0;
  const avgRisk = Math.round(summary?.avg_risk_score || 0);
  
  // Calculate approval rate safely
  const genuineTotal = totalClaims - fraudCount;
  const approvedTotal = summary?.status_breakdown?.approved || 0;
  const approvalRate = genuineTotal > 0 ? Math.round((approvedTotal / genuineTotal) * 100) : 0;

  const cardStyle = {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  };

  const iconStyle = {
    color: '#6366f1',
  };

  const titleStyle = {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#1e293b',
    margin: 0
  };

  const subtitleStyle = {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
    marginTop: '2px'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px', letterSpacing: '-0.02em' }}>Fraud Trends Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: 500 }}>Comprehensive fraud analytics across all dimensions</p>
        </div>
        
        {/* Date Picker Mock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#334155', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 2px 5px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
          <Calendar size={18} color="#6366f1" />
          <span>Jul 2026 - Aug 2026</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '8px' }}>▼</span>
        </div>
      </div>

      {/* Monthly Trends - Full Width */}
      <div style={cardStyle}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#e0e7ff', borderRadius: '8px' }}>
            <TrendingUp size={20} style={iconStyle} />
          </div>
          <div>
            <h3 style={titleStyle}>Fraud Trends Over Time</h3>
            <p style={subtitleStyle}>Monthly fraud count and total claims</p>
          </div>
        </div>
        
        <div style={{ height: '320px', width: '100%', marginTop: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGenuine" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              <Area type="monotone" dataKey="genuine_count" name="Genuine Claims" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorGenuine)" stackId="1" activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }} />
              <Area type="monotone" dataKey="fraud_count" name="Fraud Claims" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorFraud)" stackId="1" activeDot={{ r: 6, fill: '#ef4444', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2x2 Grid Layout for remaining charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* By Damage Type */}
          <div style={cardStyle}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#e0e7ff', borderRadius: '8px' }}>
                <Wrench size={20} style={iconStyle} />
              </div>
              <div>
                <h3 style={titleStyle}>Fraud by Damage Type</h3>
                <p style={subtitleStyle}>Fraud rate per damage category</p>
              </div>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={damageData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="damage_type" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="square" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="fraud_count" name="Fraud Claims" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  <Bar dataKey="genuine_count" name="Genuine Claims" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* By Policy Type */}
          <div style={cardStyle}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#ecfdf5', borderRadius: '8px' }}>
                <ClipboardList size={20} color="#10b981" />
              </div>
              <div>
                <h3 style={titleStyle}>Fraud by Policy Type</h3>
                <p style={subtitleStyle}>Fraud distribution across policy categories</p>
              </div>
            </div>
            <div style={{ height: '260px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={policyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="policy_type" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="square" wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="fraud_rate" name="Fraud Rate (%)" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* By Severity */}
          <div style={cardStyle}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#fffbeb', borderRadius: '8px' }}>
                <AlertTriangle size={20} color="#f59e0b" />
              </div>
              <div>
                <h3 style={titleStyle}>Fraud by Severity</h3>
                <p style={subtitleStyle}>Fraud rate across severity levels</p>
              </div>
            </div>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="severity" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="square" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="fraud_count" name="Fraud" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={50} />
                  <Bar dataKey="genuine_count" name="Genuine" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Insights Component */}
          <div style={cardStyle}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <Activity size={20} color="#1e293b" />
              </div>
              <div>
                <h3 style={titleStyle}>Key Insights</h3>
                <p style={subtitleStyle}>Overview of current metrics</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              
              {/* Total Claims */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color="#6366f1" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Total Claims</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>All claims in selected period</div>
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>{totalClaims}</div>
              </div>

              {/* Fraud Detected */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={20} color="#ef4444" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Fraud Detected</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Claims identified as fraudulent</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444', lineHeight: 1 }}>{fraudCount}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{fraudRate.toFixed(2)}%</div>
                </div>
              </div>

              {/* Average Risk Score */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Gauge size={20} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Average Risk Score</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Across all claims</div>
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>{avgRisk}</div>
              </div>

              {/* Approval Rate */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle2 size={20} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Approval Rate</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Approved genuine claims</div>
                  </div>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>{approvalRate}%</div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
