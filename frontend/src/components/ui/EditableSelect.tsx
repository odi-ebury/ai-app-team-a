import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface EditableSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
  colorMap?: Record<string, string>;
}

export function EditableSelect({
  value,
  options,
  onChange,
  className,
  colorMap,
}: EditableSelectProps) {
  const [editing, setEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (editing && selectRef.current) {
      selectRef.current.focus();
      selectRef.current.showPicker();
    }
  }, [editing]);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(e.target.value);
    setEditing(false);
  }

  const colorClass = colorMap?.[value] ?? "";

  if (editing) {
    return (
      <select
        ref={selectRef}
        className={cn(
          "rounded bg-zinc-800 px-2 py-1 text-lg font-semibold outline-none ring-1 ring-zinc-600 focus:ring-zinc-400",
          colorClass || "text-white",
        )}
        value={value}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <span
      className={cn(
        "cursor-pointer rounded border border-zinc-600 px-2 py-1 transition-colors hover:border-zinc-500 hover:bg-zinc-800",
        colorClass,
        className,
      )}
      onClick={() => setEditing(true)}
    >
      {value}
    </span>
  );
}
