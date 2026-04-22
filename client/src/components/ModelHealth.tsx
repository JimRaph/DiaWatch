"use client";

import { useEffect, useState } from "react";
import { api } from "../util/api";

export function ModelHealth() {
  const [metadata, setMetadata] = useState<{
    status: string;
    version: string;
  } | null>(null);

  useEffect(() => {
    api
      .getHealth()
      .then(setMetadata)
      .catch(() => setMetadata({ status: "offline", version: "unknown" }));
  }, []);

  const isOptimal = metadata?.status === "optimal";

  return (
    <div className="flex items-center space-x-3 text-xs font-mono uppercase tracking-widest">
      <div
        className={`w-2 h-2 rounded-full ${isOptimal ? "bg-emerald-500" : "bg-gray-400"}`}
      />
      <span className="text-gray-500 dark:text-gray-400">
        AI v{metadata?.version || "0.0.0"} Status:
        <span
          className={isOptimal ? "text-emerald-600 ml-1" : "text-gray-500 ml-1"}
        >
          {metadata?.status || "Checking..."}
        </span>
      </span>
    </div>
  );
}
