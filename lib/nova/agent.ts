import { ToolLoopAgent, isStepCount, tool } from "ai";
import { z } from "zod";

const agentResult = z.object({
  agent: z.enum(["sales", "marketing", "finance", "support", "operations", "analyst", "executive"]),
  objective: z.string().min(3).max(500),
  expectedOutcome: z.string().min(3).max(500),
});

export const novaAgent = new ToolLoopAgent({
  model: process.env.NOVA_MODEL ?? "poolside/laguna-s-2.1-free",
  instructions: `Tu es NOVA Executive, la couche d'orchestration d'une entreprise.
Tu réponds toujours en français, avec clarté, brièveté et sens opérationnel.
Tu transformes une demande en plan, délègues aux agents adaptés, consolides les résultats et distingues strictement : faits disponibles, hypothèses et actions proposées.
Tu ne prétends jamais avoir exécuté une action externe si aucun connecteur ne l'a réellement confirmée.
Toute communication externe, publication, modification de données, opération financière, suppression ou action sensible nécessite une validation humaine.
Utilise les outils pour structurer le travail. Termine par : résultat, décisions attendues, prochaines actions et risques éventuels.`,
  stopWhen: isStepCount(8),
  tools: {
    readBusinessMemory: tool({
      description: "Lire le contexte d'entreprise fourni pour cette conversation.",
      inputSchema: z.object({ topic: z.string().min(1).max(120) }),
      execute: async ({ topic }) => ({
        topic,
        status: "context-requested",
        note: "Le contexte autorisé de la session doit être utilisé. Ne pas inventer de donnée absente.",
      }),
    }),
    delegateToAgent: tool({
      description: "Déléguer une mission structurée à un agent métier NOVA.",
      inputSchema: agentResult,
      execute: async (mission) => ({
        status: "delegated",
        missionId: crypto.randomUUID(),
        ...mission,
      }),
    }),
    analyzeBusinessData: tool({
      description: "Préparer une analyse métier à partir des données explicitement présentes dans la conversation.",
      inputSchema: z.object({
        question: z.string().min(3).max(500),
        metrics: z.array(z.string().max(100)).max(12),
      }),
      execute: async ({ question, metrics }) => ({
        status: "analysis-prepared",
        question,
        metrics,
        limitation: "Aucune donnée externe n'a été consultée sans connecteur configuré.",
      }),
    }),
    prepareExternalAction: tool({
      description: "Préparer une action externe sensible. Son exécution exige toujours l'approbation explicite de l'utilisateur.",
      inputSchema: z.object({
        actionType: z.enum(["send-email", "send-message", "publish-content", "update-crm", "create-invoice", "schedule-event"]),
        destination: z.string().min(1).max(200),
        summary: z.string().min(3).max(1000),
        reversible: z.boolean(),
      }),
      execute: async (action) => ({
        status: "approved-draft",
        actionId: crypto.randomUUID(),
        ...action,
        executed: false,
        note: "Action préparée. Un connecteur autorisé doit confirmer l'exécution réelle.",
      }),
    }),
  },
  toolApproval: {
    prepareExternalAction: "user-approval",
  },
});

export type NovaAgent = typeof novaAgent;
