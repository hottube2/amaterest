"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type CallbackState = {
  phase: "pending" | "success" | "error";
  message: string;
  details?: string;
};

type CallbackResponse = {
  ok?: boolean;
  error?: string;
  profile?: {
    username?: string;
  };
};

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text) as Record<string, unknown>;
}

export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasStarted = useRef(false);
  const callbackQuery = searchParams.toString();
  const initialError = searchParams.get("error");
  const initialErrorDescription = searchParams.get("error_description");
  const [callbackState, setCallbackState] = useState<CallbackState>(() => {
    if (initialError) {
      return {
        phase: "error",
        message: initialErrorDescription || initialError
      };
    }

    if (!callbackQuery.includes("code=")) {
      return {
        phase: "error",
        message: "Missing OAuth code in the Pinterest callback URL."
      };
    }

    return {
      phase: "pending",
      message: "Finalizing Pinterest OAuth..."
    };
  });

  useEffect(() => {
    if (hasStarted.current || callbackState.phase !== "pending") {
      return;
    }

    hasStarted.current = true;

    void (async () => {
      try {
        const response = await fetch(`/api/pinterest/auth/callback?${callbackQuery}`, {
          cache: "no-store"
        });
        const data = (await readJson(response)) as CallbackResponse | null;

        if (!response.ok || !data?.ok) {
          throw new Error(
            (typeof data?.error === "string" && data.error) ||
              "Unable to finalize the Pinterest callback."
          );
        }

        setCallbackState({
          phase: "success",
          message: "Pinterest account connected successfully.",
          details:
            typeof data.profile?.username === "string"
              ? `Connected account: ${data.profile.username}`
              : "OAuth session created on the server."
        });

        window.setTimeout(() => {
          router.replace("/pinterest-demo?connected=1");
        }, 1200);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to finalize the Pinterest callback.";

        setCallbackState({
          phase: "error",
          message
        });
      }
    })();
  }, [callbackQuery, callbackState.phase, router]);

  return (
    <main className="page-shell callback-shell">
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

      <section className="callback-panel panel">
        <p className="eyebrow">Pinterest Callback</p>
        <h1 className="callback-title">
          {callbackState.phase === "pending"
            ? "Connexion en cours"
            : callbackState.phase === "success"
              ? "Connexion réussie"
              : "Connexion impossible"}
        </h1>
        <p className="lede">{callbackState.message}</p>
        {callbackState.details ? <p className="subtle">{callbackState.details}</p> : null}

        <div className="actions">
          <Link className="button primary" href="/pinterest-demo">
            Return to Pinterest Demo
          </Link>
          <Link className="button secondary" href="/">
            Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
