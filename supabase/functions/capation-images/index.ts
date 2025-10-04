// caption-image/index.ts
// Supabase Edge Function: Accepts { photo_url } and returns OpenAI response describing the image.
// Make sure to set OPENAI_API_KEY in your Supabase project secrets.
Deno.serve(async (req)=>{
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({
        error: "Only POST allowed"
      }), {
        status: 405,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({
        error: "Expected application/json"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const body = await req.json().catch(()=>({}));
    const photo_url = body?.photo_url;
    if (!photo_url || typeof photo_url !== "string") {
      return new Response(JSON.stringify({
        error: "Missing or invalid photo_url"
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: "OpenAI API key not configured"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    // Build a prompt asking the model to describe/caption the image at the provided URL.
    const systemPrompt = "You are an assistant that creates short image captions and descriptive alt text.";
    const userPrompt = `Provide a concise caption (max 20 words) and a 1-sentence descriptive alt text for the image at this URL:\n${photo_url}\nReturn JSON: { "caption": "...", "alt_text": "..." }`;
    // Use OpenAI Chat Completions endpoint. Adjust model as needed.
    const openAiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });
    if (!openAiResp.ok) {
      const text = await openAiResp.text();
      return new Response(JSON.stringify({
        error: "OpenAI API error",
        details: text
      }), {
        status: 502,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const openAiJson = await openAiResp.json();
    // Extract assistant content
    const assistantMessage = openAiJson?.choices?.[0]?.message?.content ?? openAiJson?.choices?.[0]?.text ?? null;
    // Attempt to parse JSON from assistant; fallback to raw text
    let parsed = {};
    if (assistantMessage) {
      try {
        // Some models may return code-blocks or plain text; try to pull JSON substring
        const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
        const jsonText = jsonMatch ? jsonMatch[0] : assistantMessage;
        parsed = JSON.parse(jsonText);
      } catch  {
        // fallback: return raw text as 'raw'
        parsed = {
          caption: undefined,
          alt_text: undefined
        };
      }
    }
    const responsePayload = {
      ok: true,
      raw: assistantMessage,
      caption: parsed.caption ?? null,
      alt_text: parsed.alt_text ?? null
    };
    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({
      error: "Internal server error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
});
