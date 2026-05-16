import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const InputSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  audioBase64: z.string().max(8_000_000).optional(),
  audioMime: z.string().max(64).optional(),
  products: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        unit: z.string(),
      }),
    )
    .min(1)
    .max(500),
});

const IntentSchema = z.object({
  product_id: z.string().describe("The id of the matched product from the provided list"),
  product_name: z.string().describe("The matched product's name"),
  update_type: z.enum(["ABSOLUTE", "STATUS_ONLY"]).describe(
    "ABSOLUTE when the user reports a specific quantity received or counted; STATUS_ONLY when only stock status is implied (running low / out)",
  ),
  absolute_quantity: z.number().nullable().describe("New stock quantity if ABSOLUTE, else null"),
  status_flag: z
    .enum(["YELLOW", "RED"])
    .nullable()
    .describe("YELLOW = running low, RED = out of stock. Set only when update_type is STATUS_ONLY."),
});

export const parseStockUpdate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    if (!data.text && !data.audioBase64) throw new Error("Provide text or audio");

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway("google/gemini-2.5-flash");

    const productList = data.products
      .map((p) => `- id: ${p.id} | name: ${p.name} | unit: ${p.unit}`)
      .join("\n");

    const system = `You are STOCKAI, an Italian HORECA inventory assistant.
Parse the user's message (Italian) into a structured stock update for ONE product.

Rules:
- product_id MUST be one of the ids in the list below — match by closest name. If nothing matches well, pick the most likely.
- update_type ABSOLUTE: the user reports a number ("ho ricevuto 5 casse", "ne abbiamo 12", "12 bottiglie"). absolute_quantity = that number.
- update_type STATUS_ONLY: the user only describes status ("è quasi finito", "è critico", "siamo a zero", "finito"). status_flag YELLOW for low, RED for empty.
- Always return both product_id and product_name from the provided list.

Available products:
${productList}`;

    try {
      const userParts: Array<
        { type: "text"; text: string } | { type: "file"; data: string; mediaType: string }
      > = [];
      if (data.text) userParts.push({ type: "text", text: data.text });
      if (data.audioBase64) {
        userParts.push({
          type: "file",
          data: data.audioBase64,
          mediaType: data.audioMime || "audio/webm",
        });
        userParts.push({
          type: "text",
          text: "Transcribe and interpret the audio as a stock update.",
        });
      }

      const { object } = await generateObject({
        model,
        schema: IntentSchema,
        system,
        messages: [{ role: "user", content: userParts }],
      });

      // safety: ensure product_id is in the list
      const valid = data.products.find((p) => p.id === object.product_id);
      if (!valid) {
        return {
          ok: true as const,
          intent: { ...object, product_id: data.products[0].id, product_name: data.products[0].name },
        };
      }
      return { ok: true as const, intent: { ...object, product_name: valid.name } };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const status = (err as { statusCode?: number; status?: number })?.statusCode ?? (err as { status?: number })?.status;
      if (status === 429) return { ok: false as const, error: "rate_limit", message: "Troppe richieste, riprova tra poco." };
      if (status === 402) return { ok: false as const, error: "credits", message: "Crediti Lovable AI esauriti." };
      return { ok: false as const, error: "generic", message: msg };
    }
  });