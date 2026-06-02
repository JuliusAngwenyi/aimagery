import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const HF_URL =
  "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

const MAX_PROMPT_LENGTH = 2000;

interface GenerateImageRequestBody {
  prompt: string;
}

function isValidRequestBody(body: unknown): body is GenerateImageRequestBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "prompt" in body &&
    typeof (body as Record<string, unknown>).prompt === "string" &&
    (body as GenerateImageRequestBody).prompt.trim().length > 0
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // --- Input validation ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidRequestBody(body)) {
    return NextResponse.json(
      { error: "A prompt string is required" },
      { status: 400 },
    );
  }

  const { prompt } = body;

  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt must be ${MAX_PROMPT_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  // --- Build request headers ---
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = process.env.HUGGINGFACE_API_TOKEN;
  if (token && token.trim()) {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }

  // --- Call HuggingFace ---
  let hfResponse: Response;
  try {
    hfResponse = await fetch(HF_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ inputs: prompt }),
    });
  } catch (err) {
    console.error("[generate-image] Network error reaching HuggingFace:", err);
    return NextResponse.json(
      { error: "Failed to reach HuggingFace API" },
      { status: 502 },
    );
  }

  // --- Handle non-OK HF responses ---
  if (!hfResponse.ok) {
    if (hfResponse.status === 503) {
      return NextResponse.json(
        { error: "Model loading, retry in 20 seconds", retryAfter: 20 },
        { status: 503 },
      );
    }

    if (hfResponse.status === 429) {
      return NextResponse.json(
        {
          error:
            "Rate limit reached. Set HUGGINGFACE_API_TOKEN in .env.local for a free token with higher limits.",
        },
        { status: 429 },
      );
    }

    if (hfResponse.status === 401) {
      return NextResponse.json(
        {
          error:
            "HuggingFace authentication failed. Set a valid HUGGINGFACE_API_TOKEN in .env.local — the router endpoint requires a token even for free-tier use.",
        },
        { status: 401 },
      );
    }

    // Any other non-OK status — try to surface HF's error message.
    const rawText = await hfResponse.text();
    // If HF returned an HTML page (e.g. a gateway error), don't echo the markup.
    const isHtml = rawText.trimStart().startsWith("<");
    let detail = isHtml ? `HTTP ${hfResponse.status} from HuggingFace` : rawText;
    try {
      const parsed = JSON.parse(rawText) as Record<string, unknown>;
      if (typeof parsed?.error === "string") {
        detail = parsed.error;
      }
    } catch {
      // rawText is not JSON; use as-is.
    }
    console.error(
      `[generate-image] HuggingFace returned ${hfResponse.status}:`,
      detail,
    );
    return NextResponse.json(
      { error: "Image generation failed. Please try again later." },
      { status: hfResponse.status },
    );
  }

  // --- 200 but content-type is JSON (loading estimate or HF error) ---
  const contentType = hfResponse.headers.get("Content-Type") ?? "";
  const mimeType = contentType.split(";")[0].trim() || "image/jpeg";

  if (mimeType === "application/json") {
    const jsonBody = (await hfResponse.json()) as Record<string, unknown>;
    console.error(
      "[generate-image] HuggingFace returned JSON on 200:",
      jsonBody,
    );
    return NextResponse.json(
      {
        error:
          typeof jsonBody?.error === "string"
            ? jsonBody.error
            : "Unexpected response from model",
      },
      { status: 500 },
    );
  }

  // --- Success: binary image → base64 data URL ---
  const arrayBuffer = await hfResponse.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const imageUrl = `data:${mimeType};base64,${base64}`;

  return NextResponse.json({ imageUrl });
}
