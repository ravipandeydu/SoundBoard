"use client";

import { useEffect } from "react";

export function DatabaseWarmup() {
  useEffect(() => {
    // Initial warmup
    const warmupDatabase = async () => {
      try {
        const response = await fetch("/api/warmup");
        if (!response.ok) {
          console.error("Database warmup failed:", await response.text());
        }
      } catch (error) {
        console.error("Database warmup error:", error);
      }
    };

    // Call warmup immediately
    warmupDatabase();

    // Set up periodic warmup every 4.5 minutes to prevent the 5-minute connection timeout
    const interval = setInterval(warmupDatabase, 4.5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
