import type { Metadata } from "next";
import "./nova.css";
import "./globals.css";
import { Navbar, Footer } from "@/components/chrome";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./auth.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nova.ai"),
  title: { default: "NOVA — L’intelligence qui exécute", template: "%s — NOVA" },
  description: "NOVA transforme vos demandes en actions exécutées par des agents IA spécialisés, sous votre contrôle.",
  keywords: ["automatisation entreprise IA", "agents IA entreprise", "automatisation PME", "assistant IA entreprise", "automatisation WhatsApp"],
  openGraph: { title: "NOVA — Un vocal. Toute votre entreprise s’exécute.", description: "Une seule intelligence pour coordonner le travail numérique de votre entreprise.", type: "website", locale: "fr_FR" },
  twitter: { card: "summary_large_image", title: "NOVA", description: "Parlez à Nova. Nova s’occupe du reste." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body><TooltipProvider><Navbar /><main>{children}</main><Footer /></TooltipProvider></body>
    </html>
  );
}
