import { useState, useRef } from "react";

import { cn } from "@/lib/utils";
import { EmojiPicker } from "@/components/ui/EmojiPicker";
import type { FileTreeEntry } from "@/types";

type DropPosition = "before" | "after" | null;

interface TreeNodeProps {
  entry: FileTreeEntry;
  depth: number;
  selectedPath: string | null;
  selectedFolder: string | null;
  onSelectFile: (path: string) => void;
  onSelectFolder: (path: string | null) => void;
  onRename: (path: string, newName: string) => void;
  onDelete: (path: string) => void;
  onAddFeature: (folderPath: string) => void;
  onUpdateEmoji: (path: string, emoji: string) => void;
  onReorder: (parentPath: string | null, orderedNames: string[]) => void;
  siblings: FileTreeEntry[];
  parentPath: string | null;
}

export function TreeNode({
  entry,
  depth,
  selectedPath,
  selectedFolder,
  onSelectFile,
  onSelectFolder,
  onRename,
  onDelete,
  onAddFeature,
  onUpdateEmoji,
  onReorder,
  siblings,
  parentPath,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(entry.name);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const isFolder = entry.type === "folder";
  const isSelected = !isFolder && entry.path === selectedPath;
  const isFolderSelected = isFolder && entry.path === selectedFolder;

  function handleClick() {
    if (isFolder) {
      setIsExpanded((prev) => !prev);
      onSelectFolder(entry.path === selectedFolder ? null : entry.path);
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
    if (trimmed && trimmed !== entry.name && /^[\w\- .]+$/.test(trimmed)) {
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

  function handleEmojiSelect(emoji: string) {
    onUpdateEmoji(entry.path, emoji);
    setEmojiPickerOpen(false);
  }

  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(
      "application/x-tree-node",
      JSON.stringify({ path: entry.path, name: entry.name, parentPath })
    );
    e.stopPropagation();
  }

  function handleDragOver(e: React.DragEvent) {
    const data = e.dataTransfer.types.includes("application/x-tree-node");
    if (!data) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    const threshold = rect.height / 2;
    setDropPosition(y < threshold ? "before" : "after");
  }

  function handleDragLeave(e: React.DragEvent) {
    if (rowRef.current && !rowRef.current.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);

    const raw = e.dataTransfer.getData("application/x-tree-node");
    if (!raw) return;
    const dragged: { path: string; name: string; parentPath: string | null } =
      JSON.parse(raw);

    const draggedParent = dragged.parentPath;
    if (draggedParent !== parentPath) return;
    if (dragged.path === entry.path) return;

    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = e.clientY - rect.top;
    const position: DropPosition = y < rect.height / 2 ? "before" : "after";

    const names = siblings.map((s) => s.name).filter((n) => n !== dragged.name);
    const targetIdx = names.indexOf(entry.name);
    const insertIdx = position === "before" ? targetIdx : targetIdx + 1;
    names.splice(insertIdx, 0, dragged.name);

    onReorder(parentPath, names);
  }

  function handleDragEnd() {
    setDropPosition(null);
  }

  return (
    <div>
      <div
        ref={rowRef}
        className={cn(
          "group flex items-center gap-1 rounded px-2 py-1.5 text-base cursor-pointer hover:bg-zinc-800 relative",
          isSelected && "bg-zinc-700",
          isFolderSelected && "bg-zinc-800 ring-1 ring-zinc-600"
        )}
        style={{ paddingLeft: `${depth * 20 + (isFolder ? 8 : 24)}px` }}
        onClick={handleClick}
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        {dropPosition === "before" && (
          <div className="pointer-events-none absolute top-0 right-0 left-0 h-0.5 bg-blue-500" />
        )}
        {dropPosition === "after" && (
          <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-0.5 bg-blue-500" />
        )}

        {isFolder && (
          <span className="w-4 text-zinc-500 select-none">
            {isExpanded ? "▾" : "▸"}
          </span>
        )}

        {isFolder ? (
          <span className="relative">
            <button
              className="text-lg select-none hover:scale-110 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                setEmojiPickerOpen((prev) => !prev);
              }}
              title="Choose emoji"
            >
              {entry.emoji || "📁"}
            </button>
            {emojiPickerOpen && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setEmojiPickerOpen(false)}
              />
            )}
          </span>
        ) : (
          <span className="w-5 text-center text-base select-none">●</span>
        )}

        {isRenaming ? (
          <input
            className="flex-1 rounded bg-zinc-800 px-1 text-base text-zinc-100 outline-none ring-1 ring-zinc-600"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <>
            <span
              className="flex-1 truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleRenameStart();
              }}
            >
              {isFolder ? entry.name : (entry.feature_name || entry.name.replace(/\.feature$/, ""))}
            </span>
            <span
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {isFolder && (
                <button
                  className="rounded-md border border-zinc-600 px-2 py-0.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-700 hover:text-white transition-colors"
                  onClick={() => onAddFeature(entry.path)}
                >
                  Add Feature
                </button>
              )}
              <button
                className="rounded px-1 text-base text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-300"
                onClick={() => onDelete(entry.path)}
              >
                ✕
              </button>
            </span>
          </>
        )}
      </div>

      {isFolder && isExpanded && (
        <div>
          {entry.children?.map((child) => (
            <TreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              selectedFolder={selectedFolder}
              onSelectFile={onSelectFile}
              onSelectFolder={onSelectFolder}
              onRename={onRename}
              onDelete={onDelete}
              onAddFeature={onAddFeature}
              onUpdateEmoji={onUpdateEmoji}
              onReorder={onReorder}
              siblings={entry.children || []}
              parentPath={entry.path}
            />
          ))}
        </div>
      )}
    </div>
  );
}
