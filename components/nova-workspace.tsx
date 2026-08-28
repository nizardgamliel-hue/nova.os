"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus, type UIMessage } from "ai";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Activity, ArrowRight, Bot, Brain, Check, CircleDot, Clock3, Command, Database, Gauge, LockKeyhole, Play, Radar, ShieldCheck, Sparkles, Target, UserRound, Workflow, X, Zap } from "lucide-react";
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput, type ToolPart } from "@/components/ai-elements/tool";
import { Confirmation, ConfirmationAction, ConfirmationActions, ConfirmationRequest, ConfirmationTitle } from "@/components/ai-elements/confirmation";

type BusinessContext = { company: string; sector: string; objectives: string };
type AuditItem = { id: string; at: string; label: string; state: "ok" | "wait" };
type WorkspaceView = "overview" | "command" | "automations";

const initialContext: BusinessContext = { company: "", sector: "", objectives: "" };
const NovaScene = dynamic(() => import("@/components/scene"), { ssr: false });
const agents = [
  ["Executive", "Orchestration", "#8b5cf6"], ["Ventes", "Prospection & CRM", "#ec4899"],
  ["Marketing", "Contenu & campagnes", "#f97316"], ["Finance", "Trésorerie & alertes", "#22c55e"],
  ["Support", "Clients & incidents", "#06b6d4"], ["Opérations", "Process & qualité", "#6366f1"],
];

const welcome: UIMessage = {
  id: "nova-welcome", role: "assistant", parts: [{ type: "text", text: "Bonjour, je suis **NOVA Executive**. Donnez-moi un objectif d’entreprise : je vais le clarifier, mobiliser les bons agents et vous présenter chaque action sensible avant exécution." }],
};

const quickMissions = [
  "Analyse mes priorités et construis mon plan d’action de la semaine",
  "Prépare un système de relance commerciale avec validation humaine",
  "Identifie les données et connecteurs nécessaires pour piloter ma trésorerie",
];

function IntelligenceMap({ onCommand }: { onCommand: (prompt: string) => void }) {
  return <div className="nova-overview-screen">
    <div className="nova-overview-copy"><span className="nova-kicker"><Sparkles /> INTELLIGENCE OPÉRATIONNELLE</span><h1>Votre entreprise.<br/><em>Une seule conscience.</em></h1><p>NOVA transforme chaque intention en missions structurées, mobilise les bons agents et garde les décisions sensibles sous votre contrôle.</p><div className="nova-overview-actions"><button onClick={() => onCommand(quickMissions[0])}><Command /> Donner une mission</button><span><ShieldCheck /> Validation humaine active</span></div></div>
    <div className="nova-brain-map" aria-label="Carte animée des agents NOVA"><div className="nova-map-ring r1"/><div className="nova-map-ring r2"/><div className="nova-map-ring r3"/><div className="nova-map-core"><div className="nova-map-glow"/><strong>N</strong><small>NOVA CORE</small></div>{agents.map(([name, , color], index) => <div className={`nova-map-agent a${index + 1}`} key={name}><i style={{ background: color }}><Bot /></i><span>{name}</span><em /></div>)}</div>
    <div className="nova-real-metrics"><div><Gauge/><span><strong>1</strong><small>modèle actif</small></span></div><div><Bot/><span><strong>6</strong><small>agents disponibles</small></span></div><div><ShieldCheck/><span><strong>100%</strong><small>actions sensibles contrôlées</small></span></div><div><Database/><span><strong>0</strong><small>connecteur autorisé</small></span></div></div>
    <div className="nova-mission-grid"><div className="nova-mission-head"><span>MISSIONS SUGGÉRÉES</span><b>Selon votre contexte</b></div>{quickMissions.map((mission, index) => <button key={mission} onClick={() => onCommand(mission)}><i>0{index + 1}</i><span>{mission}</span><ArrowRight /></button>)}</div>
  </div>;
}

function AutomationsPanel({ onCommand }: { onCommand: (prompt: string) => void }) {
  const flows = [["Brief exécutif hebdomadaire", "Chaque vendredi · 18:00", "Executive"], ["Surveillance des leads", "À chaque nouveau prospect", "Ventes"], ["Alerte trésorerie", "Seuil défini par le dirigeant", "Finance"]];
  return <div className="nova-automation-screen"><div className="nova-section-intro"><span className="nova-kicker"><Workflow/> AUTOMATISATIONS</span><h1>Le travail avance.<br/><em>Même sans relance.</em></h1><p>Ces scénarios sont prêts à être configurés. Ils ne s’exécuteront qu’après connexion des données et validation de leurs permissions.</p></div><div className="nova-flow-list">{flows.map(([name, trigger, agent], index) => <div key={name}><i><Zap/></i><span><small>SCÉNARIO 0{index + 1}</small><strong>{name}</strong><em>{trigger}</em></span><b>{agent}</b><button onClick={() => onCommand(`Configure l’automatisation « ${name} » et liste précisément les connecteurs et permissions nécessaires.`)}><Play/> Configurer</button></div>)}</div><div className="nova-automation-note"><LockKeyhole/><span><strong>Aucune exécution fantôme</strong><small>NOVA attendra les connecteurs et votre validation avant d’activer chaque scénario.</small></span></div></div>;
}

function demoAnswer(input: string): UIMessage {
  return { id: crypto.randomUUID(), role: "assistant", parts: [{ type: "text", text: `### Mission comprise\n\nJ’ai transformé « ${input} » en mission coordonnée.\n\n- **Analyste** : établit les faits et les métriques disponibles.\n- **Agent métier** : prépare le travail et ses livrables.\n- **Executive** : contrôle les incohérences, les risques et les décisions attendues.\n\n### Contrôle humain\n\nAucune action externe n’a été exécutée. Dès qu’un connecteur et l’AI Gateway seront autorisés, toute communication, publication ou modification de données apparaîtra ici pour validation avant exécution.\n\n**Prochaine décision :** renseignez le contexte de l’entreprise à gauche, puis connectez une clé AI Gateway pour passer du mode démonstration au mode opérationnel.` }] };
}

export function NovaWorkspace({ initialView = "overview" }: { initialView?: WorkspaceView }) {
  const [context, setContext] = useState<BusinessContext>(() => {
    if (typeof window === "undefined") return initialContext;
    const saved = localStorage.getItem("nova-business-context");
    if (!saved) return initialContext;
    try { return JSON.parse(saved) as BusinessContext; } catch { return initialContext; }
  });
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const [demoMessages, setDemoMessages] = useState<UIMessage[]>([welcome]);
  const [audit, setAudit] = useState<AuditItem[]>([{ id: "boot", at: "Maintenant", label: "Espace NOVA initialisé", state: "ok" }]);
  const [view, setView] = useState<WorkspaceView>(initialView);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/nova/chat", body: { context } }), [context]);
  const { messages, sendMessage, status, stop, error, addToolApprovalResponse } = useChat({ transport });

  useEffect(() => {
    fetch("/api/nova/status").then((r) => r.json()).then((data) => setConfigured(Boolean(data.configured))).finally(() => setReady(true));
  }, []);

  useEffect(() => { if (ready) localStorage.setItem("nova-business-context", JSON.stringify(context)); }, [context, ready]);

  const visibleMessages = configured ? (messages.length ? messages : [welcome]) : demoMessages;
  const currentStatus: ChatStatus = configured ? status : "ready";

  async function submit(text: string) {
    const value = text.trim(); if (!value) return;
    setAudit((items) => [{ id: crypto.randomUUID(), at: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), label: `Mission reçue : ${value.slice(0, 44)}`, state: "ok" as const }, ...items].slice(0, 8));
    if (configured) { await sendMessage({ text: value }); return; }
    setDemoMessages((items) => [...items, { id: crypto.randomUUID(), role: "user", parts: [{ type: "text", text: value }] }]);
    setTimeout(() => setDemoMessages((items) => [...items, demoAnswer(value)]), 550);
  }

  function launchCommand(prompt: string) { setView("command"); void submit(prompt); }

  function approve(id: string, approved: boolean) {
    addToolApprovalResponse({ id, approved });
    setAudit((items) => [{ id: crypto.randomUUID(), at: "Maintenant", label: approved ? "Action sensible approuvée" : "Action sensible refusée", state: "ok" }, ...items]);
  }

  return <div className="nova-os">
    <header className="nova-topbar">
      <Link className="nova-os-brand" href="/"><i className="nova-live-orb"><NovaScene /></i><span>NOVA</span><small>OPERATING SYSTEM</small></Link>
      <nav className="nova-workspace-nav" aria-label="Navigation du centre de commande"><button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><Radar/> Vue globale</button><button className={view === "command" ? "active" : ""} onClick={() => setView("command")}><Command/> Commander</button><button className={view === "automations" ? "active" : ""} onClick={() => setView("automations")}><Workflow/> Automatiser</button></nav>
      <div className={`nova-mode ${configured ? "live" : "demo"}`}><CircleDot />{configured ? "IA connectée" : "Mode démonstration"}</div>
      <div className="nova-top-actions"><span><ShieldCheck /> Contrôle humain actif</span><button aria-label="Compte"><UserRound /></button></div>
    </header>

    <aside className="nova-sidebar">
      <div className="nova-side-title"><span>ÉQUIPE D’AGENTS</span><b>{agents.length} actifs</b></div>
      <div className="nova-agent-list">{agents.map(([name, role, color], index) => <div className={index === 0 ? "active" : ""} key={name}>
        <i style={{ background: color }}><Bot /></i><span><strong>{name}</strong><small>{role}</small></span><em />
      </div>)}</div>
      <div className="nova-memory">
        <div className="nova-side-title"><span><Brain /> MÉMOIRE ENTREPRISE</span><b>locale</b></div>
        <label>Entreprise<input value={context.company} onChange={(e) => setContext({ ...context, company: e.target.value })} placeholder="Nom de l’entreprise" /></label>
        <label>Secteur<input value={context.sector} onChange={(e) => setContext({ ...context, sector: e.target.value })} placeholder="Ex. restauration" /></label>
        <label>Objectifs<textarea value={context.objectives} onChange={(e) => setContext({ ...context, objectives: e.target.value })} placeholder="Priorités, règles, contexte…" rows={3} /></label>
        <small><LockKeyhole /> Stockée sur cet appareil. La mémoire cloud sera activée avec la base sécurisée.</small>
      </div>
    </aside>

    <section className={`nova-chat view-${view}`}>
      <div className="nova-chat-head"><div><Command /><span><strong>Canal Executive</strong><small>NOVA orchestre toute l’équipe depuis cette conversation</small></span></div><span><Sparkles /> Modèle : Laguna S 2.1</span></div>
      {view === "overview" ? <IntelligenceMap onCommand={launchCommand} /> : null}
      {view === "automations" ? <AutomationsPanel onCommand={launchCommand} /> : null}
      {view === "command" ? <><Conversation className="nova-conversation"><ConversationContent>
        {visibleMessages.map((message) => <Message from={message.role} key={message.id}>
          <MessageContent>{message.parts.map((part, index) => {
            if (part.type === "text") return <MessageResponse key={index}>{part.text}</MessageResponse>;
            if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
              const toolPart = part as ToolPart;
              const toolName = part.type === "dynamic-tool" ? (toolPart as ToolPart & { toolName: string }).toolName : undefined;
              return <Tool defaultOpen key={index}><ToolHeader type={toolPart.type as never} state={toolPart.state} {...(toolName ? { toolName } : {})} />
                <ToolContent><ToolInput input={toolPart.input} />
                  {toolPart.approval && <Confirmation approval={toolPart.approval} state={toolPart.state}><ConfirmationRequest><ConfirmationTitle>NOVA demande votre validation avant cette action externe.</ConfirmationTitle><ConfirmationActions><ConfirmationAction variant="outline" onClick={() => approve(toolPart.approval!.id, false)}><X /> Refuser</ConfirmationAction><ConfirmationAction onClick={() => approve(toolPart.approval!.id, true)}><Check /> Autoriser</ConfirmationAction></ConfirmationActions></ConfirmationRequest></Confirmation>}
                  <ToolOutput output={toolPart.output} errorText={toolPart.errorText} /></ToolContent></Tool>;
            }
            return null;
          })}</MessageContent>
        </Message>)}
        {error && <div className="nova-error">Connexion IA indisponible : {error.message}</div>}
      </ConversationContent><ConversationScrollButton /></Conversation>
      <div className="nova-composer"><PromptInput onSubmit={({ text }) => submit(text)}>
        <PromptInputBody><PromptInputTextarea placeholder="Demandez un résultat à NOVA…" /></PromptInputBody>
        <PromptInputFooter><span>{configured ? "Les actions sensibles exigent votre accord" : "Démo locale — aucune action externe"}</span><PromptInputSubmit status={currentStatus} onStop={stop} /></PromptInputFooter>
      </PromptInput><p>Entrée pour envoyer · NOVA distingue toujours faits, hypothèses et actions proposées.</p></div></> : null}
    </section>

    <aside className="nova-activity">
      <div className="nova-panel"><div className="nova-panel-head"><span><Clock3 /> ACTIVITÉ</span><b>Temps réel</b></div>{audit.map((item) => <div className="nova-audit" key={item.id}><i><Check /></i><span><strong>{item.label}</strong><small>{item.at}</small></span></div>)}</div>
      <div className="nova-panel"><div className="nova-panel-head"><span><Database /> CONNEXIONS</span><b>0 connecté</b></div><div className="nova-empty"><LockKeyhole /><strong>Connecteurs verrouillés</strong><p>OAuth et secrets seront demandés service par service, avec le minimum de permissions.</p></div></div>
      <div className="nova-security"><ShieldCheck /><span><strong>Garde-fous actifs</strong><small>Validation humaine · origine contrôlée · limitation de débit · journalisation locale</small></span></div>
    </aside>
  </div>;
}
