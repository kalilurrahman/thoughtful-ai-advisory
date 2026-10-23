import { useContext, useReducer, useState, useEffect, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { loadWorkspace } from "./workspace.functions";
import { GovernanceContext as Context } from "./context";
import type { GovernanceDecision } from "./decision-schema";
import type { ChangeReview, ChangeStatus } from "./change-schema";
import { transitionChangeReview } from "./change-review-model";
import type { MonitoringObservation, MonitoringPlan } from "./monitoring-schema";
import type { CorrectiveAction } from "./actions-schema";
import { transitionCorrectiveAction } from "./actions-model";
import {
  PHASES,
  SYSTEMS,
  type Control,
  type System as InventorySystem,
  type Tier,
} from "@/data/governance";
import type { RiskTierResult } from "@/features/site/engines/risk-tier";
export type System = InventorySystem & {
  riskTriage?:
    | {
        profile: Record<string, string | boolean | string[]>;
        result: RiskTierResult;
        assessedAt: string;
      }
    | undefined;
};
import {
  answerAt,
  defaultAnswers,
  defaultGuardrails,
  gapPhase,
  pillarScores,
  indexScore,
  maturityBand,
  gateStatus,
  blockingControls,
  guardrailCoverage,
  type Answer,
  type Answers,
} from "./model";
export type RoadmapItem = {
  key: string;
  phase: number;
  title: string;
  owner: string;
  effort: string;
  tag: string;
  done: boolean;
};
export type AIIncident = {
  id: string;
  title: string;
  system: string;
  severity: "Critical" | "High" | "Moderate" | "Low";
  category: string;
  status: "Open" | "Triage" | "Contained" | "Resolved" | "Closed";
  detectedAt: string;
  owner: string;
  summary: string;
  response: string;
  statusHistory: { status: AIIncident["status"]; changedAt: string }[];
};
export type GovernanceState = {
  workspaceMode?: "sample" | "personal";
  answers: Answers;
  gr: Record<string, boolean>;
  tier: Tier;
  systems: System[];
  incidents: AIIncident[];
  decisions: GovernanceDecision[];
  changeReviews: ChangeReview[];
  monitoringPlans: MonitoringPlan[];
  correctiveActions: CorrectiveAction[];
  roadmap: RoadmapItem[];
  qi: number;
};
export const initialState = (): GovernanceState => ({
  workspaceMode: "sample",
  answers: defaultAnswers(),
  gr: defaultGuardrails(),
  tier: "High",
  systems: SYSTEMS.map((s) => ({ ...s })),
  incidents: [],
  decisions: [],
  changeReviews: [],
  monitoringPlans: [],
  correctiveActions: [],
  roadmap: PHASES.flatMap((p, phase) =>
    p.items.map((it, i) => ({ ...it, key: phase + "." + i, phase })),
  ),
  qi: 0,
});
export function blankState(): GovernanceState {
  const sample = initialState();
  return {
    ...sample,
    workspaceMode: "personal",
    answers: Object.fromEntries(Object.keys(sample.answers).map((id) => [id, { s: 0, e: 0 }])),
    gr: Object.fromEntries(Object.keys(sample.gr).map((id) => [id, false])),
    systems: [],
    roadmap: [],
  };
}
export type Action =
  | { type: "answer"; id: string; patch: Partial<Answer> }
  | { type: "guardrail"; name: string }
  | { type: "tier"; tier: Tier }
  | { type: "question"; qi: number }
  | { type: "system"; system: System }
  | { type: "update-system"; index: number; system: System }
  | { type: "incident"; incident: AIIncident }
  | { type: "update-incident"; incident: AIIncident; changedAt: string }
  | { type: "edit-incident"; incident: AIIncident }
  | { type: "decision"; decision: GovernanceDecision; supersededAt: string }
  | { type: "change-review"; review: ChangeReview }
  | {
      type: "transition-change-review";
      id: string;
      status: ChangeStatus;
      actor: string;
      note: string;
      changedAt: string;
    }
  | { type: "monitor-plan"; plan: MonitoringPlan }
  | { type: "monitor-observation"; id: string; observation: MonitoringObservation; nextDue: string }
  | { type: "monitor-status"; id: string; status: "Active" | "Paused" }
  | { type: "corrective-action"; action: CorrectiveAction }
  | { type: "edit-corrective-evidence"; id: string; evidence: string }
  | {
      type: "transition-corrective-action";
      id: string;
      status: CorrectiveAction["status"];
      actor: string;
      note: string;
      changedAt: string;
    }
  | { type: "roadmap"; control: Control }
  | { type: "done"; key: string }
  | { type: "load"; state: GovernanceState };
export function reducer(s: GovernanceState, a: Action): GovernanceState {
  switch (a.type) {
    case "answer":
      return {
        ...s,
        answers: { ...s.answers, [a.id]: { ...answerAt(s.answers, a.id), ...a.patch } },
      };
    case "guardrail":
      return { ...s, gr: { ...s.gr, [a.name]: !s.gr[a.name] } };
    case "tier":
      return { ...s, tier: a.tier };
    case "question":
      return { ...s, qi: Math.max(0, Math.min(11, a.qi)) };
    case "system":
      return { ...s, systems: [...s.systems, a.system] };
    case "update-system":
      return {
        ...s,
        systems: s.systems.map((system, index) => (index === a.index ? a.system : system)),
      };
    case "incident":
      return { ...s, incidents: [a.incident, ...s.incidents] };
    case "update-incident":
      return {
        ...s,
        incidents: s.incidents.map((incident) => {
          if (incident.id !== a.incident.id || incident.status === a.incident.status)
            return incident;
          return {
            ...incident,
            status: a.incident.status,
            statusHistory: [
              ...incident.statusHistory,
              { status: a.incident.status, changedAt: a.changedAt },
            ],
          };
        }),
      };
    case "edit-incident":
      return {
        ...s,
        incidents: s.incidents.map((incident) =>
          incident.id === a.incident.id
            ? {
                ...incident,
                owner: a.incident.owner,
                response: a.incident.response,
              }
            : incident,
        ),
      };
    case "decision":
      return {
        ...s,
        decisions: [
          a.decision,
          ...s.decisions.map((decision) =>
            decision.system === a.decision.system && decision.lifecycle === "Current"
              ? {
                  ...decision,
                  lifecycle: "Superseded" as const,
                  history: [
                    ...decision.history,
                    { action: "Superseded" as const, changedAt: a.supersededAt },
                  ],
                }
              : decision,
          ),
        ],
      };
    case "change-review":
      return { ...s, changeReviews: [a.review, ...s.changeReviews] };
    case "transition-change-review": {
      const review = s.changeReviews.find((item) => item.id === a.id);
      if (!review) return s;
      const result = transitionChangeReview(review, a.status, a.actor, a.note, a.changedAt);
      const updatedReview = result.review;
      return updatedReview
        ? {
            ...s,
            changeReviews: s.changeReviews.map((item) => (item.id === a.id ? updatedReview : item)),
          }
        : s;
    }
    case "monitor-plan":
      return { ...s, monitoringPlans: [a.plan, ...s.monitoringPlans] };
    case "monitor-observation":
      return {
        ...s,
        monitoringPlans: s.monitoringPlans.map((plan) =>
          plan.id === a.id
            ? { ...plan, nextDue: a.nextDue, observations: [...plan.observations, a.observation] }
            : plan,
        ),
      };
    case "monitor-status":
      return {
        ...s,
        monitoringPlans: s.monitoringPlans.map((plan) =>
          plan.id === a.id ? { ...plan, status: a.status } : plan,
        ),
      };
    case "corrective-action":
      return { ...s, correctiveActions: [a.action, ...s.correctiveActions] };
    case "edit-corrective-evidence":
      return {
        ...s,
        correctiveActions: s.correctiveActions.map((item) =>
          item.id === a.id ? { ...item, completionEvidence: a.evidence.trim() } : item,
        ),
      };
    case "transition-corrective-action": {
      const action = s.correctiveActions.find((item) => item.id === a.id);
      if (!action) return s;
      const result = transitionCorrectiveAction(action, a.status, a.actor, a.note, a.changedAt);
      const updatedAction = result.action;
      return updatedAction
        ? {
            ...s,
            correctiveActions: s.correctiveActions.map((item) =>
              item.id === a.id ? updatedAction : item,
            ),
          }
        : s;
    }
    case "roadmap":
      return s.roadmap.some((i) => i.key === "gap-" + a.control.id)
        ? s
        : {
            ...s,
            roadmap: [
              ...s.roadmap,
              {
                key: "gap-" + a.control.id,
                phase: gapPhase(a.control),
                title: a.control.text.replace(/^(Is there|Are|Is|Does|Do) /, "").replace(/\?$/, ""),
                owner: a.control.owner,
                effort: a.control.effort,
                tag: a.control.id[0] + " · from gap",
                done: false,
              },
            ],
          };
    case "done":
      return {
        ...s,
        roadmap: s.roadmap.map((i) => (i.key === a.key ? { ...i, done: !i.done } : i)),
      };
    case "load":
      return a.state;
  }
}
export function GovernanceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [userId, setUserId] = useState<string | null>(null),
    [workspaceId, setId] = useState<string | null>(null),
    [workspaceName, setName] = useState("Acme Health");
  const load = useServerFn(loadWorkspace);
  useEffect(() => {
    let active = true;
    let current: string | null = null;
    async function apply(id: string | null) {
      if (!active) return;
      setUserId(id);
      if (current === id) return;
      current = id;
      setId(null);
      setName(id ? "My organization" : "Acme Health");
      dispatch({ type: "load", state: id ? blankState() : initialState() });
      if (id) {
        try {
          const result = await load();
          if (active && current === id && result) {
            dispatch({ type: "load", state: result.state });
            setId(result.id);
            setName(result.name);
          }
        } catch {
          /* Explicit restore control allows retry without losing demo access. */
        }
      }
    }
    supabase.auth
      .getUser()
      .then(({ data }) => apply(data.user?.id ?? null))
      .catch(() => apply(null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED")
        queueMicrotask(() => apply(session?.user.id ?? null));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [load]);
  return (
    <Context.Provider
      value={{
        state,
        dispatch,
        userId,
        workspaceId,
        workspaceName,
        setWorkspace: (id, name) => {
          setId(id);
          setName(name);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useGovernance() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("Governance provider missing");
  const scores = pillarScores(ctx.state.answers);
  return {
    ...ctx,
    scores,
    index: indexScore(scores),
    band: maturityBand(indexScore(scores)),
    gate: gateStatus(scores, ctx.state.tier),
    blocking: blockingControls(ctx.state.answers),
    coverage: guardrailCoverage(ctx.state.gr, ctx.state.tier),
  };
}
