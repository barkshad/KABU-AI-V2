import mammoth from 'mammoth';
import { ChromaClient } from 'chromadb';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
let chroma: ChromaClient | null = null;
let isChromaAvailable = false;

// Initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export async function initChroma() {
  if (chroma) return;
  chroma = new ChromaClient({ path: CHROMA_URL });
  try {
    await chroma.heartbeat();
    isChromaAvailable = true;
    console.log("✅ ChromaDB connection established.");
  } catch (error) {
    console.warn("⚠️ ChromaDB not reachable. Falling back to in-memory vector store for MVP.");
    isChromaAvailable = false;
  }
}

// In-memory fallback
const memoryStore: Array<{ id: string, embedding: number[], metadata: any, document: string }> = [];
export const documentStatuses: Record<string, string> = {};

function cosineSimilarity(vecA: number[], vecB: number[]) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function parseDocument(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === 'application/pdf') {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = (pdfParseModule as any).default || (pdfParseModule as any);
    const data = await pdfParse(buffer);
    return data.text;
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
    mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (mimetype === 'text/plain' || mimetype.startsWith('text/')) {
    return buffer.toString('utf-8');
  } else {
    // Attempt fallback to string extraction
    return buffer.toString('utf-8');
  }
}

export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  // Basic cleaning
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  while (i < cleanedText.length) {
    chunks.push(cleanedText.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const ai = getAI();
  const embeddings: number[][] = [];
  
  // Note: For large documents in production, batch requests should be made 
  // here to respect rate limits. For MVP, we stream serially if batch fails or use Promise.all 
  // with small concurrency. Using a simple loop.
  for (const text of texts) {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text,
    });
    
    // Fallback logic for embedding response structure depending on SDK version
    const embObj = response.embeddings?.[0];
    const vals = embObj?.values;
    if (vals) {
        embeddings.push(vals);
    }
  }
  return embeddings;
}

export async function storeInChroma(
  collectionName: string,
  documentId: string,
  chunks: string[],
  metadata: Record<string, any>
) {
  documentStatuses[documentId] = metadata.status || "Draft";
  await initChroma();
  const embeddings = await generateEmbeddings(chunks);
  const ids = chunks.map((_, i) => `${documentId}-chunk-${i}-${uuidv4().substring(0,6)}`);
  const metadatas = chunks.map((_, i) => ({
    ...metadata,
    documentId,
    chunkIndex: i,
  }));

  if (isChromaAvailable && chroma) {
    const collection = await chroma.getOrCreateCollection({ name: collectionName });
    await collection.add({
      ids,
      embeddings,
      metadatas,
      documents: chunks,
    });
  } else {
    // Fallback store
    for (let i = 0; i < chunks.length; i++) {
        // Ensure embedding was successfully retrieved before pushing
        if (embeddings[i]) {
            memoryStore.push({
                id: ids[i],
                embedding: embeddings[i],
                metadata: metadatas[i],
                document: chunks[i]
            });
        }
    }
  }

  return { documentId, chunksCount: chunks.length };
}

export async function queryChroma(collectionName: string, queryText: string, nResults = 3, targetDocId: string | null = null) {
  await initChroma();
  
  const ai = getAI();
  const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: queryText,
  });
  
  const queryEmbeddingObj = response.embeddings?.[0];
  const queryEmbedding = queryEmbeddingObj?.values;
  
  if (!queryEmbedding) {
      console.error("Failed to generate query embedding.");
      return [];
  }

  if (isChromaAvailable && chroma) {
    const collection = await chroma.getOrCreateCollection({ name: collectionName });
    try {
        const whereClause = targetDocId ? { documentId: { $eq: targetDocId } } : undefined;
        const results = await collection.query({
            queryEmbeddings: [queryEmbedding], // Must be an array of embedding vectors
            nResults,
            where: whereClause
        });

        const finalResults = [];
        // Chroma's JS client returns deeply nested array structures for queries
        if (results.documents && results.documents[0] && results.metadatas && results.metadatas[0]) {
            for (let i = 0; i < results.documents[0].length; i++) {
                const meta = results.metadatas[0][i];
                if (meta) {
                  const isPublished = documentStatuses[meta.documentId as string] === "Published";
                  if (targetDocId === meta.documentId || isPublished) {
                    finalResults.push({
                        document: results.documents[0][i],
                        metadata: meta
                    });
                  }
                }
            }
        }
        return finalResults;
    } catch(err) {
        console.error("Chroma query error", err);
        return [];
    }
  } else {
    // Fallback search
    const scored = memoryStore
      .filter(item => {
         const isPublished = documentStatuses[item.metadata.documentId] === "Published";
         return targetDocId === item.metadata.documentId || isPublished;
      })
      .map(item => ({
        ...item,
        score: cosineSimilarity(queryEmbedding, item.embedding)
    }));
    
    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);
    
    // Take top n
    return scored.slice(0, nResults).map(item => ({
        document: item.document,
        metadata: item.metadata
    }));
  }
}
