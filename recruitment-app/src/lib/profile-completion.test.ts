import { describe, expect, it } from "vitest";
import { profileCompletion } from "./profile-completion";

describe("profile completion", () => {
  it("is a checklist, not a score", () => {
    const completion = profileCompletion({
      headline: "Backend engineer",
      bio: "I make services boring.",
      interests: ["Backend"],
      availability: "From January",
      facts: [{ meta: { module: "ROLE" } }, { meta: { module: "PROJECT" } }],
    });
    expect(completion).toEqual({ complete: true, completed: 6, total: 6, missing: [] });
  });

  it("names the missing pieces without ranking the person", () => {
    const completion = profileCompletion({
      headline: "",
      bio: "",
      interests: [],
      availability: "",
      facts: [],
    });
    expect(completion.complete).toBe(false);
    expect(completion.completed).toBe(0);
    expect(completion.missing).toHaveLength(6);
  });
});
