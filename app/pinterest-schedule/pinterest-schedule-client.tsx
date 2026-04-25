"use client";

import Link from "next/link";
import { useState } from "react";

import type {
  PinterestScheduleDashboard,
  PinterestScheduleItem,
  PinterestScheduleRunResult,
  PinterestScheduleStatus
} from "@/lib/pinterest-schedule";

type PinterestScheduleClientProps = {
  initialDashboard: PinterestScheduleDashboard;
};

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as Record<string, unknown>;
}

function formatDateTime(value: string | undefined, timeZone: string) {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getStatusClass(status: PinterestScheduleStatus) {
  if (status === "published" || status === "dry-run ok") {
    return "status-pill-ok";
  }

  if (status === "blocked") {
    return "status-pill-warn";
  }

  if (status === "failed") {
    return "status-pill-error";
  }

  return "status-pill-muted";
}

function getImageSourceClass(item: Pick<PinterestScheduleItem, "imageSourceType" | "isFallback">) {
  if (item.imageSourceType === "local" && !item.isFallback) {
    return "status-pill-ok";
  }

  if (item.imageSourceType === "test") {
    return "status-pill-muted";
  }

  return "status-pill-warn";
}

function getImageSourceLabel(item: Pick<PinterestScheduleItem, "imageSourceType" | "isFallback">) {
  if (item.imageSourceType === "local" && !item.isFallback) {
    return "local image";
  }

  if (item.imageSourceType === "test") {
    return "test image";
  }

  return "fallback image";
}

function getLaunchStatus(dashboard: PinterestScheduleDashboard) {
  const { summary } = dashboard;

  if (summary.failed > 0) {
    return {
      label: "Needs review",
      className: "status-pill-error",
      message: "Some scheduled pins failed and need attention before the queue can run cleanly."
    };
  }

  if (summary.blocked > 0) {
    return {
      label: "Publish blocked",
      className: "status-pill-warn",
      message: "Some pins are blocked for live publishing. Dry-run remains safe while Pinterest write access is pending."
    };
  }

  if (summary.dueNow > 0) {
    return {
      label: "Pins due now",
      className: "status-pill-warn",
      message: "There are scheduled pins ready to be processed right now."
    };
  }

  if (summary.scheduled > 0) {
    return {
      label: "Scheduled and waiting",
      className: "status-pill-ok",
      message: "The queue is planned and waiting for the next publication windows."
    };
  }

  if (summary.ready > 0 || summary.dryRunOk > 0) {
    return {
      label: "Ready to schedule",
      className: "status-pill-muted",
      message: "Launch-ready pins are available. You can spread them across the next 7 days in one click."
    };
  }

  return {
    label: "Queue synced",
    className: "status-pill-muted",
    message: "The scheduler is connected to the launch-ready pins and ready for manual execution."
  };
}

export default function PinterestScheduleClient({ initialDashboard }: PinterestScheduleClientProps) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nowTimestamp, setNowTimestamp] = useState(() => Date.now());
  const globalStatus = getLaunchStatus(dashboard);
  const { summary } = dashboard;

  async function callEndpoint(path: string, options?: RequestInit) {
    setBusyAction(path);
    setErrorMessage(null);

    try {
      const response = await fetch(path, options);
      const data = (await readJson(response)) as PinterestScheduleDashboard | { error?: string } | null;

      if (!response.ok || !data || !("ok" in data) || !data.ok) {
        const message =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : "Unable to update the Pinterest scheduler.";

        throw new Error(message);
      }

      setNowTimestamp(Date.now());
      setDashboard(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the Pinterest scheduler.");
    } finally {
      setBusyAction(null);
    }
  }

  function isBusy(path: string) {
    return busyAction === path;
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
          <Link href="/pinterest-demo">Pinterest Demo</Link>
        </nav>
      </header>

      <section className="demo-hero">
        <div>
          <p className="eyebrow">Pinterest Schedule</p>
          <h1 className="demo-title">3 pins par jour avec file d&apos;attente locale</h1>
          <p className="lede">
            Ce scheduler reutilise directement les 10 pins de lancement Amaterest, les repartit sur
            les prochains jours et garde un mode totalement safe tant que la vraie publication
            Pinterest reste bloquee.
          </p>
          <div className="actions">
            <button
              className="button primary"
              type="button"
              onClick={() =>
                void callEndpoint("/api/pinterest/schedule/fill", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ days: 7 })
                })
              }
              disabled={busyAction !== null}
            >
              {isBusy("/api/pinterest/schedule/fill") ? "Scheduling..." : "Schedule next 7 days"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() =>
                void callEndpoint("/api/pinterest/schedule/fill", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ days: 7 })
                })
              }
              disabled={busyAction !== null}
            >
              Schedule from launch-ready pins
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => void callEndpoint("/api/pinterest/schedule/clear", { method: "POST" })}
              disabled={busyAction !== null}
            >
              {isBusy("/api/pinterest/schedule/clear") ? "Clearing..." : "Clear schedule"}
            </button>
          </div>
        </div>

        <article className="panel dashboard-card demo-steps-card">
          <div className="launch-summary-header">
            <h2>Scheduler summary</h2>
            <span className={`status-pill ${globalStatus.className}`}>{globalStatus.label}</span>
          </div>
          <div className="launch-summary-grid">
            <div className="summary-metric">
              <strong>{summary.ready}</strong>
              <span>Ready pins</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.scheduled}</strong>
              <span>Scheduled</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.published}</strong>
              <span>Published</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.failed}</strong>
              <span>Failed</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.dueNow}</strong>
              <span>Due now</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.scheduleCoverageLabel}</strong>
              <span>Schedule coverage</span>
            </div>
          </div>

          <div className="launch-progress-block">
            <div className="launch-progress-meta">
              <span className="subtle">Real publish</span>
              <strong>{summary.publishEnabled ? "Enabled" : "Blocked"}</strong>
            </div>
            <div
              className="launch-progress"
              role="progressbar"
              aria-label="Schedule coverage"
              aria-valuemin={0}
              aria-valuemax={summary.totalPins}
              aria-valuenow={summary.scheduled}
            >
              <span
                style={{
                  width: `${summary.totalPins === 0 ? 0 : Math.round((summary.scheduled / summary.totalPins) * 100)}%`
                }}
              />
            </div>
            <p className="subtle">{globalStatus.message}</p>
          </div>

          <p className="subtle">
            Next publication:{" "}
            <strong>{summary.nextPublicationAt ? formatDateTime(summary.nextPublicationAt, summary.timezone) : "None planned"}</strong>
          </p>
          <p className="subtle">
            Timezone: <code>{summary.timezone}</code> | Daily slots:{" "}
            <code>{summary.dailySlots.join(", ")}</code>
          </p>
          <p className="subtle">
            {summary.dailySlots.length} pins/day = about {summary.estimatedDaysRemaining} day(s) to cover
            the remaining unpublished queue.
          </p>
        </article>
      </section>

      {dashboard.message ? (
        <div className="demo-banner demo-banner-info">
          <strong>Scheduler:</strong> {dashboard.message}
        </div>
      ) : null}

      {dashboard.report?.warning ? (
        <div className="demo-banner demo-banner-warn">
          <strong>Run note:</strong> {dashboard.report.warning}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="demo-banner demo-banner-soft">
          <strong>Error:</strong> {errorMessage}
        </div>
      ) : null}

      <section className="launch-toolbar">
        <button
          className="button secondary"
          type="button"
          onClick={() => void callEndpoint("/api/pinterest/schedule/list")}
          disabled={busyAction !== null}
        >
          {isBusy("/api/pinterest/schedule/list") ? "Refreshing..." : "Refresh queue"}
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() =>
            void callEndpoint("/api/pinterest/schedule/run", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({ mode: "auto" })
            })
          }
          disabled={busyAction !== null}
        >
          {isBusy("/api/pinterest/schedule/run") ? "Running..." : "Run due now"}
        </button>
        <button
          className="button secondary"
          type="button"
          onClick={() => void callEndpoint("/api/pinterest/schedule/dry-run-due", { method: "POST" })}
          disabled={busyAction !== null}
        >
          {isBusy("/api/pinterest/schedule/dry-run-due") ? "Running..." : "Dry-run due now"}
        </button>
        <button
          className="button primary"
          type="button"
          onClick={() => void callEndpoint("/api/pinterest/schedule/publish-due", { method: "POST" })}
          disabled={busyAction !== null}
        >
          {isBusy("/api/pinterest/schedule/publish-due") ? "Publishing..." : "Publish due now"}
        </button>
        <Link className="button secondary" href="/pinterest-launch">
          Open launch board
        </Link>
        <Link className="button secondary" href="/pinterest-demo">
          Open Pinterest demo
        </Link>
      </section>

      {dashboard.report ? (
        <section className="panel dashboard-card schedule-report-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Last execution</p>
              <h2>Run report</h2>
            </div>
            <span className={`status-pill ${dashboard.report.publishBlocked ? "status-pill-warn" : "status-pill-muted"}`}>
              {dashboard.report.requestedMode}
            </span>
          </div>
          <div className="schedule-report-grid">
            <div className="summary-metric">
              <strong>{dashboard.report.totalDue}</strong>
              <span>Total due</span>
            </div>
            <div className="summary-metric">
              <strong>{dashboard.report.counts.success}</strong>
              <span>Successful</span>
            </div>
            <div className="summary-metric">
              <strong>{dashboard.report.counts.dryRunOk}</strong>
              <span>Dry-runs ok</span>
            </div>
            <div className="summary-metric">
              <strong>{dashboard.report.counts.published}</strong>
              <span>Published</span>
            </div>
            <div className="summary-metric">
              <strong>{dashboard.report.counts.blocked}</strong>
              <span>Blocked</span>
            </div>
            <div className="summary-metric">
              <strong>{dashboard.report.counts.failed}</strong>
              <span>Failed</span>
            </div>
          </div>

          <div className="schedule-result-list">
            {dashboard.report.results.map((result: PinterestScheduleRunResult) => (
              <article key={`${result.id}-${result.lastAttemptAt || result.status}`} className="panel schedule-result-card">
                <div className="schedule-result-top">
                  <strong>PIN {result.pinNumber}</strong>
                  <span className={`status-pill ${getStatusClass(result.status)}`}>{result.status}</span>
                </div>
                <p className="subtle">{result.pinTitle}</p>
                <p className="subtle">
                  Mode: <code>{result.mode}</code> | Attempt:{" "}
                  <strong>{formatDateTime(result.lastAttemptAt, summary.timezone)}</strong>
                </p>
                {result.errorMessage ? <p className="subtle">{result.errorMessage}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="schedule-grid">
        {dashboard.queue.map((item) => (
          <article key={item.id} className="panel schedule-card">
            <div className="schedule-card-media">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.title} />
              ) : (
                <div className="launch-image-fallback">No image</div>
              )}
            </div>

            <div className="schedule-card-body">
              <div className="schedule-card-top">
                <div>
                  <p className="eyebrow">PIN {item.pinNumber}</p>
                  <h2>{item.title}</h2>
                </div>
                <div className="launch-badge-row">
                  {item.scheduledAt && Date.parse(item.scheduledAt) <= nowTimestamp ? (
                    <span className="status-pill status-pill-warn">due now</span>
                  ) : null}
                  <span className={`status-pill ${getStatusClass(item.status)}`}>{item.status}</span>
                </div>
              </div>

              <div className="launch-badge-row">
                <span className={`status-pill ${getImageSourceClass(item)}`}>{getImageSourceLabel(item)}</span>
                <span className="status-pill status-pill-muted">{item.imageAssetPath}</span>
                <span className="status-pill status-pill-muted">{item.mode}</span>
              </div>

              <p className="subtle">{item.description}</p>

              <div className="schedule-meta-grid">
                <div>
                  <strong>Board</strong>
                  <span>{item.boardId || "Missing"}</span>
                </div>
                <div>
                  <strong>Scheduled</strong>
                  <span>{formatDateTime(item.scheduledAt, summary.timezone)}</span>
                </div>
                <div>
                  <strong>Published</strong>
                  <span>{item.publishedAt ? formatDateTime(item.publishedAt, summary.timezone) : "Not published"}</span>
                </div>
                <div>
                  <strong>Last attempt</strong>
                  <span>{item.lastAttemptAt ? formatDateTime(item.lastAttemptAt, summary.timezone) : "No attempts yet"}</span>
                </div>
              </div>

              {item.relatedProductKeys?.length ? (
                <p className="subtle">Mix produits: {item.relatedProductKeys.join(", ")}</p>
              ) : null}

              <a className="launch-link" href={item.link} target="_blank" rel="noreferrer">
                {item.link || "Missing Amazon URL"}
              </a>

              {item.errorMessage ? <div className="demo-banner demo-banner-soft">{item.errorMessage}</div> : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
