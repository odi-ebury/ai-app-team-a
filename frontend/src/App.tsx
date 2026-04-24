import { useCallback, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";

import { FileTree } from "@/components/features/FileTree/FileTree";
import { FeatureEditor } from "@/components/features/Editor/FeatureEditor";

const queryClient = new QueryClient();

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

function AppLayout() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    }

    function onMouseUp() {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div className="flex h-screen">
      <aside
        className="flex-shrink-0 border-r border-zinc-700 bg-zinc-900"
        style={{ width: `${sidebarWidth}px` }}
      >
        <FileTree
          selectedPath={selectedPath}
          onSelectFile={setSelectedPath}
          onSelectedRenamed={setSelectedPath}
          onSelectedDeleted={() => setSelectedPath(null)}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />
      </aside>

      <div
        className="w-1 flex-shrink-0 cursor-col-resize bg-zinc-700 hover:bg-zinc-500 active:bg-zinc-400 transition-colors"
        onMouseDown={handleMouseDown}
      />

      <main className="flex-1 overflow-hidden bg-zinc-900">
        {selectedPath ? (
          <FeatureEditor path={selectedPath} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-zinc-500">
              Select a feature file from the sidebar to start editing
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
