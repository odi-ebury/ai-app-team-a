import { EditableText } from "@/components/ui/EditableText";
import { EditableSelect } from "@/components/ui/EditableSelect";
import type { Step } from "@/types";

const KEYWORDS = ["Given", "When", "Then", "And", "But"] as const;

const KEYWORD_COLORS: Record<string, string> = {
  Given: "text-blue-400",
  When: "text-amber-400",
  Then: "text-emerald-400",
  And: "text-purple-400",
  But: "text-rose-400",
};

interface StepEditorProps {
  step: Step;
  onChange: (step: Step) => void;
  onRemove: () => void;
}

export function StepEditor({ step, onChange, onRemove }: StepEditorProps) {
  return (
    <div className="group/step flex items-center gap-2">
      <EditableSelect
        value={step.keyword}
        options={KEYWORDS as unknown as string[]}
        onChange={(keyword) =>
          onChange({ ...step, keyword: keyword as Step["keyword"] })
        }
        className="text-lg font-semibold"
        colorMap={KEYWORD_COLORS}
      />

      <div className="flex-1">
        <EditableText
          value={step.text}
          onChange={(text) => onChange({ ...step, text })}
          placeholder="Click to add step text..."
          className="text-lg text-zinc-200"
          inputClassName="text-lg"
        />
      </div>

      <button
        className="rounded px-2 py-1 text-base text-red-400 opacity-0 group-hover/step:opacity-100 transition-opacity hover:text-red-300"
        onClick={onRemove}
        type="button"
      >
        Remove
      </button>
    </div>
  );
}
