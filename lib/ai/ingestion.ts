import pdf from "pdf-parse";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { generateBatchEmbeddings } from "./openrouter";

export interface Chunk {
  text: string;
  index: number;
  hash: string;
}

export function chunkText(text: string, size: number = 800, overlap: number = 100): Chunk[] {
  const chunks: Chunk[] = [];
  const words = text.split(/\s+/);
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + size, words.length);
    const content = words.slice(start, end).join(" ");
    const hash = crypto.createHash("md5").update(content).digest("hex");
    
    chunks.push({
      text: content,
      index: chunks.length,
      hash: hash,
    });

    if (end === words.length) break;
    start += size - overlap;
  }

  return chunks;
}

export async function ingestFileAsset(fileAssetId: string, buffer: Buffer) {
  const data = await pdf(buffer);
  const text = data.text;
  const chunks = chunkText(text);

  const fileAsset = await prisma.fileAsset.findUnique({
    where: { id: fileAssetId },
  });

  if (!fileAsset) throw new Error("FileAsset not found");

  // Filter chunks that haven't changed (if re-ingesting)
  const existingChunks = await prisma.guideChunk.findMany({
    where: { fileAssetId },
    select: { chunkHash: true },
  });

  const existingHashes = new Set(existingChunks.map((c) => c.chunkHash));
  const newChunks = chunks.filter((c) => !existingHashes.has(c.hash));

  if (newChunks.length === 0) return;

  // Generate embeddings for new chunks
  const embeddings = await generateBatchEmbeddings(newChunks.map((c) => c.text));

  // Store chunks with vectors
  // We use raw query for pgvector insert
  for (let i = 0; i < newChunks.length; i++) {
    const chunk = newChunks[i];
    const vector = embeddings[i];

    await prisma.$executeRawUnsafe(`
      INSERT INTO "GuideChunk" (
        id, "fileAssetId", "chunkText", "chunkIndex", "chunkHash", 
        "embeddingModel", dimensions, embedding, "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::vector, NOW()
      )
    `, 
    crypto.randomUUID(), 
    fileAssetId, 
    chunk.text, 
    chunk.index, 
    chunk.hash, 
    "google/text-embedding-004", 
    768, 
    `[${vector.join(",")}]`
    );
  }

  await prisma.fileAsset.update({
    where: { id: fileAssetId },
    data: { ingestedAt: new Date(), version: { increment: 1 } },
  });
}

