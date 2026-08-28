import Link from "next/link";
export default function NotFound() { return <section className="error-page"><span className="eyebrow">Erreur 404</span><h1>Cette orbite n’existe pas.</h1><p>Revenez au centre de l’écosystème NOVA.</p><Link className="button primary" href="/">Retour à l’accueil</Link></section>; }
