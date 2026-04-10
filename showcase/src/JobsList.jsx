import { useEffect, useState } from "react";

export default function JobsList({ apiBase, onSelect, refreshKey }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/jobs`);
      setJobs(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [apiBase, refreshKey]);

  return (
    <div className="jl">
      <div className="jl__header">
        <h2 className="jl__title">Jobs</h2>
        <button className="jl__refresh" onClick={load} disabled={loading}>
          {loading ? "\u2026" : "\u21BB"}
        </button>
      </div>
      {jobs.length === 0 && <div className="jl__empty">No jobs yet. Submit the form to create one.</div>}
      <ul className="jl__list">
        {jobs.map((j) => {
          const name = j.title || j.jobId?.slice(0, 8) || "\u2014";
          return (
            <li key={j.jobId} className="jl__item" onClick={() => onSelect?.(j)}>
              <div className="jl__row">
                <span className="jl__name">{name}</span>
                <span className={`jl__status jl__status--${j.status}`}>{j.status}</span>
              </div>
              <div className="jl__sub">{j.headline || j.jobId?.slice(0, 8)}</div>
              <div className="jl__time">{new Date(j.createdAt).toLocaleString()}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
