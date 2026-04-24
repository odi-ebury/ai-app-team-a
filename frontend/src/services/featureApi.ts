import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/services/api";
import type {
  EmojiUpdate,
  FeatureBody,
  FeatureFile,
  FileCreate,
  FileTreeEntry,
  FolderCreate,
  RenameRequest,
  ReorderRequest,
} from "@/types";

export function getTree(): Promise<FileTreeEntry[]> {
  return apiFetch<FileTreeEntry[]>("/api/v1/features/tree");
}

export function getFile(path: string): Promise<FeatureFile> {
  return apiFetch<FeatureFile>(`/api/v1/features/file/${path}`);
}

export function createFolder(data: FolderCreate): Promise<unknown> {
  return apiFetch("/api/v1/features/folders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function createFile(data: FileCreate): Promise<unknown> {
  return apiFetch("/api/v1/features/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateFile(
  path: string,
  feature: FeatureBody
): Promise<unknown> {
  return apiFetch(`/api/v1/features/file/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feature),
  });
}

export function updateEmoji(
  path: string,
  data: EmojiUpdate
): Promise<unknown> {
  return apiFetch(`/api/v1/features/${path}/emoji`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function renameEntry(
  path: string,
  data: RenameRequest
): Promise<unknown> {
  return apiFetch(`/api/v1/features/${path}/rename`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deleteEntry(path: string): Promise<unknown> {
  return apiFetch(`/api/v1/features/${path}`, {
    method: "DELETE",
  });
}

export function reorderEntries(data: ReorderRequest): Promise<unknown> {
  return apiFetch("/api/v1/features/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function syncRepo(): Promise<unknown> {
  return apiFetch("/api/v1/features/sync", {
    method: "POST",
  });
}

export function useFileTree() {
  return useQuery({
    queryKey: ["features", "tree"],
    queryFn: getTree,
  });
}

export function useFeatureFile(path: string | null) {
  return useQuery({
    queryKey: ["features", "file", path],
    queryFn: () => getFile(path!),
    enabled: !!path,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", "tree"] });
    },
  });
}

export function useCreateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", "tree"] });
    },
  });
}

export function useUpdateEmoji() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, emoji }: { path: string; emoji: string }) =>
      updateEmoji(path, { emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", "tree"] });
    },
  });
}

export function useUpdateFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, feature }: { path: string; feature: FeatureBody }) =>
      updateFile(path, feature),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", "tree"] });
      queryClient.invalidateQueries({ queryKey: ["features", "file"] });
    },
  });
}

export function useRenameEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, data }: { path: string; data: RenameRequest }) =>
      renameEntry(path, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", "tree"] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", "tree"] });
    },
  });
}

export function useReorderEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reorderEntries,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features", "tree"] });
    },
  });
}

export function useSyncRepo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncRepo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["features"] });
    },
  });
}
