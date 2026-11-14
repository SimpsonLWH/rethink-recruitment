import { z } from "zod";

export const highlightSchema = z.object({
  skill: z.string().trim().min(1).max(60),
  claim: z.string().trim().min(8).max(500),
  evidenceUrl: z.union([z.string().trim().url(), z.null()]).optional(),
  sourceQuote: z.string().trim().min(4).max(800),
});

export const highlightResponseSchema = z.object({
  highlights: z.array(highlightSchema).min(1).max(5),
});

export type Highlight = z.infer<typeof highlightSchema>;

export const tailoringSuggestionSchema = z.object({
  kind: z.enum(["FOREGROUND", "REWORD"]),
  sourceFactIds: z.array(z.string().trim().min(1)).min(1).max(4),
  proposedText: z.string().trim().min(1).max(500),
  rationale: z.string().trim().min(1).max(260),
});

export const tailoringResponseSchema = z.object({
  suggestions: z.array(tailoringSuggestionSchema).min(1).max(6),
});

export type TailoringSuggestion = z.infer<typeof tailoringSuggestionSchema>;

export const askResponseSchema = z.object({
  answer: z.string().trim().min(1).max(900),
  sourceFactIds: z.array(z.string().trim().min(1)).max(4).default([]),
});

export type AskResult = z.infer<typeof askResponseSchema>;
