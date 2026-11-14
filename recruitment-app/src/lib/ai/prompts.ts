import type { FactView, RoleDetail } from "@/lib/repo";
import type { ReadingInput } from "./reading-types";

export const NEMOTRON_SYSTEM = "You are a constrained extraction function inside a prototype recruitment app. You must return only a single valid JSON object, with no markdown fences, no commentary, and no extra keys.";

export function extractionMessages(text: string) {
  return [
    {
      role: "system" as const,
      content:
        NEMOTRON_SYSTEM +
        " Extract only highlights that are literally supported by the supplied answer. For every highlight return: skill (short label), claim (a concise first-person claim, 8-400 chars), evidenceUrl (ONLY a URL that appears verbatim in the supplied answer, otherwise null), and sourceQuote (an exact substring of the supplied answer). Never invent a URL, an employer, a metric, or a technology. Never add a provenance field. Return 1-4 highlights. Schema: {\"highlights\":[{\"skill\":string,\"claim\":string,\"evidenceUrl\":string|null,\"sourceQuote\":string}]}.",
    },
    {
      role: "user" as const,
      content: "Answer to extract from:\n<<<\n" + text.slice(0, 1600) + "\n>>>",
    },
  ];
}

export function tailoringMessages(candidateName: string, facts: FactView[], role: RoleDetail) {
  const factPayload = facts.slice(0, 6).map((fact) => ({
    id: fact.id,
    prompt: fact.prompt,
    claim: fact.claim,
    skills: fact.skillTags,
  }));
  const rolePayload = {
    employer: role.employer.name,
    title: role.title,
    summary: role.summary,
    problemNow: role.problemNow,
    skills: role.skills,
  };
  return [
    {
      role: "system" as const,
      content:
        NEMOTRON_SYSTEM +
        " You are helping a candidate tailor a factual master record for one employer. You may ONLY foreground, reorder, and reword the supplied facts. Do not invent experience, skills, metrics, links, employers, or evidence. Do not include or change provenance. Every suggestion must include sourceFactIds with one or more IDs from the supplied facts and a short rationale. proposedText may add framing words for the role but must not add any new factual claim and must not contain a URL unless that URL is in the source facts. Return 1-5 suggestions. Schema: {\"suggestions\":[{\"kind\":\"FOREGROUND\"|\"REWORD\",\"sourceFactIds\":[string],\"proposedText\":string,\"rationale\":string}]}.",
    },
    {
      role: "user" as const,
      content:
        "Candidate: " +
        candidateName +
        "\nRole: " +
        JSON.stringify(rolePayload) +
        "\nMaster record facts: " +
        JSON.stringify(factPayload),
    },
  ];
}

export function feedParseMessages(text: string) {
  return [
    {
      role: "system" as const,
      content:
        "You turn a recruiter's discovery preference into a small set of explicit criteria for a recruitment prototype. Return only a single valid JSON object: {\"criteria\":[{\"kind\":\"SKILL\"|\"EXPERIENCE\"|\"DOMAIN\",\"value\":string,\"years\":number?}],\"rejected\":[{\"text\":string,\"reason\":string}],\"unparsed\":[string]}. Never infer or encode protected characteristics or proxies: age, gender, ethnicity, nationality or native-speaker status, disability or health, religion, family or marital status, sexual orientation, or age proxies such as young, recent graduate, senior or energetic. If the request contains one, omit that clause and return it in rejected with one plain sentence explaining that it is protected and that the rest still applies. Do not turn a skill into a domain or an unsupported duration. Experience criteria must come from an explicit duration in the text; keep the skill value when known. There is no candidate data in this request. Schema only.",
    },
    {
      role: "user" as const,
      content: "Recruiter preference:\n<<<\n" + text.slice(0, 400) + "\n>>>",
    },
  ];
}

export function readingMessages(input: ReadingInput) {
  const requirements = input.requirements.map((requirement) => ({
    id: requirement.id,
    kind: requirement.kind,
    label: requirement.label,
    status: requirement.status,
    detail: requirement.detail,
    factIds: requirement.factIds,
    requiredScore: requirement.requiredScore,
    recordedScore: requirement.recordedScore,
  }));

  const system = [
    "You are a constrained evidence-reading function inside a prototype recruitment app.",
    "You receive one role's stated requirements and one candidate's self-claimed facts plus recorded assessment results.",
    "You do not decide, rank, score, recommend, reject or hire. A human decides.",
    "The app has already computed each requirement's status. Never change, contradict or reinterpret those statuses.",
    "Return one valid JSON object only, with no markdown fences, commentary or extra keys.",
    "Rules:",
    "1. Every requirement id must appear exactly once, in covered or gaps.",
    '2. covered is allowed only for status "met" or "related". Use gaps for "not_met", "unknown" or "uncertain".',
    "3. Cite only fact ids from the supplied facts. A covered signal must cite at least one fact id. A covered assessment may cite none.",
    "4. A quote must be an exact substring of one of the cited claims. Omit the quote when there is none.",
    "5. Do not mention the candidate's name, location, age, gender, nationality, ethnicity, disability, health, religion, family or marital status, sexual orientation, or any proxy. Do not infer traits.",
    "6. Do not add employers, dates, metrics, URLs or experience that are not in the facts.",
    "7. Do not use ranking or decision language: best, top, rank, percentage, suitability, strong fit, should hire, recommend, auto-reject.",
    "8. summary is 2-3 short sentences. notes are at most 280 characters. Ask 2-3 concrete questions for the human conversation. Add at most 2 short caveats.",
    'Shape: {"summary":string,"covered":[{"requirementId":string,"note":string,"factIds":string[],"quote":string|null}],"gaps":[{"requirementId":string,"note":string}],"questions":string[],"caveats":string[]}',
    'The deterministic statuses are fixed. A reading explains the evidence; it does not decide.',
  ].join(" ");

  return [
    {
      role: "system" as const,
      content: system,
    },
    {
      role: "user" as const,
      content:
        "Role: " +
        JSON.stringify({
          title: input.role.title,
          summary: input.role.summary,
          problemNow: input.role.problemNow,
          first90: input.role.first90,
          skills: input.role.skills,
        }) +
        "\nRequirements: " +
        JSON.stringify(requirements) +
        "\nFacts: " +
        JSON.stringify(input.facts),
    },
  ];
}

export function askMessages(candidateName: string, facts: FactView[], question: string) {
  const payload = facts.slice(0, 8).map((fact) => ({
    id: fact.id,
    prompt: fact.prompt,
    claim: fact.claim,
    skills: fact.skillTags,
    hasEvidenceLink: Boolean(fact.evidenceUrl),
  }));
  return [
    {
      role: "system" as const,
      content:
        "You answer questions about a fictional candidate profile in a recruitment prototype. Use ONLY the supplied facts. Do not infer employment history, protected traits, personality, or performance. Do not claim that a link being reachable means a claim is true. If the answer is not in the facts, say clearly that it is not in the record and return an empty sourceFactIds. Return only a single JSON object: {\"answer\":string,\"sourceFactIds\":[string]}. Answer in 1-3 sentences and cite every fact you use.",
    },
    {
      role: "user" as const,
      content:
        "Candidate: " +
        candidateName +
        "\nFacts: " +
        JSON.stringify(payload) +
        "\nQuestion: " +
        question.slice(0, 300),
    },
  ];
}
