export type OutcomeKind = "NOT_SELECTED" | "ROLE_CLOSED" | "AFTER_CONVERSATION";

export interface OutcomeContext {
  roleTitle: string;
  employerName: string;
}

export interface OutcomeTemplate {
  kind: OutcomeKind;
  message: string;
}

/**
 * Wording is derived from the real state, never from a free-text field.
 * "After your conversation" is only available for a match that actually
 * existed. A pass or a role close never claims a review that did not happen.
 */
export function outcomeForPass(context: OutcomeContext): OutcomeTemplate {
  return {
    kind: "NOT_SELECTED",
    message:
      "Thanks for your interest in " +
      context.roleTitle +
      " at " +
      context.employerName +
      ". The team is not taking this further at this stage. Nothing about this closes other roles at the event.",
  };
}

export function outcomeForRoleClose(context: OutcomeContext): OutcomeTemplate {
  return {
    kind: "ROLE_CLOSED",
    message:
      context.roleTitle +
      " at " +
      context.employerName +
      " has closed for this cycle. Your interest was recorded, but the team is not progressing it.",
  };
}

export function outcomeForConversation(context: OutcomeContext): OutcomeTemplate {
  return {
    kind: "AFTER_CONVERSATION",
    message:
      "After your conversation with " +
      context.employerName +
      " about " +
      context.roleTitle +
      ", the team has decided not to move forward. Thanks for the time you gave them.",
  };
}

export function outcomeForKind(kind: OutcomeKind, context: OutcomeContext): OutcomeTemplate {
  if (kind === "AFTER_CONVERSATION") return outcomeForConversation(context);
  if (kind === "ROLE_CLOSED") return outcomeForRoleClose(context);
  return outcomeForPass(context);
}
