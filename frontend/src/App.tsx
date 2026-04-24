import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";

import { FileTree } from "@/components/features/FileTree/FileTree";
import { FeatureEditor } from "@/components/features/Editor/FeatureEditor";

const queryClient = new QueryClient();

function AppLayout() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <aside className="w-80 flex-shrink-0 border-r border-zinc-700 bg-zinc-900">
        <FileTree
          selectedPath={selectedPath}
          onSelectFile={setSelectedPath}
          onSelectedRenamed={setSelectedPath}
          onSelectedDeleted={() => setSelectedPath(null)}
        />
      </aside>

      <main className="flex-1 bg-zinc-900">
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
