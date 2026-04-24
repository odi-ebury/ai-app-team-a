export interface Step {
  keyword: "Given" | "When" | "Then" | "And" | "But";
  text: string;
}

export interface Scenario {
  name: string;
  steps: Step[];
}

export interface FeatureBody {
  name: string;
  description?: string;
  scenarios: Scenario[];
}

export interface FeatureFile {
  path: string;
  feature: FeatureBody;
}

export interface FileTreeEntry {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: FileTreeEntry[];
  feature_name?: string;
  emoji?: string;
}

export interface FolderCreate {
  path: string;
}

export interface FileCreate {
  path: string;
  feature: FeatureBody;
}

export interface RenameRequest {
  new_name: string;
}

export interface EmojiUpdate {
  emoji: string;
}

export interface ReorderRequest {
  parent_path: string | null;
  ordered_names: string[];
}
