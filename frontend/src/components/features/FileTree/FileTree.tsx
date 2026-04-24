import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TreeNode } from "@/components/features/FileTree/TreeNode";
import {
  useFileTree,
  useCreateFolder,
  useCreateFile,
  useRenameEntry,
  useDeleteEntry,
  useSyncRepo,
} from "@/services/featureApi";

interface FileTreeProps {
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  onSelectedRenamed: (newPath: string) => void;
  onSelectedDeleted: () => void;
}

const VALID_NAME = /^[\w\-.]+$/;

export function FileTree({
  selectedPath,
  onSelectFile,
  onSelectedRenamed,
  onSelectedDeleted,
}: FileTreeProps) {
  const { data: tree, isLoading, error } = useFileTree();
  const createFolder = useCreateFolder();
  const createFile = useCreateFile();
  const renameEntry = useRenameEntry();
  const deleteEntry = useDeleteEntry();
  const syncRepo = useSyncRepo();

  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFeatureName, setNewFeatureName] = useState("");
  const [folderError, setFolderError] = useState("");
  const [fileError, setFileError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function handleCreateFolder() {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setFolderError("Name cannot be empty");
      return;
    }
    if (!VALID_NAME.test(trimmed)) {
      setFolderError("Only letters, numbers, hyphens, underscores, and dots");
      return;
    }
    createFolder.mutate(
      { path: trimmed },
      {
        onSuccess: () => {
          setFolderModalOpen(false);
          setNewFolderName("");
          setFolderError("");
        },
      }
    );
  }

  function handleCreateFile() {
    const trimmed = newFileName.trim();
    const featureName = newFeatureName.trim();
    if (!trimmed) {
      setFileError("Name cannot be empty");
      return;
    }
    if (!VALID_NAME.test(trimmed)) {
      setFileError("Only letters, numbers, hyphens, underscores, and dots");
      return;
    }
    const path = trimmed.endsWith(".feature") ? trimmed : `${trimmed}.feature`;
    createFile.mutate(
      {
        path,
        feature: { name: featureName || path, scenarios: [] },
      },
      {
        onSuccess: () => {
          setFileModalOpen(false);
          setNewFileName("");
          setNewFeatureName("");
          setFileError("");
        },
      }
    );
  }

  function handleRename(path: string, newName: string) {
    renameEntry.mutate(
      { path, data: { new_name: newName } },
      {
        onSuccess: () => {
          if (path === selectedPath) {
            const parts = path.split("/");
            parts[parts.length - 1] = newName;
            onSelectedRenamed(parts.join("/"));
          }
        },
      }
    );
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const path = deleteTarget;
    deleteEntry.mutate(path, {
      onSuccess: () => {
        if (selectedPath && (selectedPath === path || selectedPath.startsWith(path + "/"))) {
          onSelectedDeleted();
        }
      },
    });
    setDeleteTarget(null);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-700 p-3">
        <Button
          variant="ghost"
          className="text-xs"
          onClick={() => {
            setFolderError("");
            setNewFolderName("");
            setFolderModalOpen(true);
          }}
        >
          + Folder
        </Button>
        <Button
          variant="ghost"
          className="text-xs"
          onClick={() => {
            setFileError("");
            setNewFileName("");
            setNewFeatureName("");
            setFileModalOpen(true);
          }}
        >
          + File
        </Button>
        <Button
          variant="ghost"
          className="ml-auto text-xs"
          onClick={() => syncRepo.mutate()}
          disabled={syncRepo.isPending}
        >
          {syncRepo.isPending ? "Syncing..." : "Sync"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading && (
          <p className="px-2 py-4 text-sm text-zinc-500">Loading...</p>
        )}
        {error && (
          <p className="px-2 py-4 text-sm text-red-400">
            Failed to load tree
          </p>
        )}
        {tree &&
          tree.map((entry) => (
            <TreeNode
              key={entry.path}
              entry={entry}
              depth={0}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              onRename={handleRename}
              onDelete={(path) => setDeleteTarget(path)}
            />
          ))}
      </div>

      <Modal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        title="New Folder"
      >
        <input
          className="mb-1 w-full rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-600"
          placeholder="Folder name..."
          value={newFolderName}
          onChange={(e) => {
            setNewFolderName(e.target.value);
            setFolderError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          autoFocus
        />
        {folderError && (
          <p className="mb-3 text-xs text-red-400">{folderError}</p>
        )}
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setFolderModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateFolder} disabled={createFolder.isPending}>
            {createFolder.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={fileModalOpen}
        onClose={() => setFileModalOpen(false)}
        title="New Feature File"
      >
        <input
          className="mb-3 w-full rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-600"
          placeholder="File name (e.g. login.feature)..."
          value={newFileName}
          onChange={(e) => {
            setNewFileName(e.target.value);
            setFileError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
          autoFocus
        />
        <input
          className="mb-1 w-full rounded bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none ring-1 ring-zinc-700 placeholder:text-zinc-600"
          placeholder="Feature name..."
          value={newFeatureName}
          onChange={(e) => setNewFeatureName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFile()}
        />
        {fileError && (
          <p className="mb-3 text-xs text-red-400">{fileError}</p>
        )}
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setFileModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateFile} disabled={createFile.isPending}>
            {createFile.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete entry"
        message={`Delete "${deleteTarget?.split("/").pop()}"? This cannot be undone.`}
      />
    </div>
  );
}
