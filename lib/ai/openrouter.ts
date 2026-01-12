import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const model = openrouter("google/gemini-3-flash-preview");

export async function generateEmbeddings(text: string) {
  // Use OpenRouter's embeddings API if available, or fallback to a standard one
  // Note: OpenRouter supports various embedding models. 
  // We'll use a common one or the one specified by the user.
  // Gemini embedding model is text-embedding-004.
  
  const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/text-embedding-004", // 768 dimensions
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenRouter Embeddings Error: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  return result.data[0].embedding as number[];
}

export async function generateBatchEmbeddings(texts: string[]) {
  // Batch processing with throttling if needed
  const embeddings: number[][] = [];
  for (const text of texts) {
    const emb = await generateEmbeddings(text);
    embeddings.push(emb);
    // Add small delay to avoid rate limiting if necessary
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return embeddings;
}

