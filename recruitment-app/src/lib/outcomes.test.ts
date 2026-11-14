import { describe, expect, it } from "vitest";
import { outcomeForConversation, outcomeForKind, outcomeForPass, outcomeForRoleClose } from "./outcomes";

const context = { roleTitle: "Backend Engineer", employerName: "Saari Systems" };

describe("outcome wording", () => {
  it("does not claim a review for a pass", () => {
    const outcome = outcomeForPass(context);
    expect(outcome.kind).toBe("NOT_SELECTED");
    expect(outcome.message).toContain("not taking this further");
    expect(outcome.message.toLowerCase()).not.toContain("reviewed");
    expect(outcome.message.toLowerCase()).not.toContain("after your conversation");
  });

  it("does not claim a review for a role close", () => {
    const outcome = outcomeForRoleClose(context);
    expect(outcome.kind).toBe("ROLE_CLOSED");
    expect(outcome.message).toContain("closed for this cycle");
    expect(outcome.message.toLowerCase()).not.toContain("reviewed");
  });

  it("uses after-conversation wording only for a closed match", () => {
    const outcome = outcomeForConversation(context);
    expect(outcome.kind).toBe("AFTER_CONVERSATION");
    expect(outcome.message).toContain("After your conversation");
    expect(outcomeForKind("AFTER_CONVERSATION", context)).toEqual(outcome);
  });

  it("never fabricates a reviewed claim through the generic selector", () => {
    expect(outcomeForKind("NOT_SELECTED", context).message.toLowerCase()).not.toContain("reviewed");
    expect(outcomeForKind("ROLE_CLOSED", context).message.toLowerCase()).not.toContain("reviewed");
  });
});
