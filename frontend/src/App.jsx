import { useCallback, useEffect, useMemo, useState } from 'react';
import { buyTicket, getStatus } from './api.js';

function TicketMark() {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className="h-10 w-10">
      <rect x="5" y="8" width="30" height="24" rx="7" fill="#10b981" fillOpacity=".16" stroke="#34d399" strokeWidth="1.5" />
      <path d="M14 8v24M26 8v24" stroke="#34d399" strokeDasharray="2.5 3" strokeWidth="1.5" />
      <path d="M18 17.5h4m-4 5h4" stroke="#a7f3d0" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M12 3a9 9 0 0 1 9 9h-3a6 6 0 0 0-6-6V3Z" />
    </svg>
  );
}

function App() {
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isBuying, setIsBuying] = useState(false);
  const [result, setResult] = useState(null);

  const refreshStatus = useCallback(async () => {
    try {
      const latest = await getStatus();
      setStatus(latest);
      setStatusError('');
      setLastUpdated(new Date());
    } catch {
      setStatusError('Unable to reach the seller API. Retrying automatically…');
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const timer = window.setInterval(refreshStatus, 2000);
    return () => window.clearInterval(timer);
  }, [refreshStatus]);

  const ticketCount = status?.ticket_count ?? 0;
  const sold = status?.sold ?? 0;
  const remaining = Math.max(0, ticketCount - sold);
  const progress = ticketCount > 0 ? Math.min(100, (sold / ticketCount) * 100) : 0;
  const saleIsActive = ticketCount > 0;
  const isSoldOut = saleIsActive && remaining === 0;

  const syncLabel = useMemo(() => {
    if (!lastUpdated) return 'Waiting for first sync';
    return `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }, [lastUpdated]);

  async function handleBuy() {
    setIsBuying(true);
    setResult(null);
    try {
      const response = await buyTicket({
        userId: `user-${window.crypto.randomUUID()}`,
        requestId: window.crypto.randomUUID(),
      });
      if (response.soldOut) {
        setResult({ type: 'sold-out' });
      } else {
        setResult({ type: 'success', ticketNumber: response.ticket_number });
      }
      await refreshStatus();
    } catch (error) {
      const message = error.response?.data?.error || 'The purchase could not be completed. Please try again.';
      setResult({ type: 'error', message });
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 text-slate-100 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <TicketMark />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Ticket Stampede</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">TixStampede: War Room</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 sm:self-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full rounded-full ${statusError ? 'bg-rose-400' : 'animate-ping bg-emerald-400 opacity-50'}`} />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusError ? 'bg-rose-400' : 'bg-emerald-400'}`} />
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-300">
              {statusError ? 'Connection issue' : 'Live monitoring'}
            </span>
          </div>
        </header>

        <section className="grid gap-6 py-8 lg:grid-cols-[1.35fr_0.85fr] lg:py-12" aria-label="Ticket sale dashboard">
          <article className="rounded-3xl border border-white/[0.09] bg-slate-900/70 p-6 shadow-2xl shadow-black/20 sm:p-9">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Live inventory</p>
                <h2 className="mt-3 text-xl font-medium text-white">Tickets Remaining</h2>
              </div>
              <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                {saleIsActive ? (isSoldOut ? 'SALE COMPLETE' : 'ON SALE') : 'AWAITING SALE'}
              </div>
            </div>

            <div className="mt-8 flex items-baseline gap-3">
              <span className="font-mono text-6xl font-semibold tracking-[-0.06em] text-white sm:text-7xl">
                {status ? remaining.toLocaleString() : '—'}
              </span>
              <span className="text-lg text-slate-500">/ {ticketCount.toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Tickets available to claim</p>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Sale progress</span>
                <span>{Math.round(progress)}% sold</span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-slate-800 ring-1 ring-inset ring-white/[0.04]"
                role="progressbar"
                aria-label="Tickets sold"
                aria-valuemin="0"
                aria-valuemax={ticketCount}
                aria-valuenow={sold}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-[width] duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/[0.06] bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Tickets sold</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-slate-100">{sold.toLocaleString()}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-500">Inventory</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-slate-100">{ticketCount.toLocaleString()}</p>
              </div>
            </div>
          </article>

          <aside className="flex flex-col rounded-3xl border border-white/[0.09] bg-slate-900/70 p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Buyer console</p>
              <h2 className="mt-3 text-xl font-medium text-white">Make a claim</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Submit one purchase request. A unique request ID is generated for this attempt.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBuy}
              disabled={isBuying || !saleIsActive || isSoldOut}
              className="mt-8 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-bold text-slate-950 shadow-glow transition duration-200 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {isBuying ? <><Spinner /> Processing purchase…</> : isSoldOut ? 'Sale sold out' : 'Buy Ticket'}
            </button>

            <div className="mt-5 min-h-[92px]" aria-live="polite" aria-atomic="true">
              {result?.type === 'success' && (
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                  <p className="font-semibold">🎉 You got Ticket #{result.ticketNumber}!</p>
                  <p className="mt-1 text-xs text-emerald-100/65">Your claim was confirmed by the seller.</p>
                </div>
              )}
              {result?.type === 'sold-out' && (
                <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
                  <p className="font-semibold">Sorry, sold out.</p>
                  <p className="mt-1 text-xs text-rose-100/65">There are no tickets left to claim.</p>
                </div>
              )}
              {result?.type === 'error' && (
                <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-200">
                  <p className="font-semibold">Purchase unavailable</p>
                  <p className="mt-1 text-xs text-amber-100/70">{result.message}</p>
                </div>
              )}
              {!result && (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs leading-5 text-slate-500">
                  Purchase confirmation will appear here. Inventory refreshes every two seconds.
                </div>
              )}
            </div>

            <div className="mt-auto flex items-center justify-between border-t border-white/[0.07] pt-5 text-xs text-slate-500">
              <span>{statusError || syncLabel}</span>
              <button type="button" onClick={refreshStatus} className="font-medium text-slate-300 transition hover:text-emerald-300 focus:outline-none focus:underline">
                Refresh
              </button>
            </div>
          </aside>
        </section>

        <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.08] pt-5 text-xs text-slate-600 sm:flex-row">
          <span>Ticket Stampede · Sales operations</span>
          <span>Live status polling · 2 second interval</span>
        </footer>
      </div>
    </main>
  );
}

export default App;
