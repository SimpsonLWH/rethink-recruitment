import type { FactView, RoleDetail } from "@/lib/repo";

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
