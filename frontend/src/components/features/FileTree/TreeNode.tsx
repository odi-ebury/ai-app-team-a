import { useState } from "react";

import { cn } from "@/lib/utils";
import type { FileTreeEntry } from "@/types";

interface TreeNodeProps {
  entry: FileTreeEntry;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onRename: (path: string, newName: string) => void;
  onDelete: (path: string) => void;
}

export function TreeNode({
  entry,
  depth,
  selectedPath,
  onSelectFile,
  onRename,
  onDelete,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(entry.name);

  const isFolder = entry.type === "folder";
  const isSelected = entry.path === selectedPath;

  function handleClick() {
    if (isFolder) {
      setIsExpanded((prev) => !prev);
    } else {
      onSelectFile(entry.path);
    }
  }

  function handleRenameStart() {
    setRenameValue(entry.name);
    setIsRenaming(true);
  }

  function handleRenameSubmit() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== entry.name && /^[\w\-.]+$/.test(trimmed)) {
      onRename(entry.path, trimmed);
    }
    setIsRenaming(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
    }
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded px-2 py-1 text-sm cursor-pointer hover:bg-zinc-800",
          isSelected && "bg-zinc-700"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="w-4 text-zinc-500 select-none">
            {isExpanded ? "▾" : "▸"}
          </span>
        )}
        {!isFolder && <span className="w-4" />}

        {isRenaming ? (
          <input
            className="flex-1 rounded bg-zinc-800 px-1 text-sm text-zinc-100 outline-none ring-1 ring-zinc-600"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <>
            <span className="flex-1 truncate">{entry.name}</span>
            <span
              className="hidden gap-1 group-hover:flex"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="rounded px-1 text-xs text-zinc-500 hover:text-zinc-300"
                onClick={handleRenameStart}
              >
                ✎
              </button>
              <button
                className="rounded px-1 text-xs text-zinc-500 hover:text-red-400"
                onClick={() => onDelete(entry.path)}
              >
                ✕
              </button>
            </span>
          </>
        )}
      </div>

      {isFolder && isExpanded && entry.children && (
        <div>
          {entry.children.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              onRename={onRename}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
