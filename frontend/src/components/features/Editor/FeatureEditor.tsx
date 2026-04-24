import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { EditableText } from "@/components/ui/EditableText";
import { ScenarioEditor } from "@/components/features/Editor/ScenarioEditor";
import { useFeatureFile, useFileTree, useUpdateFile } from "@/services/featureApi";
import type { FeatureBody, Scenario } from "@/types";

interface FeatureEditorProps {
  path: string;
}

export function FeatureEditor({ path }: FeatureEditorProps) {
  const { data, isLoading, error } = useFeatureFile(path);
  const { data: tree } = useFileTree();
  const updateFile = useUpdateFile();

  const initiative = useMemo(() => {
    if (!tree) return null;
    const rootFolder = path.split("/")[0];
    return tree.find((entry) => entry.name === rootFolder) ?? null;
  }, [tree, path]);

  const [form, setForm] = useState<FeatureBody | null>(null);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    if (data) {
      setForm(data.feature);
    }
  }, [data]);

  const save = useCallback(
    (updated: FeatureBody) => {
      updateFile.mutate({ path, feature: updated });
    },
    [path, updateFile],
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-base text-zinc-400">Loading file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-base text-red-400">
          Failed to load file: {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!form) return null;

  function handleNameChange(name: string) {
    const updated = { ...formRef.current!, name };
    setForm(updated);
    save(updated);
  }

  function handleDescriptionChange(description: string) {
    const updated = { ...formRef.current!, description: description || undefined };
    setForm(updated);
    save(updated);
  }

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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {initiative && (
            <>
              <span className="text-5xl">{initiative.emoji || "📁"}</span>
              <span className="text-3xl font-bold text-white">{initiative.name}</span>
            </>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={updateFile.isPending}
        >
          {updateFile.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      {updateFile.isError && (
        <p className="mb-4 text-base text-red-400">
          Failed to save: {(updateFile.error as Error).message}
        </p>
      )}

      <div className="mb-6">
        <EditableText
          value={form.name}
          onChange={handleNameChange}
          placeholder="Click to add feature name..."
          className="text-2xl font-semibold text-white"
          inputClassName="text-2xl font-semibold"
        />
        <EditableText
          value={form.description ?? ""}
          onChange={handleDescriptionChange}
          placeholder="Click to add description..."
          multiline
          className="mt-1 text-base text-zinc-200"
          inputClassName="text-base"
        />
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="mb-3 text-lg font-medium text-zinc-100">Scenarios</h3>
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
