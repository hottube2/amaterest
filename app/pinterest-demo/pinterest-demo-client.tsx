"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type DemoDefaults = {
  boardId?: string;
  title: string;
  description: string;
  link: string;
  imageUrl: string;
};

type SessionStatus = {
  ok: boolean;
  connected: boolean;
  appReady: boolean;
  redirectUri?: string;
  requiredScopes: string[];
  scopes: string[];
  missingScopes: string[];
  canReadBoards: boolean;
  canWritePins: boolean;
  fallbackAccessTokenConfigured: boolean;
  expiresAt?: string;
  profile?: {
    id?: string;
    username?: string;
    account_type?: string;
    profile_image?: string;
    website_url?: string;
  };
  profileError?: string;
};

type Board = {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
  pin_count?: number;
};

type ResultState = {
  ok: boolean;
  title: string;
  body: string;
};

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as Record<string, unknown>;
}

function isAbsoluteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function formatTimestamp(value?: string) {
  if (!value) {
    return "Unknown";
  }

  try {
    return new Intl.DateTimeFormat("fr-CA", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function PinterestDemoClient({ defaults }: { defaults: DemoDefaults }) {
  const searchParams = useSearchParams();
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(defaults.boardId || "");
  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description);
  const [link, setLink] = useState(defaults.link);
  const [imageUrl, setImageUrl] = useState(defaults.imageUrl);
  const [result, setResult] = useState<ResultState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const callbackNotice = searchParams.get("connected")
    ? "Pinterest OAuth terminé. Vous pouvez maintenant charger les boards et lancer un dry run."
    : searchParams.get("oauthError");

  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === selectedBoardId),
    [boards, selectedBoardId]
  );

  async function loadSession(skipLoadingState = false) {
    if (!skipLoadingState) {
      setSessionLoading(true);
    }

    try {
      const response = await fetch("/api/pinterest/auth/session", {
        cache: "no-store"
      });
      const data = (await readJson(response)) as SessionStatus | null;

      if (!response.ok || !data) {
        throw new Error("Unable to read the Pinterest OAuth session.");
      }

      setSession(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read session.";

      setResult({
        ok: false,
        title: "Session error",
        body: message
      });
    } finally {
      setSessionLoading(false);
    }
  }

  useEffect(() => {
    let isActive = true;

    void (async () => {
      try {
        const response = await fetch("/api/pinterest/auth/session", {
          cache: "no-store"
        });
        const data = (await readJson(response)) as SessionStatus | null;

        if (!response.ok || !data) {
          throw new Error("Unable to read the Pinterest OAuth session.");
        }

        if (isActive) {
          setSession(data);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to read session.";

        if (isActive) {
          setResult({
            ok: false,
            title: "Session error",
            body: message
          });
        }
      } finally {
        if (isActive) {
          setSessionLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleLoadBoards() {
    setBoardsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/pinterest/boards", {
        cache: "no-store"
      });
      const data = (await readJson(response)) as
        | {
            ok?: boolean;
            error?: string;
            boards?: Board[];
          }
        | null;

      if (!response.ok || !data?.ok || !data.boards) {
        throw new Error(data?.error || "Unable to load Pinterest boards.");
      }

      setBoards(data.boards);
      setSelectedBoardId((currentBoardId) => {
        if (currentBoardId && data.boards?.some((board) => board.id === currentBoardId)) {
          return currentBoardId;
        }

        if (defaults.boardId && data.boards?.some((board) => board.id === defaults.boardId)) {
          return defaults.boardId;
        }

        return data.boards?.[0]?.id || "";
      });

      setResult({
        ok: true,
        title: "Boards loaded",
        body: JSON.stringify(data, null, 2)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load boards.";

      setResult({
        ok: false,
        title: "Boards error",
        body: message
      });
    } finally {
      setBoardsLoading(false);
    }
  }

  function applySampleAmazonProduct() {
    const resolvedImageUrl = isAbsoluteUrl(defaults.imageUrl)
      ? defaults.imageUrl
      : `${window.location.origin}${defaults.imageUrl}`;

    setTitle(defaults.title);
    setDescription(defaults.description);
    setLink(defaults.link);
    setImageUrl(resolvedImageUrl);

    if (!selectedBoardId && defaults.boardId) {
      setSelectedBoardId(defaults.boardId);
    }
  }

  async function submitPin(dryRun: boolean) {
    if (!selectedBoardId) {
      setResult({
        ok: false,
        title: "Board required",
        body: "Load your boards and select one board before creating a test pin."
      });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const payload = {
        boardId: selectedBoardId,
        title,
        description,
        link,
        imageUrl: isAbsoluteUrl(imageUrl) ? imageUrl : `${window.location.origin}${imageUrl}`,
        dryRun
      };

      const response = await fetch("/api/pinterest/test-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = (await readJson(response)) as
        | {
            ok?: boolean;
            error?: string;
          }
        | null;

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Unable to create the Pinterest test pin.");
      }

      setResult({
        ok: true,
        title: dryRun ? "Dry Run successful" : "Pin request successful",
        body: JSON.stringify(data, null, 2)
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create the test pin.";

      setResult({
        ok: false,
        title: dryRun ? "Dry Run error" : "Create Test Pin error",
        body: message
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function disconnectPinterest() {
    setDisconnecting(true);

    try {
      await fetch("/api/pinterest/auth/disconnect", {
        method: "POST"
      });

      setBoards([]);
      setSelectedBoardId(defaults.boardId || "");
      setResult({
        ok: true,
        title: "Disconnected",
        body: "The local Pinterest demo session has been cleared."
      });
      await loadSession();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to clear the session.";

      setResult({
        ok: false,
        title: "Disconnect error",
        body: message
      });
    } finally {
      setDisconnecting(false);
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
          <Link href="/privacy">Confidentialité</Link>
        </nav>
      </header>

      <section className="demo-hero">
        <div>
          <p className="eyebrow">Pinterest OAuth Demo</p>
          <h1 className="demo-title">Connexion OAuth, callback, boards et test pin</h1>
          <p className="lede">
            Démo locale pensée pour une vidéo Pinterest Standard Access. Le flow montre la
            connexion OAuth, le retour callback, le chargement des boards et la préparation d’un
            pin test avec dry run ou publication réelle.
          </p>
          <div className="actions">
            <a className="button primary" href="/api/pinterest/auth/start">
              Connect Pinterest
            </a>
            <button
              className="button secondary"
              type="button"
              onClick={disconnectPinterest}
              disabled={!session?.connected || disconnecting}
            >
              {disconnecting ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </div>

        <article className="panel dashboard-card demo-steps-card">
          <h2>Demo steps</h2>
          <ol className="demo-steps-list">
            <li>Cliquer sur Connect Pinterest.</li>
            <li>Autoriser le retour vers la redirect URI configurée.</li>
            <li>Revenir sur la démo et charger les boards.</li>
            <li>Sélectionner le board cible.</li>
            <li>Lancer Dry Run ou Create Test Pin.</li>
          </ol>
          <p className="subtle">
            Redirect URI attendue : <code>{session?.redirectUri || "Not configured"}</code>
          </p>
        </article>
      </section>

      {callbackNotice ? (
        <div className="demo-banner demo-banner-info">
          <strong>Callback:</strong> {callbackNotice}
        </div>
      ) : null}

      {!session?.appReady && !sessionLoading ? (
        <div className="demo-banner demo-banner-warn">
          <strong>OAuth config missing:</strong> verify <code>PINTEREST_APP_ID</code>,{" "}
          <code>PINTEREST_APP_SECRET</code> and <code>PINTEREST_REDIRECT_URI</code> in{" "}
          <code>.env.local</code>.
        </div>
      ) : null}

      <section className="dashboard-grid">
        <article className="panel dashboard-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Section A</p>
              <h2>Connection status</h2>
            </div>
            <span className={`status-pill ${session?.connected ? "status-pill-ok" : "status-pill-muted"}`}>
              {sessionLoading ? "Checking..." : session?.connected ? "Connected to Pinterest" : "Not connected"}
            </span>
          </div>

          {session?.profile ? (
            <div className="profile-summary">
              {session.profile.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="avatar"
                  src={session.profile.profile_image}
                  alt={session.profile.username || "Pinterest profile"}
                />
              ) : (
                <div className="avatar avatar-fallback">
                  {(session.profile.username || "P").slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="profile-name">{session.profile.username || "Pinterest account"}</div>
                <div className="subtle">
                  {session.profile.account_type || "User account"} · Expires {formatTimestamp(session.expiresAt)}
                </div>
              </div>
            </div>
          ) : (
            <p className="subtle">
              {sessionLoading
                ? "Reading the local OAuth session..."
                : "No Pinterest OAuth session detected yet."}
            </p>
          )}

          <div className="scope-row">
            {session?.requiredScopes?.map((scope) => {
              const granted = session.scopes.includes(scope);

              return (
                <span
                  key={scope}
                  className={`scope-pill ${granted ? "scope-pill-ok" : "scope-pill-muted"}`}
                >
                  {scope}
                </span>
              );
            })}
          </div>

          {session?.missingScopes?.length ? (
            <div className="demo-banner demo-banner-soft">
              Missing scopes right now: {session.missingScopes.join(", ")}. The OAuth flow and Dry
              Run remain demonstrable even before Pinterest approves write scopes.
            </div>
          ) : null}

          {session?.profileError ? <p className="subtle">Profile note: {session.profileError}</p> : null}
        </article>

        <article className="panel dashboard-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Section B</p>
              <h2>Boards</h2>
            </div>
            <button
              className="button secondary"
              type="button"
              onClick={handleLoadBoards}
              disabled={!session?.connected || boardsLoading}
            >
              {boardsLoading ? "Loading..." : "Load Boards"}
            </button>
          </div>

          {!session?.connected ? (
            <p className="subtle">Connect Pinterest first to demonstrate the board listing flow.</p>
          ) : null}

          {boards.length > 0 ? (
            <div className="board-list">
              {boards.map((board) => (
                <button
                  key={board.id}
                  type="button"
                  className={`board-card ${selectedBoardId === board.id ? "board-card-selected" : ""}`}
                  onClick={() => setSelectedBoardId(board.id)}
                >
                  <div className="board-card-title">{board.name}</div>
                  <div className="subtle">
                    {board.pin_count ?? 0} pins · {board.privacy || "PUBLIC"}
                  </div>
                  {board.description ? <p>{board.description}</p> : null}
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No boards loaded yet.</p>
              <p className="subtle">This section is meant to show the authenticated board fetch.</p>
            </div>
          )}
        </article>

        <article className="panel dashboard-card dashboard-card-wide">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Section C</p>
              <h2>Test Pin</h2>
            </div>
            <span className="subtle">
              Selected board: <strong>{selectedBoard?.name || "None"}</strong>
            </span>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>

            <label className="field field-span-2">
              <span>Description</span>
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            <label className="field">
              <span>Product link</span>
              <input value={link} onChange={(event) => setLink(event.target.value)} />
            </label>

            <label className="field">
              <span>Image URL</span>
              <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
            </label>
          </div>

          <div className="action-row">
            <button className="button secondary" type="button" onClick={applySampleAmazonProduct}>
              Use sample Amazon product
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => void submitPin(true)}
              disabled={submitting || !selectedBoardId}
            >
              {submitting ? "Working..." : "Dry Run"}
            </button>
            <button
              className="button primary"
              type="button"
              onClick={() => void submitPin(false)}
              disabled={submitting || !session?.connected || !selectedBoardId}
            >
              {submitting ? "Publishing..." : "Create Test Pin"}
            </button>
          </div>

          <div className="result-panel">
            <div className="result-header">
              <strong>{result?.title || "Latest result"}</strong>
              <span className={`status-pill ${result?.ok ? "status-pill-ok" : "status-pill-muted"}`}>
                {result ? (result.ok ? "Success" : "Error") : "Idle"}
              </span>
            </div>
            <pre className="result-output">{result?.body || "No result yet."}</pre>
          </div>
        </article>
      </section>

      <footer className="site-footer">
        <span>© 2026 Amaterest</span>
        <span>Demo route: /pinterest-demo</span>
      </footer>
    </main>
  );
}
