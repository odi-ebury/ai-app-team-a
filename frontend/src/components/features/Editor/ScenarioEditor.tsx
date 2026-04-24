import { Button } from "@/components/ui/Button";
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
    <div className="rounded-lg border border-zinc-700 p-4">
      <div className="mb-3 flex items-center gap-3">
        <input
          className="flex-1 rounded bg-zinc-800 px-2 py-1.5 text-sm font-medium text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-600"
          type="text"
          placeholder="Scenario name..."
          value={scenario.name}
          onChange={(e) => onChange({ ...scenario, name: e.target.value })}
        />
        <button
          className="text-xs text-zinc-500 hover:text-red-400"
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
