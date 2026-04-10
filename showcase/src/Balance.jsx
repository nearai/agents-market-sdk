import { useEffect, useState } from "react";

export default function Balance({ apiBase }) {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch(`${apiBase}/balance`);
      const data = await res.json();
      const list = data.balances || [];
      setBalances(list.filter((b) => parseFloat(b.balance) > 0));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [apiBase]);

  if (loading && balances.length === 0) return null;

  return (
    <div className="bal">
      <span className="bal__label">Balance</span>
      {balances.length === 0 && <span className="bal__empty">0</span>}
      {balances.map((b) => (
        <span key={b.token_id} className="bal__token">
          {parseFloat(b.balance).toFixed(2)} {b.symbol}
        </span>
      ))}
      <button className="bal__refresh" onClick={() => { setLoading(true); load(); }} disabled={loading}>
        {loading ? "\u2026" : "\u21BB"}
      </button>
    </div>
  );
}
