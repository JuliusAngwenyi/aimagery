import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock global fetch for HuggingFace calls.
const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.HUGGINGFACE_API_TOKEN;
});

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(rawBody: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: rawBody,
  });
}

describe("POST /api/generate-image", () => {
  describe("input validation", () => {
    it("returns 400 for invalid JSON body", async () => {
      const req = makeRawRequest("not json{{{");
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("Invalid JSON body");
    });

    it("returns 400 when prompt is missing", async () => {
      const res = await POST(makeRequest({}));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("A prompt string is required");
    });

    it("returns 400 when prompt is empty string", async () => {
      const res = await POST(makeRequest({ prompt: "" }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("A prompt string is required");
    });

    it("returns 400 when prompt is whitespace only", async () => {
      const res = await POST(makeRequest({ prompt: "   " }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("A prompt string is required");
    });

    it("returns 400 when prompt is not a string", async () => {
      const res = await POST(makeRequest({ prompt: 123 }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("A prompt string is required");
    });

    it("returns 400 when body is null", async () => {
      const res = await POST(makeRequest(null));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe("A prompt string is required");
    });

    it("returns 400 when prompt exceeds max length", async () => {
      const longPrompt = "a".repeat(2001);
      const res = await POST(makeRequest({ prompt: longPrompt }));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("2000 characters or fewer");
    });

    it("accepts a prompt at exactly the max length", async () => {
      const exactPrompt = "a".repeat(2000);
      mockFetch.mockResolvedValueOnce(
        new Response(new Uint8Array([0x89, 0x50]), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
      );

      const res = await POST(makeRequest({ prompt: exactPrompt }));
      expect(res.status).toBe(200);
    });
  });

  describe("HuggingFace error handling", () => {
    it("returns 503 with retryAfter when HF returns 503", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Model loading", { status: 503 }),
      );

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.retryAfter).toBe(20);
    });

    it("returns 429 when HF returns rate limit error", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Too many requests", { status: 429 }),
      );

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(429);
      expect(data.error).toContain("Rate limit");
    });

    it("returns 401 when HF authentication fails", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Unauthorized", { status: 401 }),
      );

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(401);
      expect(data.error).toContain("authentication failed");
    });

    it("returns 502 when HF is unreachable (network error)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(502);
      expect(data.error).toBe("Failed to reach HuggingFace API");
    });

    it("does not leak HF error details in catch-all error handler", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: "Internal GPU error at node 42" }),
          { status: 500 },
        ),
      );

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(500);
      // Should NOT contain the raw HF error
      expect(data.error).not.toContain("GPU");
      expect(data.error).toBe(
        "Image generation failed. Please try again later.",
      );
    });

    it("handles HTML error pages without leaking markup", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("<html><body>502 Bad Gateway</body></html>", {
          status: 502,
        }),
      );

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(502);
      expect(data.error).not.toContain("<html>");
      expect(data.error).toBe(
        "Image generation failed. Please try again later.",
      );
    });
  });

  describe("successful generation", () => {
    it("returns a base64 data URL on success", async () => {
      const imageBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      mockFetch.mockResolvedValueOnce(
        new Response(imageBytes, {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
      );

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.imageUrl).toMatch(/^data:image\/png;base64,/);
    });

    it("handles JSON response on 200 as an error", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Model not ready" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

      const res = await POST(makeRequest({ prompt: "a sunset" }));
      const data = await res.json();

      expect(res.status).toBe(500);
      expect(data.error).toBe("Model not ready");
    });
  });

  describe("authorization header", () => {
    it("includes Bearer token when HUGGINGFACE_API_TOKEN is set", async () => {
      process.env.HUGGINGFACE_API_TOKEN = "hf_test_token";
      mockFetch.mockResolvedValueOnce(
        new Response(new Uint8Array([0x89]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      );

      await POST(makeRequest({ prompt: "a sunset" }));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer hf_test_token",
          }),
        }),
      );
    });

    it("does not include Authorization header when token is absent", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(new Uint8Array([0x89]), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      );

      await POST(makeRequest({ prompt: "a sunset" }));

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders).not.toHaveProperty("Authorization");
    });
  });
});
