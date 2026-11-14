"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CandidateDetail, MatchDetail } from "@/lib/repo";
import { cn, formatRelativeTime } from "@/lib/utils";

export function MessageThread({
  match,
  side,
  candidate,
  employer,
}: {
  match: MatchDetail;
  side: "candidate" | "employer";
  candidate: CandidateDetail;
  employer: { name: string };
}) {
  const [messages, setMessages] = useState(match.messages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  async function send() {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ matchId: match.id, body: trimmed }),
      });
      const data = (await response.json()) as { message?: { id: string; senderType: string; body: string; createdAt: string }; error?: string };
      if (!response.ok || !data.message) {
        toast.error(data.error ?? "Could not send that message.");
        return;
      }
      setMessages((current) => [
        ...current,
        {
          id: data.message!.id,
          senderType: data.message!.senderType as "CANDIDATE" | "EMPLOYER",
          body: data.message!.body,
          createdAt: data.message!.createdAt,
        },
      ]);
      setBody("");
    } catch {
      toast.error("Network hiccup. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[560px] flex-col overflow-hidden rounded-[20px] border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Conversation</p>
        <p className="text-[11px] text-ink-faint">
          {messages.length} {messages.length === 1 ? "message" : "messages"}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5" data-testid="message-list">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-[13px] leading-6 text-ink-faint">
            No messages yet. Start with one specific question.
          </div>
        )}
        {messages.map((message) => {
          const fromMe = (side === "candidate" && message.senderType === "CANDIDATE") || (side === "employer" && message.senderType === "EMPLOYER");
          return (
            <div key={message.id} className={cn("flex gap-2.5", fromMe ? "justify-end" : "justify-start")}>
              {!fromMe &&
                (message.senderType === "EMPLOYER" ? (
                  <span className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-paper font-display text-[11px] font-semibold text-ink-soft">
                    {employer.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <Avatar name={candidate.name} monogram={candidate.monogram} palette={candidate.palette} size="xs" />
                ))}
              <div className={cn("max-w-[84%] sm:max-w-[76%]", fromMe && "flex flex-col items-end")}>
                <p className="mb-1 px-1 text-[11px] text-ink-faint">
                  <span className="font-medium text-ink-muted">
                    {fromMe ? "You" : message.senderType === "CANDIDATE" ? candidate.name.split(" ")[0] : employer.name}
                  </span>
                  <span className="ml-1.5">{formatRelativeTime(message.createdAt)}</span>
                </p>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-[14px] leading-6",
                    fromMe
                      ? "rounded-br-sm bg-accent text-white"
                      : "rounded-bl-sm border border-line bg-paper text-ink-soft",
                  )}
                >
                  {message.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line p-4">
        <div className="rounded-2xl border border-line bg-paper/40 p-2 transition focus-within:border-accent/40">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, 2000))}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void send();
              }
            }}
            placeholder="Ask one specific thing…"
            className="min-h-[76px] resize-none border-0 bg-transparent px-2 py-2 text-[14px] leading-6"
            data-testid="message-input"
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <span className="text-[11px] text-ink-faint">⌘ + Enter to send · demo conversation only</span>
            <Button
              size="sm"
              variant="primary"
              disabled={sending || body.trim().length === 0}
              onClick={() => void send()}
              data-testid="message-send"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}