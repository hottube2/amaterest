"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type {
  PreparedPinterestLaunchPin,
  PinterestLaunchImageSourceType,
  PinterestLaunchStatus
} from "@/lib/pinterest-content";

type LaunchPinState = PreparedPinterestLaunchPin & {
  lastError?: string;
  lastRemotePinId?: string;
  lastSuccess?: boolean;
};

type LaunchResult = {
  pinId: string;
  success: boolean;
  pinTitle: string;
  boardId: string;
  link?: string;
  imageUrl: string;
  imageAssetPath: string;
  imageSourceType: PinterestLaunchImageSourceType;
  isFallback: boolean;
  mode: "dryRun" | "publish";
  requestedMode: "dryRun" | "publish";
  status: PinterestLaunchStatus;
  error?: string;
  remotePinId?: string;
};

type LaunchReport = {
  ok: boolean;
  requestedMode: "dryRun" | "publish";
  effectiveMode: "dryRun" | "publish";
  publishEnabled: boolean;
  publishBlocked: boolean;
  warning?: string;
  totalPins: number;
  counts: {
    success: number;
    failed: number;
    dryRunOk: number;
    published: number;
    blocked: number;
  };
  results: LaunchResult[];
};

type LaunchClientProps = {
  initialPins: PreparedPinterestLaunchPin[];
  publishEnabled: boolean;
};

type LaunchSummary = {
  total: number;
  localImages: number;
  fallbackImages: number;
  dryRunOk: number;
  published: number;
  blocked: number;
  failed: number;
  launchReadiness: number;
};

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as Record<string, unknown>;
}

function getStatusClass(status: PinterestLaunchStatus) {
  if (status === "dry-run ok" || status === "published") {
    return "status-pill-ok";
  }

  if (status === "publish blocked") {
    return "status-pill-warn";
  }

  if (status === "error") {
    return "status-pill-error";
  }

  return "status-pill-muted";
}

function getImageSourceLabel(imageSourceType: PinterestLaunchImageSourceType, isFallback: boolean) {
  if (imageSourceType === "local") {
    return isFallback ? "local placeholder" : "local image";
  }

  if (imageSourceType === "test") {
    return "test image";
  }

  return "fallback image";
}

function getImageSourceClass(imageSourceType: PinterestLaunchImageSourceType, isFallback: boolean) {
  if (imageSourceType === "local" && !isFallback) {
    return "status-pill-ok";
  }

  if (imageSourceType === "test") {
    return "status-pill-muted";
  }

  return "status-pill-warn";
}

function isPinVisuallyReady(pin: Pick<LaunchPinState, "imageSourceType" | "isFallback">) {
  return pin.imageSourceType === "local" && !pin.isFallback;
}

function getLaunchStatus(summary: LaunchSummary, publishEnabled: boolean) {
  if (summary.total === 0) {
    return {
      label: "No launch pins",
      className: "status-pill-muted",
      message: "Add launch pins to compute a visual readiness score."
    };
  }

  if (summary.failed > 0) {
    return {
      label: "Needs dry-run fixes",
      className: "status-pill-error",
      message: "Some launch pins still fail validation and need fixes before the batch is truly ready."
    };
  }

  if (summary.fallbackImages > 0) {
    return {
      label: "Needs visual assets",
      className: "status-pill-warn",
      message: "Some pins still rely on fallback visuals. Replace them with dedicated local assets to finish prep."
    };
  }

  if (summary.dryRunOk < summary.total) {
    return {
      label: "Ready for content review",
      className: "status-pill-muted",
      message: "Every pin has a dedicated local image. Run the batch dry-run to validate the final launch set."
    };
  }

  if (!publishEnabled) {
    return {
      label: "Ready to publish when Pinterest write scopes are approved",
      className: "status-pill-ok",
      message: "All launch pins have dedicated local visuals and passed dry-run. The only remaining gate is Pinterest write access."
    };
  }

  return {
    label: "Ready to publish",
    className: "status-pill-ok",
    message: "All launch pins have dedicated local visuals and the launch batch is ready for live publishing."
  };
}

function buildLaunchJson(pins: LaunchPinState[]) {
  return JSON.stringify(pins, null, 2);
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildLaunchCsv(pins: LaunchPinState[]) {
  const header = [
    "pinId",
    "productKey",
    "category",
    "internalTitle",
    "pinTitle",
    "pinDescription",
    "amazonUrl",
    "imageUrl",
    "imageAssetPath",
    "imageSourceType",
    "isFallback",
    "boardId",
    "mode",
    "status",
    "lastError"
  ];
  const rows = pins.map((pin) =>
    [
      pin.pinId,
      pin.productKey,
      pin.category,
      pin.internalTitle,
      pin.pinTitle,
      pin.pinDescription,
      pin.amazonUrl || "",
      pin.imageUrl,
      pin.imageAssetPath,
      pin.imageSourceType,
      pin.isFallback,
      pin.boardId,
      pin.mode,
      pin.status,
      pin.lastError || ""
    ]
      .map((value) => escapeCsv(String(value)))
      .join(",")
  );

  return [header.join(","), ...rows].join("\n");
}

export default function PinterestLaunchClient({ initialPins, publishEnabled }: LaunchClientProps) {
  const [pins, setPins] = useState<LaunchPinState[]>(initialPins);
  const [report, setReport] = useState<LaunchReport | null>(null);
  const [busyMode, setBusyMode] = useState<"dryRun" | "publish" | null>(null);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const summary = useMemo(() => {
    const counts = pins.reduce(
      (accumulator, pin) => {
        accumulator.total += 1;

        if (isPinVisuallyReady(pin)) {
          accumulator.localImages += 1;
        } else {
          accumulator.fallbackImages += 1;
        }

        if (pin.status === "dry-run ok") {
          accumulator.dryRunOk += 1;
        }

        if (pin.status === "published") {
          accumulator.published += 1;
        }

        if (pin.status === "publish blocked") {
          accumulator.blocked += 1;
        }

        if (pin.status === "error") {
          accumulator.failed += 1;
        }

        return accumulator;
      },
      {
        total: 0,
        localImages: 0,
        fallbackImages: 0,
        dryRunOk: 0,
        published: 0,
        blocked: 0,
        failed: 0
      }
    );

    return {
      ...counts,
      launchReadiness:
        counts.total === 0 ? 0 : Math.round((counts.localImages / counts.total) * 100)
    };
  }, [pins]);

  const launchStatus = useMemo(() => getLaunchStatus(summary, publishEnabled), [summary, publishEnabled]);

  function resetSampleData() {
    setPins(initialPins);
    setReport(null);
    setCopyMessage("Sample data restored.");
  }

  function applyReport(nextReport: LaunchReport) {
    setReport(nextReport);
    setPins((currentPins) =>
      currentPins.map((pin) => {
        const result = nextReport.results.find((entry) => entry.pinId === pin.pinId);

        if (!result) {
          return pin;
        }

        return {
          ...pin,
          mode: result.mode,
          status: result.status,
          lastError: result.error,
          lastRemotePinId: result.remotePinId,
          lastSuccess: result.success
        };
      })
    );
  }

  async function runBatch(mode: "dryRun" | "publish", pinIds?: string[]) {
    setBusyMode(mode);
    setActivePinId(pinIds?.length === 1 ? pinIds[0] : null);
    setCopyMessage(null);

    try {
      const response = await fetch(
        mode === "dryRun" ? "/api/pinterest/launch/dry-run" : "/api/pinterest/launch/publish",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(pinIds && pinIds.length > 0 ? { pinIds } : {})
        }
      );
      const data = (await readJson(response)) as LaunchReport | { error?: string } | null;

      if (!response.ok || !data || !("ok" in data) || !data.ok) {
        const errorMessage =
          data && "error" in data && typeof data.error === "string"
            ? data.error
            : "Unable to run the Pinterest launch batch.";

        throw new Error(errorMessage);
      }

      applyReport(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to run the Pinterest launch batch.";

      setReport({
        ok: false,
        requestedMode: mode,
        effectiveMode: mode,
        publishEnabled,
        publishBlocked: false,
        warning: message,
        totalPins: pinIds?.length || pins.length,
        counts: {
          success: 0,
          failed: pinIds?.length || pins.length,
          dryRunOk: 0,
          published: 0,
          blocked: 0
        },
        results: []
      });
    } finally {
      setBusyMode(null);
      setActivePinId(null);
    }
  }

  async function copyToClipboard(kind: "json" | "csv") {
    try {
      const payload = kind === "json" ? buildLaunchJson(pins) : buildLaunchCsv(pins);

      await navigator.clipboard.writeText(payload);
      setCopyMessage(kind === "json" ? "Launch JSON copied." : "Launch CSV copied.");
    } catch {
      setCopyMessage(`Unable to copy ${kind.toUpperCase()} to the clipboard.`);
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
          <Link href="/pinterest-demo">Pinterest Demo</Link>
        </nav>
      </header>

      <section className="demo-hero">
        <div>
          <p className="eyebrow">Pinterest Launch</p>
          <h1 className="demo-title">10 pins Amazon affiliate pretes a lancer</h1>
          <p className="lede">
            Cette page prepare les 10 premieres pins du lancement Amaterest avec un pipeline batch,
            un export JSON/CSV et un mode publish securise tant que Pinterest Standard Access write
            est encore en attente.
          </p>
          <div className="actions">
            <button className="button secondary" type="button" onClick={resetSampleData}>
              Use sample data
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => void runBatch("dryRun")}
              disabled={busyMode !== null}
            >
              {busyMode === "dryRun" && !activePinId ? "Running..." : "Run all dry-runs"}
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => void runBatch("publish")}
              disabled={busyMode !== null}
            >
              {busyMode === "publish" && !activePinId ? "Publishing..." : "Publish all"}
            </button>
          </div>
        </div>

        <article className="panel dashboard-card demo-steps-card">
          <div className="launch-summary-header">
            <h2>Launch summary</h2>
            <span className={`status-pill ${launchStatus.className}`}>{launchStatus.label}</span>
          </div>
          <div className="launch-summary-grid">
            <div className="summary-metric">
              <strong>{summary.total}</strong>
              <span>Total pins</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.localImages}</strong>
              <span>Local images</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.fallbackImages}</strong>
              <span>Fallback images</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.dryRunOk}</strong>
              <span>Dry-runs ok</span>
            </div>
            <div className="summary-metric">
              <strong>{summary.launchReadiness}%</strong>
              <span>Launch readiness</span>
            </div>
          </div>
          <div className="launch-progress-block">
            <div className="launch-progress-meta">
              <span className="subtle">Visual readiness</span>
              <strong>{summary.launchReadiness}%</strong>
            </div>
            <div
              className="launch-progress"
              role="progressbar"
              aria-label="Launch visual readiness"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={summary.launchReadiness}
            >
              <span style={{ width: `${summary.launchReadiness}%` }} />
            </div>
            <p className="subtle">{launchStatus.message}</p>
          </div>
          <p className="subtle">
            Board cible: <code>{pins[0]?.boardId || "Not configured"}</code>
          </p>
          <p className="subtle">
            Export rapide: JSON / CSV depuis les boutons ci-dessous, sans fouiller le code.
          </p>
          <p className="subtle">
            Drop your pin images in <code>/public/pinterest-launch/</code> with names{" "}
            <code>pin-01.jpg</code> to <code>pin-10.jpg</code>.
          </p>
        </article>
      </section>

      {!publishEnabled ? (
        <div className="demo-banner demo-banner-warn">
          <strong>Publish protected:</strong> <code>PINTEREST_ENABLE_PUBLISH=false</code>. Le
          bouton Publish all reste visible, mais il force un dry-run securise.
        </div>
      ) : null}

      {report?.warning ? (
        <div className="demo-banner demo-banner-info">
          <strong>Batch note:</strong> {report.warning}
        </div>
      ) : null}

      {copyMessage ? (
        <div className="demo-banner demo-banner-soft">
          <strong>Clipboard:</strong> {copyMessage}
        </div>
      ) : null}

      <section className="launch-toolbar">
        <button className="button secondary" type="button" onClick={() => void copyToClipboard("json")}>
          Copy JSON
        </button>
        <button className="button secondary" type="button" onClick={() => void copyToClipboard("csv")}>
          Copy CSV
        </button>
        <Link className="button secondary" href="/pinterest-demo">
          Open Pinterest demo
        </Link>
      </section>

      <section className="launch-grid">
        {pins.map((pin) => {
          const pinBusy = activePinId === pin.pinId;

          return (
            <article key={pin.pinId} className="panel launch-card">
              <div className="launch-card-media">
                {pin.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={pin.imageUrl} alt={pin.pinTitle} />
                ) : (
                  <div className="launch-image-fallback">No image</div>
                )}
              </div>

              <div className="launch-card-body">
                <div className="launch-card-top">
                  <span className="eyebrow">PIN {pin.order}</span>
                  <span className={`status-pill ${getStatusClass(pin.status)}`}>{pin.status}</span>
                </div>

                <div className="launch-badge-row">
                  <span className={`status-pill ${getImageSourceClass(pin.imageSourceType, pin.isFallback)}`}>
                    {getImageSourceLabel(pin.imageSourceType, pin.isFallback)}
                  </span>
                  <span className="status-pill status-pill-muted">{pin.imageAssetPath}</span>
                </div>

                <h2>{pin.pinTitle}</h2>
                <p className="subtle">{pin.pinDescription}</p>

                <div className="launch-meta">
                  <div>
                    <strong>Produit:</strong> {pin.productKey}
                  </div>
                  <div>
                    <strong>Interne:</strong> {pin.internalTitle}
                  </div>
                  <div>
                    <strong>Mode:</strong> {pin.mode}
                  </div>
                  <div>
                    <strong>Image:</strong> {pin.imageSourceType}
                  </div>
                  <div>
                    <strong>Board:</strong> {pin.boardId || "Missing"}
                  </div>
                </div>

                {pin.relatedProductKeys?.length ? (
                  <p className="subtle">
                    Mix produits: {pin.relatedProductKeys.join(", ")}
                  </p>
                ) : null}

                <a className="launch-link" href={pin.amazonUrl} target="_blank" rel="noreferrer">
                  {pin.amazonUrl || "Missing Amazon URL"}
                </a>

                {pin.lastError ? <div className="demo-banner demo-banner-soft">{pin.lastError}</div> : null}

                {pin.lastRemotePinId ? (
                  <p className="subtle">Pinterest pin id: {pin.lastRemotePinId}</p>
                ) : null}

                <div className="action-row">
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => void runBatch("dryRun", [pin.pinId])}
                    disabled={busyMode !== null}
                  >
                    {pinBusy && busyMode === "dryRun" ? "Running..." : "Run dry-run"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
