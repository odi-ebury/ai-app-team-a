import { Button } from "@/components/ui/Button";
import { EditableText } from "@/components/ui/EditableText";
import { StepEditor } from "@/components/features/Editor/StepEditor";
import type { Scenario, Step } from "@/types";

interface ScenarioEditorProps {
  scenario: Scenario;
  onChange: (scenario: Scenario) => void;
  onRemove: () => void;
}

export function ScenarioEditor({
  scenario,
  onChange,
  onRemove,
}: ScenarioEditorProps) {
  function handleStepChange(index: number, step: Step) {
    const steps = [...scenario.steps];
    steps[index] = step;
    onChange({ ...scenario, steps });
  }

  function handleStepRemove(index: number) {
    const steps = scenario.steps.filter((_, i) => i !== index);
    onChange({ ...scenario, steps });
  }

  function handleAddStep() {
    onChange({
      ...scenario,
      steps: [...scenario.steps, { keyword: "Given", text: "" }],
    });
  }

  return (
    <div className="group/scenario rounded-lg border border-zinc-700 p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1">
          <EditableText
            value={scenario.name}
            onChange={(name) => onChange({ ...scenario, name })}
            placeholder="Click to add scenario name..."
            className="text-base font-medium text-white"
            inputClassName="text-base font-medium"
          />
        </div>
        <button
          className="text-sm text-red-400 opacity-0 group-hover/scenario:opacity-100 transition-opacity hover:text-red-300"
          onClick={onRemove}
          type="button"
        >
          Remove Scenario
        </button>
      </div>

      <div className="space-y-2">
        {scenario.steps.map((step, i) => (
          <StepEditor
            key={i}
            step={step}
            onChange={(s) => handleStepChange(i, s)}
            onRemove={() => handleStepRemove(i)}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        className="mt-3 text-xs"
        onClick={handleAddStep}
        type="button"
      >
        + Add Step
      </Button>
    </div>
  );
}
