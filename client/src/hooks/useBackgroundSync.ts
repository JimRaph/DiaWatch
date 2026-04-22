
import { useEffect } from "react";
import { syncPendingEntries } from "../util/indexedDB";
import { api } from "../util/api";

export function useBackgroundSync() {
  useEffect(() => {
    // Sync when coming back online
    const handleOnline = () => {
      console.log("Back online, syncing...");
      syncPendingEntries(api);
    };

    window.addEventListener("online", handleOnline);

    // Initial sync if online
    if (navigator.onLine) {
      syncPendingEntries(api);
    }

    return () => window.removeEventListener("online", handleOnline);
  }, []);
}

