// Chat completion edge function: domain-aware knowledge base + BYO Gemini key
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatMsg {
  role: "user" | "assistant" | "system";
  content: string;
}

const TEXTUAL = /\.(txt|md|csv|json|html|xml|log|tsv|yml|yaml)$/i;
const MAX_DOC_CHARS = 8000;
const MAX_TOTAL_CHARS = 60000;

async function buildKnowledgeBase(
  supabase: ReturnType<typeof createClient>,
  domainId: string | null,
): Promise<string> {
  let q = supabase
    .from("documents")
    .select("title, description, file_name, file_path, file_type, content_text, domain_id");
  if (domainId) q = q.eq("domain_id", domainId);
  const { data: docs, error } = await q.limit(50);
  if (error || !docs?.length) return "";

  const parts: string[] = [];
  let total = 0;

  for (const d of docs as any[]) {
    let body: string = (d.content_text ?? "").trim();

    if (!body && TEXTUAL.test(d.file_name ?? "")) {
      try {
        const { data: file } = await supabase.storage
          .from("documents")
          .download(d.file_path);
        if (file) {
          const text = await file.text();
          body = text.slice(0, MAX_DOC_CHARS);
        }
      } catch (_) {
        /* ignore */
      }
    }

    const header = `### Document: ${d.title}\n${d.description ? d.description + "\n" : ""}`;
    const snippet = body
      ? body.slice(0, MAX_DOC_CHARS)
      : "(binary file — no extracted text available)";
    const block = `${header}${snippet}\n`;
    if (total + block.length > MAX_TOTAL_CHARS) break;
    parts.push(block);
    total += block.length;
  }

  return parts.join("\n---\n");
}

async function callGeminiDirect(apiKey: string, system: string, messages: ChatMsg[]) {
  // Convert OpenAI-style messages to Gemini "contents"
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
    encodeURIComponent(apiKey);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";
  return text;
}

async function callLovableGateway(system: string, messages: ChatMsg[]) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429)
      throw new Error("Rate limit reached. Please try again shortly.");
    if (res.status === 402)
      throw new Error(
        "AI credits exhausted. Add credits in Settings → Workspace → Usage, or use your own Gemini API key.",
      );
    throw new Error(`AI gateway error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, domain_id } = await req.json() as {
      messages: ChatMsg[];
      domain_id: string | null;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Domain name + KB
    let domainName = "All Domains";
    if (domain_id) {
      const { data: dom } = await adminClient
        .from("domains")
        .select("name")
        .eq("id", domain_id)
        .maybeSingle();
      if (dom?.name) domainName = dom.name;
    }

    const kb = await buildKnowledgeBase(adminClient, domain_id);

    const system = `You are a professional data analytics and reporting assistant for the "${domainName}" domain of a pediatric hospital.
Your task is to transform raw data into a clean, polished, decision-ready response.

Writing style:
- Use a professional, neutral, and concise tone.
- Write like a business or healthcare report, not a casual chat.
- Prioritize clarity, structure, and readability.
- Avoid filler words, repetition, and overly long paragraphs.

Formatting rules:
- Start with a brief executive summary.
- Use markdown headings to organize the answer.
- Use markdown tables for metrics, comparisons, and category breakdowns.
- Use bullet points for insights and notable patterns.
- Keep formatting clean and visually balanced.
- Use bold sparingly for important labels or totals only.
- Keep numbers, percentages, and time values consistent.
- Round values in a consistent and sensible way.

Response structure:
## Executive Summary
A 1–2 sentence overview of the main finding.

## Key Metrics
A markdown table of the most important KPIs.

## Breakdown
A markdown table or compact bullets for category-level details.

## Insights
- Key trends
- Outliers
- Operational implications
- Important comparisons

## Notes
Optional assumptions, caveats, or context if needed.

Behavior rules:
- If the user asks for analysis, include interpretation, not just raw numbers.
- If the user asks for comparison, always prefer a table.
- If the data is complex, simplify it into digestible sections.
- If the answer contains many values, present them in a table rather than a paragraph.
- Make the response look like a polished report that is easy to scan.
- Do not sound verbose or robotic.

Use the knowledge base below when relevant. If the answer is not in the knowledge base, say so and answer with general best knowledge while making it clear it is not from the documents.

KNOWLEDGE BASE:
${kb || "(no documents available for this domain)"}`;

    // Decide which key to use
    const { data: aiSettings } = await userClient
      .from("user_ai_settings")
      .select("gemini_api_key, use_personal_key")
      .eq("user_id", user.id)
      .maybeSingle();

    async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (e) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : String(e);
          // Only retry on transient 5xx / 429
          if (!/\b(429|5\d{2})\b/.test(msg)) break;
          await new Promise((r) => setTimeout(r, 600 * (i + 1)));
        }
      }
      throw lastErr;
    }

    let reply = "";
    let usedFallback = false;
    const usePersonal = aiSettings?.use_personal_key && aiSettings?.gemini_api_key;
    try {
      if (usePersonal) {
        reply = await withRetry(() =>
          callGeminiDirect(aiSettings!.gemini_api_key!, system, messages),
        );
      } else {
        reply = await withRetry(() => callLovableGateway(system, messages));
      }
    } catch (primaryErr) {
      const primaryMsg =
        primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      console.error("Primary AI call failed:", primaryMsg);

      // If personal key failed, try Lovable gateway as fallback
      if (usePersonal) {
        try {
          reply = await withRetry(() => callLovableGateway(system, messages));
          usedFallback = true;
        } catch (fallbackErr) {
          const fbMsg =
            fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          return new Response(
            JSON.stringify({
              error:
                "The AI service is temporarily unavailable. Please try again in a moment.",
              detail: fbMsg,
              fallback: true,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } else {
        return new Response(
          JSON.stringify({
            error:
              "The AI service is temporarily unavailable. Please try again in a moment.",
            detail: primaryMsg,
            fallback: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    return new Response(
      JSON.stringify({ reply, knowledge_base_docs: kb ? true : false, used_fallback: usedFallback }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("chat-completion error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
