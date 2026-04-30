import { useRef, useState } from 'react';
import { MarketPanel } from '@agents-market/market-react';
import '@agents-market/market-react/styles.css';
import WholesaleForm from './WholesaleForm.jsx';
import ApplicantReviewCard from './ApplicantReviewCard.jsx';
import { buildPrompt } from './buildPrompt.js';
import JobsList from './JobsList.jsx';
import Balance from './Balance.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api/market';
const SERVICE_ID = import.meta.env.VITE_SERVICE_ID;
const BUDGET_TOKEN = import.meta.env.VITE_BUDGET_TOKEN || 'USD';
const BUDGET_AMOUNT = import.meta.env.VITE_BUDGET_AMOUNT || '1.0';

export default function App() {
  const panelRef = useRef(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubmit = async (formData) => {
    try {
      const { title, description } = buildPrompt(formData);
      await panelRef.current?.submit({
        serviceId: SERVICE_ID,
        title,
        description,
        budget: { amount: BUDGET_AMOUNT, token: BUDGET_TOKEN },
        isPrivate: true,
      });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectJob = (job) => {
    panelRef.current?.loadJob(job.jobId);
  };

  return (
    <div className="page">
      <div className="page__form">
        <Balance apiBase={API_BASE} />
        <WholesaleForm onSubmit={handleSubmit} />
      </div>
      <div className="page__side">
        <div className="page__widget">
          <MarketPanel
            ref={panelRef}
            apiBase={API_BASE}
            title="AI Customer Intelligence"
            icon="🤖"
            acceptLabel="Accept"
            renderResult={(result) => <ApplicantReviewCard data={result} />}
          />
        </div>
        <JobsList apiBase={API_BASE} onSelect={handleSelectJob} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
