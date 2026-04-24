import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { FileTreeEntry } from "@/types";

const EMOJI_OPTIONS = [
  "🚀", "⭐", "🔥", "💡", "🎯", "📦", "🔒", "💳", "👤", "🛒",
  "📊", "🔔", "⚙️", "🌍", "💬", "📱", "🏷️", "🎨", "🧪", "📋",
];

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
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(entry.name);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded px-2 py-1 text-sm cursor-pointer hover:bg-zinc-800",
          isSelected && "bg-zinc-700",
          isFolderSelected && "bg-zinc-800 ring-1 ring-zinc-600"
        )}
        style={{ paddingLeft: `${depth * 20 + (isFolder ? 8 : 24)}px` }}
        onClick={handleClick}
      >
        {isFolder && (
          <span className="w-4 text-zinc-500 select-none">
            {isExpanded ? "▾" : "▸"}
          </span>
        )}

        {isFolder ? (
          <span className="relative">
            <button
              ref={emojiRef}
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
              <div
                className="absolute left-0 top-7 z-50 rounded-lg bg-zinc-800 p-2 shadow-xl ring-1 ring-zinc-600"
                style={{ display: "grid", gridTemplateColumns: "repeat(5, 36px)", gap: "4px" }}
                onClick={(e) => e.stopPropagation()}
              >
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    className="flex items-center justify-center rounded text-lg hover:bg-zinc-700"
                    style={{ width: "36px", height: "36px" }}
                    onClick={() => handleEmojiSelect(em)}
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </span>
        ) : (
          <span className="w-5 text-center text-base select-none">📄</span>
        )}

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
            <span className="flex-1 truncate">
              {isFolder ? entry.name : (entry.feature_name || entry.name.replace(/\.feature$/, ""))}
            </span>
            <span
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {isFolder && (
                <button
                  className="rounded px-1 text-base text-emerald-400 hover:text-emerald-300"
                  onClick={() => onAddFeature(entry.path)}
                  title="Add feature"
                >
                  ＋
                </button>
              )}
              <button
                className="rounded px-1 text-base text-zinc-400 hover:text-zinc-200"
                onClick={handleRenameStart}
              >
                ✎
              </button>
              <button
                className="rounded px-1 text-base text-red-400 hover:text-red-300"
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
              selectedFolder={selectedFolder}
              onSelectFile={onSelectFile}
              onSelectFolder={onSelectFolder}
              onRename={onRename}
              onDelete={onDelete}
              onAddFeature={onAddFeature}
              onUpdateEmoji={onUpdateEmoji}
            />
          ))}
        </div>
      )}
    </div>
  );
}
