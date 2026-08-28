import { BarChart3, Bot, BriefcaseBusiness, Headphones, Megaphone, Settings2, ShoppingBag, Users, WalletCards } from "lucide-react";
export const agents = [
  ["Nova Sales","Prospection, qualification, CRM et relances.",BriefcaseBusiness],["Nova Marketing","Campagnes, contenus, réseaux sociaux et mesure.",Megaphone],["Nova Support","Réponses, tickets et escalades humaines.",Headphones],["Nova Finance","Factures, suivi et reporting financier.",WalletCards],["Nova HR","Recrutement, onboarding et administration.",Users],["Nova Operations","Processus, fournisseurs et opérations récurrentes.",Settings2],["Nova Analyst","Données, KPI et synthèses décisionnelles.",BarChart3],["Nova Executive","Coordination des agents et résumés de direction.",Bot],
] as const;
export const categories = [["Sales",BriefcaseBusiness],["Marketing",Megaphone],["Finance",WalletCards],["Support",Headphones],["RH",Users],["Opérations",Settings2],["E-commerce",ShoppingBag],["Analytics",BarChart3]] as const;
