import type { AIIntent, Product } from "./types";

/**
 * MOCK Gemini service. Replace with a Supabase Edge Function or
 * createServerFn that calls Gemini 1.5 Flash with the audio/text
 * payload and asks for the same structured JSON shape.
 *
 * Expected real Edge Function signature:
 *   POST /functions/v1/parse-stock-update
 *   body: { text?: string, audioBase64?: string, mimeType?: string }
 *   returns: AIIntent
 */
export async function mockParseStockUpdate(
  input: { text?: string; audioBase64?: string },
  products: Product[],
): Promise<AIIntent> {
  await new Promise((r) => setTimeout(r, 900));

  const haystack = (input.text ?? "").toLowerCase();

  // naive product match
  let product = products.find((p) =>
    haystack && p.name.toLowerCase().split(" ").some((w) => w.length > 3 && haystack.includes(w.toLowerCase())),
  );
  if (!product) product = products[0];

  // extract a number
  const num = haystack.match(/(\d+)/);
  const qty = num ? parseInt(num[1], 10) : 5;

  // detect status keywords
  if (/critic|finit|esaurit|zero/.test(haystack)) {
    return {
      product_id: product.id,
      product_name: product.name,
      update_type: "STATUS_ONLY",
      absolute_quantity: null,
      status_flag: "RED",
    };
  }
  if (/poco|quasi finit|esaurimento|basso/.test(haystack)) {
    return {
      product_id: product.id,
      product_name: product.name,
      update_type: "STATUS_ONLY",
      absolute_quantity: null,
      status_flag: "YELLOW",
    };
  }

  return {
    product_id: product.id,
    product_name: product.name,
    update_type: "ABSOLUTE",
    absolute_quantity: qty,
    status_flag: null,
  };
}