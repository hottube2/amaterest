import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">A</span>
          <span>Amaterest</span>
        </div>
        <nav className="nav" aria-label="Navigation">
          <Link href="/">Accueil</Link>
        </nav>
      </header>

      <section className="copy">
        <h1>Politique de confidentialité</h1>
        <p>Dernière mise à jour : 19 avril 2026</p>

        <p>
          Amaterest est un projet de publication Pinterest et d’organisation maison. Cette version
          du site sert aussi de surface de test pour les intégrations Pinterest et Amazon.
        </p>

        <h2>Données collectées</h2>
        <p>
          Aucun compte utilisateur n’est créé ici. Si un contact est envoyé par e-mail, seules les
          données transmises dans le message sont utilisées pour répondre.
        </p>

        <h2>Liens affiliés</h2>
        <p>
          Certains liens peuvent pointer vers Amazon ou d’autres sites marchands. Une commission
          peut être reçue en cas d’achat, sans coût supplémentaire pour l’utilisateur.
        </p>

        <h2>Services tiers</h2>
        <p>
          Pinterest, Amazon et d’autres services peuvent appliquer leurs propres politiques de
          confidentialité lorsque des liens externes sont utilisés.
        </p>

        <h2>Contact</h2>
        <p>
          Pour toute question, écrire à <a href="mailto:hello@amaterest.com">hello@amaterest.com</a>.
        </p>
      </section>

      <footer className="site-footer">
        <span>© 2026 Amaterest</span>
        <Link href="/">Retour à l’accueil</Link>
      </footer>
    </main>
  );
}
