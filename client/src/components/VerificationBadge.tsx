"use client";

import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { CheckupEntry } from "../types";

interface VerificationBadgeProps {
  entry: CheckupEntry;
  size?: "sm" | "md" | "lg";
}

export function VerificationBadge({
  entry,
  size = "md",
}: VerificationBadgeProps) {
  const status = entry.verification_status;

  const styles = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  switch (status) {
    case "verified":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium ${styles[size]}`}
        >
          <CheckCircle className={iconSizes[size]} />
          Verified
        </span>
      );

    case "corrected":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium ${styles[size]}`}
        >
          <AlertCircle className={iconSizes[size]} />
          Corrected
        </span>
      );

    case "unverified":
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium ${styles[size]}`}
        >
          <XCircle className={iconSizes[size]} />
          Declined
        </span>
      );

    case "pending":
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium ${styles[size]}`}
        >
          <Clock className={iconSizes[size]} />
          Pending
        </span>
      );
  }
}
