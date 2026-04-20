"use client";

import { useMarketplaceClient } from "@/components/providers/marketplace";
import { useEffect, useState } from "react";

/** Shape returned by the pages.context query/subscription. */
interface PageContextPayload {
  name?: string;
  [key: string]: unknown;
}

interface UsePageContextResult {
  pageName: string | null;
  isLoading: boolean;
}

/**
 * Fetches the current Sitecore page name on mount via `pages.context` and
 * stays up-to-date by subscribing to subsequent navigation events.
 *
 * Graceful degradation:
 *  - Inside Sitecore: client is available and returns the full page context.
 *  - Localhost preview: query / subscribe may fail or return null; the hook
 *    catches all errors and simply leaves `pageName` as null.
 */
export function usePageContext(): UsePageContextResult {
  const client = useMarketplaceClient();
  const [pageName, setPageName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    // Helper to extract the page name from whatever the SDK returns.
    const extractName = (data: unknown): string | null => {
      if (!data || typeof data !== "object") return null;
      const payload = data as PageContextPayload;
      return typeof payload.name === "string" ? payload.name : null;
    };

    // 1. One-shot query for the current page on mount.
    const fetchInitial = async () => {
      try {
        const result = await client.query("pages.context");
        if (!cancelled) {
          setPageName(extractName(result?.data ?? null));
        }
      } catch (err) {
        // Running on localhost or SDK unavailable — silently ignore.
        console.warn("[usePageContext] pages.context query failed:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchInitial();

    // 2. Subscribe to page-navigation events for subsequent updates.
    let unsubscribe: (() => void) | undefined;
    try {
      const subscription = client.subscribe(
        "pages.context",
        (payload: unknown) => {
          if (!cancelled) {
            setPageName(extractName(payload));
          }
        },
      );

      // The SDK may return a subscription object with an unsubscribe method,
      // a plain function, or nothing at all — handle all three cases.
      if (typeof subscription === "function") {
        unsubscribe = subscription;
      } else if (
        subscription &&
        typeof (subscription as { unsubscribe?: unknown }).unsubscribe ===
          "function"
      ) {
        unsubscribe = () =>
          (subscription as { unsubscribe: () => void }).unsubscribe();
      }
    } catch (err) {
      console.warn("[usePageContext] pages.context subscribe failed:", err);
    }

    // Cleanup: cancel pending state updates and unsubscribe from the SDK.
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [client]);

  return { pageName, isLoading };
}
