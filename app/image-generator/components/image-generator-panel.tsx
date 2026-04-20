"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePageContext } from "../hooks/use-page-context";

const STYLES = [
  { label: "Photorealistic", value: "photorealistic" },
  { label: "Digital Art", value: "digital art" },
  { label: "Watercolor Painting", value: "watercolor painting" },
  { label: "Concept Art", value: "concept art" },
] as const;

type ImageStyle = (typeof STYLES)[number]["value"];

interface GenerateImageResponse {
  imageUrl?: string;
  error?: string;
  retryAfter?: number;
}

interface HistoryEntry {
  prompt: string;
  imageUrl: string;
}

const HISTORY_KEY = "image-generator-history";
const HISTORY_LIMIT = 5;

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_LIMIT)));
  } catch {
    // localStorage unavailable (e.g. private browsing) — silently ignore.
  }
}

export function ImageGeneratorPanel() {
  const { pageName } = usePageContext();

  const [prompt, setPrompt] = useState<string>("");
  const [style, setStyle] = useState<ImageStyle>("photorealistic");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history from localStorage once on mount (client-only).
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Cache: track the prompt used for the current imageUrl to avoid redundant calls.
  const lastGeneratedPromptRef = useRef<string | null>(null);

  // Pre-fill prompt whenever the Sitecore page context changes.
  useEffect(() => {
    if (pageName) {
      setPrompt(
        `Create a visually striking image representing the Sitecore page: ${pageName}`,
      );
    }
  }, [pageName]);

  // Clean up countdown interval on unmount.
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const generate = useCallback(async (promptText: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });

      const data: GenerateImageResponse = await response.json();

      if (response.ok && data.imageUrl) {
        setImageUrl(data.imageUrl);
        lastGeneratedPromptRef.current = promptText;
        setError(null);
        // Prepend to history, deduplicate by prompt, cap at limit.
        setHistory((prev) => {
          const filtered = prev.filter((e) => e.prompt !== promptText);
          const next = [{ prompt: promptText, imageUrl: data.imageUrl! }, ...filtered].slice(0, HISTORY_LIMIT);
          saveHistory(next);
          return next;
        });
        return; 
      }

      if (response.status === 503 && typeof data.retryAfter === "number") {
        const seconds = data.retryAfter;
        setRetryCountdown(seconds);

        intervalRef.current = setInterval(() => {
          setRetryCountdown((prev) => {
            if (prev === null || prev <= 1) {
              clearInterval(intervalRef.current!);
              intervalRef.current = null;
              // Auto-retry when the countdown hits zero.
              generate(promptText);
              return null;
            }
            return prev - 1;
          });
        }, 1_000);

        return;
      }

      setError(data.error ?? "An unexpected error occurred.");
    } catch {
      setError("Failed to reach the generation API. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleDownload = () => {
    if (!imageUrl) return;
    try {
      const commaIndex = imageUrl.indexOf(",");
      const prefix = imageUrl.slice(0, commaIndex);          // "data:<mime>;base64"
      const base64 = imageUrl.slice(commaIndex + 1);         // raw base64 string
      const mimeType = prefix.slice(5, prefix.indexOf(";"));  // e.g. "image/png"

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: mimeType });
      const objectUrl = URL.createObjectURL(blob);

      const ext = mimeType.split("/")[1] ?? "jpg";
      const filename = `sitecore-ai-image-${Date.now()}.${ext}`;

      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      URL.revokeObjectURL(objectUrl);
    } catch {
      setError("Download failed");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating || retryCountdown !== null) return;
    const styledPrompt = `${prompt.trim()}, style: ${style}`;
    // Cache hit: same styled prompt already has a result — skip the API call.
    if (styledPrompt === lastGeneratedPromptRef.current && imageUrl) return;
    generate(styledPrompt);
  };

  return (
    <div className="flex justify-center px-4 py-6">
      <Card className="w-full max-w-[480px]">
        <CardHeader>
          <CardTitle className="text-lg">AI Image Generator</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Prompt textarea — styled to match shadcn inputs */}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe the image you want to generate…"
              disabled={isGenerating || retryCountdown !== null}
              className={cn(
                "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                "ring-offset-background placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
              )}
            />

            {/* Style selector */}
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as ImageStyle)}
              disabled={isGenerating || retryCountdown !== null}
              className={cn(
                "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm",
                "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
                "focus-visible:ring-ring focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {retryCountdown !== null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>Model loading, retrying in {retryCountdown}s…</span>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate"
                )}
              </Button>
            )}
          </form>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {imageUrl && (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="AI-generated image"
                className="w-full rounded-md border border-border object-contain"
              />

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  Download
                </Button>

                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setImageUrl(null);
                    lastGeneratedPromptRef.current = null;
                  }}
                >
                  Generate new
                </Button>
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Recent generations</p>
              <div className="flex gap-2 flex-wrap">
                {history.map((entry, i) => (
                  <button
                    key={i}
                    type="button"
                    title={entry.prompt}
                    onClick={() => {
                      setImageUrl(entry.imageUrl);
                      setPrompt(entry.prompt);
                      lastGeneratedPromptRef.current = entry.prompt;
                    }}
                    className="size-14 rounded border border-border overflow-hidden hover:ring-2 hover:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.imageUrl}
                      alt={entry.prompt}
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
