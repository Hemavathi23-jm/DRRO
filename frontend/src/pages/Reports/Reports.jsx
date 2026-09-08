// src/pages/Reports/Reports.jsx
import PageWrapper from '../../components/layout/PageWrapper';
import ResourceUtilizationChart from '../../components/charts/ResourceUtilizationChart';
import RequestFulfillmentChart from '../../components/charts/RequestFulfillmentChart';
import AllocationTimeline from '../../components/charts/AllocationTimeline';
import { useNavigate } from 'react-router-dom';

const METRICS = [
  { label:'Total Requests',          value:42  },
  { label:'Fulfilled',               value:17  },
  { label:'Partially Fulfilled',     value:12  },
  { label:'Unmet',                   value:13  },
  { label:'Avg Priority Score',      value:'76.4' },
  { label:'Avg Fulfillment Time (h)',value:'3.2'  },
  { label:'Total Dispatches',        value:28  },
  { label:'Failed Dispatches',       value:2   },
];

const UNMET = [
  { location:'Wayanad North',   resource:'Rice',          unmetQty:200 },
  { location:'Kodagu Valley',   resource:'Life Jacket',   unmetQty:20  },
  { location:'Munnar Heights',  resource:'Tarpaulin',     unmetQty:100 },
];

export default function Reports() {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <div className="flex-between page-header">
        <div><h2 className="page-title">Reports & Analytics</h2><p className="page-sub">Operational summary and metrics</p></div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary" onClick={()=>navigate('/reports/comparison')}>Algorithm Comparison</button>
          <button className="btn btn-primary">Export PDF</button>
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))',gap:12,marginBottom:20}}>
        {METRICS.map(m=>(
          <div className="kpi-card" key={m.label}>
            <span className="kpi-label">{m.label}</span>
            <span className="kpi-value">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{marginBottom:16}}>
        <ResourceUtilizationChart />
        <RequestFulfillmentChart />
      </div>
      <div style={{marginBottom:16}}><AllocationTimeline /></div>

      {/* Unmet Demand */}
      <div className="card">
        <p className="card-title" style={{marginBottom:12}}>Unmet Demand by Location</p>
        {UNMET.map(u=>(
          <div key={u.location} style={{marginBottom:14}}>
            <div className="flex-between" style={{marginBottom:4}}>
              <span style={{fontWeight:600,fontSize:'0.875rem'}}>{u.location} — {u.resource}</span>
              <span style={{color:'var(--danger)',fontWeight:700}}>{u.unmetQty} units unmet</span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill progress-bar-fill--danger" style={{ width: `${Math.min(u.unmetQty/3,100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
