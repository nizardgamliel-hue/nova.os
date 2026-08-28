"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";

const links = [
  ["Produit", "/#produit"], ["Automatisations", "/automatisations"], ["Intégrations", "/integrations"],
  ["Sécurité", "/securite"], ["Tarifs", "/tarifs"], ["Ressources", "/ressources"], ["Entreprise", "/a-propos"],
];

export function Navbar() {
  const [open, setOpen] = useState(false); const path = usePathname();
  return <header className="nav-wrap"><nav className="nav shell" aria-label="Navigation principale">
    <Link className="brand" href="/" aria-label="NOVA, accueil"><i className="nova-mark"><span/><span/></i>NOVA</Link>
    <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Ouvrir le menu">{open ? <X /> : <Menu />}</button>
    <div className={`nav-links ${open ? "open" : ""}`}>
      {links.map(([label, href]) => <Link key={href} className={path === href ? "active" : ""} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
      <div className="mobile-actions"><Link href="/app">Ouvrir NOVA</Link><Link className="button primary small" href="/app">Commencer avec Nova</Link></div>
    </div>
    <div className="nav-actions"><Link href="/app">Ouvrir NOVA</Link><Link className="button primary small" href="/app">Commencer avec Nova</Link></div>
  </nav></header>;
}

export function Footer() {
  const groups = [
    ["Produit", [["Automatisations", "/automatisations"], ["Agents IA", "/#agents"], ["Intégrations", "/integrations"], ["Tarifs", "/tarifs"]]],
    ["Entreprise", [["À propos", "/a-propos"], ["Sécurité", "/securite"], ["Investisseurs", "/investisseurs"], ["Affiliation", "/affiliation"]]],
    ["Ressources", [["Documentation", "/ressources#documentation"], ["Blog", "/ressources#blog"], ["Centre d’aide", "/ressources#aide"], ["API", "/ressources#api"]]],
    ["Légal", [["Confidentialité", "/ressources#confidentialite"], ["CGU", "/ressources#cgu"], ["Cookies", "/ressources#cookies"], ["Mentions légales", "/ressources#mentions"]]],
  ];
  return <footer><div className="shell footer-grid"><div className="footer-lead"><Link className="brand" href="/"><i className="nova-mark"><span/><span/></i>NOVA</Link><p>L’intelligence qui transforme vos intentions en actions.</p><a className="footer-mail" href="mailto:bonjour@nova.ai">bonjour@nova.ai <ArrowUpRight size={15}/></a></div>{groups.map(([title, items]) => <div className="footer-col" key={title as string}><strong>{title as string}</strong>{(items as string[][]).map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>)}</div><div className="shell footer-bottom"><span>© 2026 NOVA. Tous droits réservés.</span><span>Paris · France</span><button aria-label="Langue">FR <span>/ EN</span></button></div></footer>;
}
