
import { useEffect } from "react";
import { syncPendingEntries } from "../util/indexedDB";
import { api } from "../util/api";

export function useBackgroundSync() {
  useEffect(() => {
    const handleOnline = () => {
      // console.log("Back online, syncing...");
      syncPendingEntries(api);
    };

    window.addEventListener("online", handleOnline);

    if (navigator.onLine) {
      syncPendingEntries(api);
    }

    return () => window.removeEventListener("online", handleOnline);
  }, []);
}

