import type { Step } from "@/types";

const KEYWORDS = ["Given", "When", "Then", "And", "But"] as const;

interface StepEditorProps {
  step: Step;
  onChange: (step: Step) => void;
  onRemove: () => void;
}

export function StepEditor({ step, onChange, onRemove }: StepEditorProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="w-24 rounded bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700"
        value={step.keyword}
        onChange={(e) =>
          onChange({ ...step, keyword: e.target.value as Step["keyword"] })
        }
      >
        {KEYWORDS.map((kw) => (
          <option key={kw} value={kw}>
            {kw}
          </option>
        ))}
      </select>

      <input
        className="flex-1 rounded bg-zinc-800 px-2 py-1.5 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-600"
        type="text"
        placeholder="Step text..."
        value={step.text}
        onChange={(e) => onChange({ ...step, text: e.target.value })}
      />

      <button
        className="rounded px-2 py-1 text-xs text-zinc-500 hover:text-red-400"
        onClick={onRemove}
        type="button"
      >
        Remove
      </button>
    </div>
  );
}
