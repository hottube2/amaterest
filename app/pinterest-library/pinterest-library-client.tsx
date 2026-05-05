"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import type { LibraryPin, ProductWithScore } from "@/lib/pinterest-library";

type LibraryPayload = {
  ok: boolean;
  products: ProductWithScore[];
  pins: LibraryPin[];
  config: {
    targetDays: number;
    pinsPerDay: number;
    boardId: string;
  };
};

export default function PinterestLibraryClient({ initialData }: { initialData: Omit<LibraryPayload, "ok"> }) {
  const [data, setData] = useState<LibraryPayload>({ ok: true, ...initialData });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [category, setCategory] = useState("all");
  const [angle, setAngle] = useState("all");
  const [minScore, setMinScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const filteredPins = useMemo(
    () =>
      data.pins.filter((pin) => {
        if (category !== "all" && !pin.tags.includes(category)) {
          return false;
        }

        if (angle !== "all" && pin.contentAngle !== angle) {
          return false;
        }

        return pin.overallScore >= minScore;
      }),
    [angle, category, data.pins, minScore]
  );

  async function refresh() {
    const response = await fetch(`/api/pinterest/library/list?category=${category}&angle=${angle}&minScore=${minScore}`);
    const nextData = (await response.json()) as LibraryPayload;
    setData(nextData);
  }

  function toggleSelection(pinId: string) {
    setSelectedIds((current) => (current.includes(pinId) ? current.filter((id) => id !== pinId) : [...current, pinId]));
  }

  async function sendToScheduler() {
    setBusy("schedule");
    setMessage(null);
    try {
      const response = await fetch("/api/pinterest/library/send-to-scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinIds: selectedIds })
      });
      const payload = (await response.json()) as { ok: boolean; message?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to send pins to scheduler.");
      }
      setMessage(payload.message || "Pins envoyées au scheduler.");
      setSelectedIds([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur inconnue.");
    } finally {
      setBusy(null);
    }
  }

  async function markWinner(pinId: string, winningPin: boolean) {
    setBusy(pinId);
    setMessage(null);

    try {
      const response = await fetch("/api/pinterest/library/performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId, winningPin })
      });

      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to update performance.");
      }

      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur de suivi performance.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="page-shell demo-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>Amaterest</span>
        </div>
        <nav className="nav" aria-label="Navigation">
          <Link href="/">Accueil</Link>
          <Link href="/pinterest-launch">Pinterest Launch</Link>
          <Link href="/pinterest-schedule">Pinterest Schedule</Link>
        </nav>
      </header>

      <section className="demo-hero">
        <div>
          <p className="eyebrow">Pinterest Library</p>
          <h1 className="demo-title">Content engine (20 produits / 60+ pins)</h1>
          <p className="lede">Inventaire contenu + scoring + winners, relié au scheduler existant en mode safe.</p>
          <div className="actions">
            <button className="button primary" type="button" onClick={sendToScheduler} disabled={busy !== null || selectedIds.length === 0}>
              {busy === "schedule" ? "Sending..." : `Send selected to scheduler (${selectedIds.length})`}
            </button>
            <a className="button secondary" href="/api/pinterest/library/export?format=json">Export JSON</a>
            <a className="button secondary" href="/api/pinterest/library/export?format=csv">Export CSV</a>
          </div>
          {message ? <p className="subtle">{message}</p> : null}
        </div>

        <article className="panel dashboard-card demo-steps-card">
          <h2>Résumé</h2>
          <div className="launch-summary-grid">
            <div className="summary-metric"><strong>{data.products.length}</strong><span>Produits premium</span></div>
            <div className="summary-metric"><strong>{data.pins.length}</strong><span>Pins disponibles</span></div>
            <div className="summary-metric"><strong>{data.pins.filter((pin) => pin.performance.winningPin).length}</strong><span>Winners</span></div>
            <div className="summary-metric"><strong>{data.config.targetDays}</strong><span>Jours cible</span></div>
          </div>
        </article>
      </section>

      <section className="panel dashboard-card" style={{ marginBottom: 16 }}>
        <div className="actions" style={{ marginTop: 0 }}>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Toutes catégories</option>
            <option value="pantry">pantry</option>
            <option value="under_sink">under_sink</option>
            <option value="entryway">entryway</option>
            <option value="closet">closet</option>
            <option value="vanity_bathroom">vanity / bathroom</option>
            <option value="beauty_high_ticket">beauty high-ticket</option>
          </select>
          <select value={angle} onChange={(event) => setAngle(event.target.value)}>
            <option value="all">Tous angles</option>
            <option value="before_after">avant / après</option>
            <option value="problem_solution">problème / solution</option>
            <option value="aesthetic_result">esthétique / résultat</option>
            <option value="winner_variant">winner variant</option>
          </select>
          <label>
            Score min {minScore}
            <input type="range" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} />
          </label>
          <button className="button secondary" type="button" onClick={() => void refresh()} disabled={busy !== null}>Refresh</button>
          <button className="button secondary" type="button" onClick={() => setSelectedIds(filteredPins.slice(0, 21).map((pin) => pin.pinId))}>Select top 21</button>
        </div>
      </section>

      <section className="schedule-grid">
        {filteredPins.map((pin) => (
          <article key={pin.pinId} className="panel schedule-card">
            <div className="schedule-card-media">
              <Image src={pin.imageUrl} alt={pin.pinTitle} width={480} height={720} />
            </div>
            <div className="schedule-card-body">
              <div className="schedule-card-top">
                <h2>{pin.pinTitle}</h2>
                <span className={`status-pill ${pin.priorityTier === "A" ? "status-pill-ok" : pin.priorityTier === "B" ? "status-pill-warn" : "status-pill-muted"}`}>{pin.priorityTier} · {pin.overallScore}/100</span>
              </div>
              <p className="subtle">{pin.pinDescription}</p>
              <div className="launch-badge-row">
                <span className="status-pill status-pill-muted">{pin.contentAngle}</span>
                <span className="status-pill status-pill-muted">priority {pin.publishPriority}</span>
                <span className={`status-pill ${pin.performance.winningPin ? "status-pill-ok" : "status-pill-muted"}`}>{pin.performance.winningPin ? "winner" : "tracking"}</span>
              </div>
              <div className="actions">
                <button className="button secondary" type="button" onClick={() => toggleSelection(pin.pinId)}>
                  {selectedIds.includes(pin.pinId) ? "Unselect" : "Select"}
                </button>
                <button className="button secondary" type="button" onClick={() => void markWinner(pin.pinId, !pin.performance.winningPin)} disabled={busy === pin.pinId}>
                  {pin.performance.winningPin ? "Unmark winner" : "Mark winner"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
