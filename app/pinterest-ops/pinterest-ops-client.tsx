"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type OpsPayload = {
  ok: boolean;
  counts: Record<string, number>;
  blockers: Array<{ pinId: string; productKey: string; reasons: string[] }>;
  qaResults: Array<{
    pinId: string;
    qaPassed: boolean;
    qaIssues: string[];
    monetizationReady: boolean;
    publishReady: boolean;
  }>;
  products: Array<{ productKey: string; amazonAffiliateUrl: string; affiliateStatus: string }>;
  today: {
    dueToday: Array<{ pinId: string }>;
    nextPublications: Array<{ pinId: string; scheduledAt?: string }>;
    errorPins: Array<{ pinId: string; status: string }>;
    recentWinners: Array<{ pinId: string }>;
    readyVariants: Array<{ pinId: string }>;
    remainingCoverageDays: number;
  };
  opsRows: Array<{
    pinId: string;
    performanceLabel: string;
    monetizationReady: boolean;
    publishReady: boolean;
  }>;
};

type PublishedPin = {
  internalPinId: string;
  pinterestPinId?: string;
  productKey: string;
  boardId: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
  imageAssetPath?: string;
  mediaSourceType?: "image_base64" | "image_url";
  imageFileExists?: boolean;
  imageFileSizeBytes?: number;
  publishedAt: string;
  publishMode: "canary" | "live";
  result: "success" | "error" | "blocked" | "preview";
  errorMessage?: string;
  tokenSource?: "oauth_session" | "env" | "missing";
  tokenHasWriteScopes?: boolean | "unknown";
  availableScopes?: string[];
  hasPinsWrite?: boolean | "unknown";
  hasBoardsWrite?: boolean | "unknown";
  liveBlockers?: string[];
  tokenNote?: string;
};

type CanaryPayload = {
  ok: true;
  publishEnabled: boolean;
  canaryBoardId?: string;
  publishReadyCount: number;
  livePublishLimit: number;
  published: PublishedPin[];
  lastCanary?: PublishedPin;
};

export default function PinterestOpsClient({
  initialData,
  initialCanary
}: {
  initialData: OpsPayload;
  initialCanary: CanaryPayload;
}) {
  const [data, setData] = useState(initialData);
  const [canary, setCanary] = useState(initialCanary);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [qaFilter, setQaFilter] = useState<"all" | "blocked" | "ready">("blocked");
  const [labelFilter, setLabelFilter] = useState<"all" | "low_performer" | "stable" | "winner">("all");
  const [bulkFormat, setBulkFormat] = useState<"auto" | "json" | "csv">("auto");
  const [bulkInput, setBulkInput] = useState("productKey,amazonAffiliateUrl\npantry_oxo_pop_5pc_01,https://amzn.to/example");

  const labelRows = useMemo(
    () => data.opsRows.filter((row) => (labelFilter === "all" ? true : row.performanceLabel === labelFilter)),
    [data.opsRows, labelFilter]
  );

  async function refreshSummary() {
    const summaryResponse = await fetch("/api/pinterest/ops/summary");
    const summary = (await summaryResponse.json()) as OpsPayload;
    setData(summary);
  }

  async function refreshCanary() {
    const response = await fetch("/api/pinterest/analytics/list");
    const payload = (await response.json()) as CanaryPayload;
    setCanary(payload);
  }

  async function call(path: string, method: "GET" | "POST" = "POST", body?: unknown) {
    setBusy(path);
    setMessage(null);

    try {
      const response = await fetch(path, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; report?: Record<string, number> };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Action impossible");
      }

      await refreshSummary();
      setMessage(payload.report ? `Import termine: ${JSON.stringify(payload.report)}` : "Action executee.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur ops");
    } finally {
      setBusy(null);
    }
  }

  async function updateLabel(pinId: string, performanceLabel: "low_performer" | "stable" | "winner") {
    await call("/api/pinterest/library/performance", "POST", {
      pinId,
      performanceLabel,
      winningPin: performanceLabel === "winner"
    });
  }

  async function runCanaryPublish() {
    setBusy("/api/pinterest/publish/canary");
    setMessage(null);

    try {
      const response = await fetch("/api/pinterest/publish/canary", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pinId: "lib-pantry_oxo_pop_5pc_01-before-after"
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; publication?: PublishedPin };
      await Promise.all([refreshSummary(), refreshCanary()]);

      if (!response.ok || !payload.publication) {
        throw new Error(payload.error || "Canary publish impossible");
      }

      if (payload.publication.result !== "success") {
        const tokenDetails = payload.publication.tokenSource
          ? ` tokenSource=${payload.publication.tokenSource}, hasPinsWrite=${String(payload.publication.hasPinsWrite)}, hasBoardsWrite=${String(payload.publication.hasBoardsWrite)}`
          : "";
        const mediaDetails = payload.publication.mediaSourceType
          ? ` mediaSourceType=${payload.publication.mediaSourceType}, imageFileExists=${String(
              payload.publication.imageFileExists
            )}, imageFileSizeBytes=${payload.publication.imageFileSizeBytes ?? 0}`
          : "";
        setMessage(`${payload.publication.errorMessage || payload.error || "Canary publish bloque."}${tokenDetails}${mediaDetails}`);
        return;
      }

      setMessage(
        `Canary published: ${payload.publication.pinterestPinId || payload.publication.internalPinId} tokenSource=${
          payload.publication.tokenSource || "unknown"
        } mediaSourceType=${payload.publication.mediaSourceType || "unknown"}`
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erreur canary");
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
          <Link href="/pinterest-library">Library</Link>
          <Link href="/pinterest-schedule">Scheduler</Link>
        </nav>
      </header>

      <section className="demo-hero">
        <div>
          <p className="eyebrow">Pinterest Ops Cockpit</p>
          <h1 className="demo-title">Batch operations + workflow quotidien</h1>
          <div className="actions">
            <button className="button primary" type="button" disabled={busy !== null} onClick={() => void call("/api/pinterest/ops/run-cycle")}>
              Run full ops cycle
            </button>
            <button className="button secondary" type="button" disabled={busy !== null} onClick={() => void call("/api/pinterest/ops/run-qa")}>
              Run QA
            </button>
            <button className="button secondary" type="button" disabled={busy !== null} onClick={() => void call("/api/pinterest/ops/fill-30-days")}>
              Fill next 30 days
            </button>
            <button className="button secondary" type="button" disabled={busy !== null} onClick={() => void call("/api/pinterest/ops/generate-winner-variants")}>
              Generate winner variants
            </button>
            <button
              className="button secondary"
              type="button"
              disabled={busy !== null}
              onClick={() => void call("/api/pinterest/ops/send-ready-to-scheduler")}
            >
              Send QA-passed pins
            </button>
            <a className="button secondary" href="/api/pinterest/ops/export?format=json">
              Export ops JSON
            </a>
            <a className="button secondary" href="/api/pinterest/ops/export?format=csv">
              Export ops CSV
            </a>
          </div>
          {message ? <p className="subtle">{message}</p> : null}
        </div>
        <article className="panel dashboard-card">
          <div className="launch-summary-grid">
            {Object.entries(data.counts).map(([key, value]) => (
              <div key={key} className="summary-metric">
                <strong>{value}</strong>
                <span>{key}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel dashboard-card" style={{ marginBottom: 16 }}>
        <h2>Plan d'execution quotidien</h2>
        <ol className="subtle" style={{ marginTop: 10, paddingLeft: 18 }}>
          <li>Importer/valider les URLs affiliees finales.</li>
          <li>Lancer QA et traiter les blockers critiques.</li>
          <li>Mettre a jour les labels performance.</li>
          <li>Generer les variantes winners.</li>
          <li>Envoyer les pins QA-pass au scheduler puis remplir 30 jours.</li>
          <li>Verifier la vue Today.</li>
          <li>Preparer un canary publish reel uniquement si scopes write OK.</li>
        </ol>
        <div className="actions" style={{ marginTop: 10 }}>
          <button className="button secondary" type="button" disabled={busy !== null} onClick={() => void call("/api/pinterest/ops/run-qa")}>
            1) Run QA
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={busy !== null}
            onClick={() => void call("/api/pinterest/ops/generate-winner-variants")}
          >
            2) Variants
          </button>
          <button
            className="button secondary"
            type="button"
            disabled={busy !== null}
            onClick={() => void call("/api/pinterest/ops/send-ready-to-scheduler")}
          >
            3) Send Ready
          </button>
          <button className="button secondary" type="button" disabled={busy !== null} onClick={() => void call("/api/pinterest/ops/fill-30-days")}>
            4) Fill 30d
          </button>
          <button className="button primary" type="button" disabled={busy !== null} onClick={() => void call("/api/pinterest/ops/run-cycle")}>
            Run Full Cycle
          </button>
        </div>
      </section>

      <section className="panel dashboard-card" style={{ marginBottom: 16 }}>
        <h2>Canary publish</h2>
        <div className="launch-summary-grid" style={{ marginTop: 10 }}>
          <div className="summary-metric">
            <strong>{canary.publishEnabled ? "ON" : "OFF"}</strong>
            <span>publish enabled</span>
          </div>
          <div className="summary-metric">
            <strong>{canary.livePublishLimit}</strong>
            <span>live limit</span>
          </div>
          <div className="summary-metric">
            <strong>{canary.publishReadyCount}</strong>
            <span>publishReady</span>
          </div>
          <div className="summary-metric">
            <strong>{canary.canaryBoardId || "missing"}</strong>
            <span>target board</span>
          </div>
        </div>
        <div className="actions" style={{ marginTop: 10 }}>
          <button className="button primary" type="button" disabled={busy !== null} onClick={() => void runCanaryPublish()}>
            Publish 1 canary pin
          </button>
        </div>
        {canary.lastCanary ? (
          <p className="subtle">
            Last canary: {canary.lastCanary.result} - {canary.lastCanary.pinterestPinId || canary.lastCanary.internalPinId}
            {canary.lastCanary.errorMessage ? ` - ${canary.lastCanary.errorMessage}` : ""}
            {canary.lastCanary.tokenSource ? ` - tokenSource=${canary.lastCanary.tokenSource}` : ""}
            {canary.lastCanary.mediaSourceType ? ` - mediaSourceType=${canary.lastCanary.mediaSourceType}` : ""}
            {typeof canary.lastCanary.imageFileExists === "boolean" ? ` - imageFileExists=${String(canary.lastCanary.imageFileExists)}` : ""}
            {typeof canary.lastCanary.imageFileSizeBytes === "number" ? ` - imageFileSizeBytes=${canary.lastCanary.imageFileSizeBytes}` : ""}
          </p>
        ) : (
          <p className="subtle">No canary attempt stored yet.</p>
        )}
      </section>

      <section className="panel dashboard-card" style={{ marginBottom: 16 }}>
        <h2>Bulk affiliate import</h2>
        <div className="actions" style={{ marginTop: 8 }}>
          <select value={bulkFormat} onChange={(event) => setBulkFormat(event.target.value as "auto" | "json" | "csv")}>
            <option value="auto">auto</option>
            <option value="json">json</option>
            <option value="csv">csv</option>
          </select>
          <button
            className="button secondary"
            type="button"
            disabled={busy !== null}
            onClick={() =>
              void call("/api/pinterest/monetization/affiliate-url/bulk", "POST", {
                format: bulkFormat,
                payload: bulkInput
              })
            }
          >
            Import bulk URLs
          </button>
        </div>
        <textarea
          className="field"
          style={{ width: "100%", minHeight: 120 }}
          value={bulkInput}
          onChange={(event) => setBulkInput(event.target.value)}
        />
      </section>

      <section className="panel dashboard-card" style={{ marginBottom: 16 }}>
        <h2>Blockers</h2>
        <ul>
          {data.blockers.slice(0, 20).map((item) => (
            <li key={item.pinId}>
              {item.pinId} - {item.productKey} - {item.reasons.join(", ")}
            </li>
          ))}
        </ul>
      </section>

      <section className="panel dashboard-card" style={{ marginBottom: 16 }}>
        <h2>Priorites business</h2>
        <ul>
          <li>Monetisation: completer les produits sans URL affiliee finale.</li>
          <li>Qualite: descendre les blockers QA critiques a 0.</li>
          <li>Trafic: suivre saves / outbound clicks / CTR sur les pins actives.</li>
          <li>Optimisation: marquer winners/low performers et dupliquer les winners.</li>
          <li>Risque: garder publish live desactive tant que canary non valide.</li>
        </ul>
      </section>

      <section className="panel dashboard-card" style={{ marginBottom: 16 }}>
        <h2>Performance labels</h2>
        <div className="actions" style={{ marginTop: 8 }}>
          <select value={labelFilter} onChange={(event) => setLabelFilter(event.target.value as "all" | "low_performer" | "stable" | "winner")}>
            <option value="all">all</option>
            <option value="low_performer">low_performer</option>
            <option value="stable">stable</option>
            <option value="winner">winner</option>
          </select>
        </div>
        <ul>
          {labelRows.slice(0, 20).map((row) => (
            <li key={row.pinId}>
              {row.pinId} - {row.performanceLabel} - monetizationReady:{String(row.monetizationReady)}
              <div className="actions" style={{ marginTop: 6 }}>
                <button className="button secondary" type="button" onClick={() => void updateLabel(row.pinId, "low_performer")}>
                  low
                </button>
                <button className="button secondary" type="button" onClick={() => void updateLabel(row.pinId, "stable")}>
                  stable
                </button>
                <button className="button secondary" type="button" onClick={() => void updateLabel(row.pinId, "winner")}>
                  winner
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel dashboard-card">
        <h2>Today</h2>
        <p className="subtle">
          Due today: {data.today.dueToday.length} - Next: {data.today.nextPublications.length} - Errors: {data.today.errorPins.length} -
          Winners recents: {data.today.recentWinners.length} - Variantes pretes: {data.today.readyVariants.length} - Couverture restante:{" "}
          {data.today.remainingCoverageDays} jours
        </p>
        <div className="actions" style={{ marginTop: 8 }}>
          <select value={qaFilter} onChange={(event) => setQaFilter(event.target.value as "all" | "blocked" | "ready")}>
            <option value="blocked">Pins bloquees QA</option>
            <option value="ready">Pins QA pass</option>
            <option value="all">Toutes les pins</option>
          </select>
        </div>
        <ul>
          {data.qaResults
            .filter((row) => (qaFilter === "all" ? true : qaFilter === "blocked" ? !row.qaPassed : row.qaPassed))
            .slice(0, 25)
            .map((row) => (
              <li key={row.pinId}>
                {row.pinId}: {row.qaIssues.join(", ") || "ok"}
              </li>
            ))}
        </ul>
      </section>
    </main>
  );
}
