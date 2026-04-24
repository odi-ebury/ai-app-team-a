import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ScenarioEditor } from "@/components/features/Editor/ScenarioEditor";
import { useFeatureFile, useUpdateFile } from "@/services/featureApi";
import type { FeatureBody, Scenario } from "@/types";

interface FeatureEditorProps {
  path: string;
}

export function FeatureEditor({ path }: FeatureEditorProps) {
  const { data, isLoading, error } = useFeatureFile(path);
  const updateFile = useUpdateFile();

  const [form, setForm] = useState<FeatureBody | null>(null);

  useEffect(() => {
    if (data) {
      setForm(data.feature);
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-400">
          Failed to load file: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!form) return null;

  function handleScenarioChange(index: number, scenario: Scenario) {
    setForm((prev) => {
      if (!prev) return prev;
      const scenarios = [...prev.scenarios];
      scenarios[index] = scenario;
      return { ...prev, scenarios };
    });
  }

  function handleScenarioRemove(index: number) {
    setForm((prev) => {
      if (!prev) return prev;
      return { ...prev, scenarios: prev.scenarios.filter((_, i) => i !== index) };
    });
  }

  function handleAddScenario() {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        scenarios: [
          ...prev.scenarios,
          { name: "", steps: [{ keyword: "Given" as const, text: "" }] },
        ],
      };
    });
  }

  function handleSave() {
    if (!form) return;
    updateFile.mutate({ path, feature: form });
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">{path}</h2>
        <Button
          onClick={handleSave}
          disabled={updateFile.isPending}
        >
          {updateFile.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {updateFile.isError && (
        <p className="mb-4 text-sm text-red-400">
          Failed to save: {(updateFile.error as Error).message}
        </p>
      )}

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Feature Name
          </label>
          <input
            className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-600"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Description
          </label>
          <textarea
            className="w-full rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-600"
            rows={3}
            placeholder="Optional description..."
            value={form.description ?? ""}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value || undefined })
            }
          />
        </div>

        <div>
          <h3 className="mb-3 text-sm font-medium text-zinc-300">Scenarios</h3>
          <div className="space-y-4">
            {form.scenarios.map((scenario, i) => (
              <ScenarioEditor
                key={i}
                scenario={scenario}
                onChange={(s) => handleScenarioChange(i, s)}
                onRemove={() => handleScenarioRemove(i)}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            className="mt-4 text-xs"
            onClick={handleAddScenario}
            type="button"
          >
            + Add Scenario
          </Button>
        </div>
      </div>
    </div>
  );
}
