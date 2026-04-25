import Link from "next/link";

const setupSteps = [
  "Copier .env.local.example vers .env.local",
  "Configurer PINTEREST_REDIRECT_URI vers /pinterest/callback",
  "Lancer npm install puis npm run dev:test",
  "Ouvrir /pinterest-demo, connecter Pinterest puis charger les boards"
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>Amaterest</span>
        </div>
        <nav className="nav" aria-label="Navigation">
          <Link href="/privacy">Confidentialité</Link>
          <a href="mailto:hello@amaterest.com">Contact</a>
        </nav>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Pinterest + Amazon</p>
          <h1 className="title">Racine autonome Amaterest</h1>
          <p className="lede">
            Ce dossier est maintenant pensé pour devenir la vraie racine applicative du flux
            Pinterest + Amazon. Il contient son propre code Next.js, ses routes API, ses assets
            publics et sa configuration locale.
          </p>
          <div className="actions">
            <Link className="button primary" href="/pinterest-demo">
              Ouvrir la démo OAuth
            </Link>
            <Link className="button secondary" href="/pinterest-launch">
              Ouvrir le lancement Pinterest
            </Link>
            <Link className="button secondary" href="/pinterest-schedule">
              Ouvrir le scheduler
            </Link>
            <Link className="button primary" href="/privacy">
              Politique de confidentialité
            </Link>
            <a className="button secondary" href="mailto:hello@amaterest.com">
              Contact
            </a>
          </div>
        </div>

        <div className="card-grid">
          <article className="panel hero-card">
            <h2>Endpoints prêts</h2>
            <div className="code">GET /api/pinterest/boards</div>
            <div className="code">POST /api/pinterest/test-pin</div>
            <div className="code">GET /api/pinterest/auth/start</div>
          </article>
          <article className="panel hero-card">
            <h2>Image locale de test</h2>
            <p>
              Si <code>PINTEREST_TEST_IMAGE_URL</code> est vide, l’API utilise automatiquement
              <code> /icon-512.png</code> servi par le dossier <code>public/</code>.
            </p>
          </article>
          <article className="panel hero-card">
            <h2>Mise en route</h2>
            <ol>
              {setupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="stack">
        <article className="panel stack-card">
          <h2>Commande de dev</h2>
          <div className="code">npm run dev:test</div>
          <div className="code">http://localhost:3301/pinterest-demo</div>
          <div className="code">http://localhost:3301/pinterest-launch</div>
          <div className="code">http://localhost:3301/pinterest-schedule</div>
        </article>

        <article className="panel stack-card">
          <h2>Commandes utiles</h2>
          <div className="code">Invoke-RestMethod -Uri http://localhost:3301/api/pinterest/boards</div>
          <div className="code">
            Invoke-RestMethod -Method Post -Uri http://localhost:3301/api/pinterest/test-pin
            -ContentType 'application/json' -Body '{}'
          </div>
        </article>
      </section>

      <footer className="site-footer">
        <span>© 2026 Amaterest</span>
        <span>Projet Next.js autonome dans ce dossier</span>
      </footer>
    </main>
  );
}
