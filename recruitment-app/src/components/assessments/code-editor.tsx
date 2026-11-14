"use client";

import dynamic from "next/dynamic";
import type { OnChange, OnMount } from "@monaco-editor/react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react").then((module) => module.default), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
      <p className="text-[12px] text-white/60">Loading editor...</p>
    </div>
  ),
});

export function CodeEditor({
  problemId,
  title,
  value,
  readOnly = false,
  onChange,
  fill = false,
  height = 380,
}: {
  problemId: string;
  title: string;
  value: string;
  readOnly?: boolean;
  onChange: (value: string) => void;
  /** Fill the parent's height (the test workspace) instead of a fixed height. */
  fill?: boolean;
  height?: number;
}) {
  const handleMount: OnMount = (editor) => {
    // Focusing the editor on a phone jumps past the problem statement and can
    // open the software keyboard. Desktop focus is helpful; mobile is not.
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      editor.focus();
    }
  };

  const handleChange: OnChange = (nextValue) => {
    onChange(nextValue ?? "");
  };

  return (
    <div
      className={fill ? "h-full min-h-[360px] w-full overflow-hidden bg-[#1e1e1e]" : "w-full overflow-hidden bg-[#1e1e1e]"}
      style={fill ? undefined : { height }}
      data-testid="assessment-code"
    >
      <MonacoEditor
        height="100%"
        language="javascript"
        theme="vs-dark"
        path={"problems/" + problemId + ".js"}
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        loading={<div className="flex h-full items-center justify-center text-[12px] text-white/60">Loading editor...</div>}
        options={{
          readOnly,
          automaticLayout: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 13,
          lineHeight: 22,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: "off",
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "line",
          smoothScrolling: true,
          cursorBlinking: "smooth",
          fontFamily:
            "ui-monospace, SFMono-Regular, SF Mono, Menlo, Monaco, Consolas, Liberation Mono, monospace",
          ariaLabel: "Code for " + title,
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        }}
      />
    </div>
  );
}
