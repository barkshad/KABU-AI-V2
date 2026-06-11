import express from "express";
import path from "path";
import multer from "multer";
import { parseDocument, chunkText, storeInChroma, queryChroma, documentStatuses } from "./src/lib/rag";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

let dynamicGeminiKey = "";
let dynamicKimiKey = "";

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/setup", (req, res) => {
    if (req.body.geminiKey) dynamicGeminiKey = req.body.geminiKey;
    if (req.body.kimiKey) dynamicKimiKey = req.body.kimiKey;
    res.json({ success: true });
  });

  // Upload endpoint
  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const docId = req.body.documentId || `doc-${Date.now()}`;
      const status = req.body.status || "Draft";
      const text = await parseDocument(req.file.buffer, req.file.mimetype);
      const chunks = chunkText(text, 1000, 200);
      
      // Store status in metadata
      await storeInChroma("kabu-ai-docs", docId, chunks, {
        title: req.file.originalname,
        filename: req.file.originalname,
        status: status
      });

      res.json({ message: "File uploaded successfully", documentId: docId });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed", details: error.message });
    }
  });

  // Update document status
  app.post("/api/documents/status", async (req, res) => {
     try {
       const { documentId, status } = req.body;
       if (documentId && status) {
         documentStatuses[documentId] = status;
       }
       res.json({ success: true });
     } catch(e) {
       res.status(500).json({ error: "Failed" });
     }
  });

  app.post("/api/documents/summarize", async (req, res) => {
    try {
      const { documentId, eli5 } = req.body;
      if (!documentId) return res.status(400).json({ error: "Missing documentId" });
      
      const results = await queryChroma("kabu-ai-docs", "Summary Introduction Themes", 10, documentId);
      let context = "";
      if (results && results.length > 0) {
          context = results.map((r: any) => r.document).join("\n\n---\n\n");
      }

      if (!context) {
         return res.json({ summary: "Not enough document content found to generate a summary." });
      }

      const prompt = eli5 
      ? `Please explain the following document content in very simple terms, as if explaining to a 5-year-old. Use analogies and simple language. Keep it brief.

Context:
${context}`
      : `Please provide a concise but comprehensive summary of the following document content. Highlight the main topic, key points, and any conclusions.

Context:
${context}`;

      const geminiApiKey = (req.headers['x-gemini-api-key'] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
         return res.json({ summary: "GEMINI_API_KEY is missing. Please configure your environment variables." });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const _ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await _ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: prompt
      });
      
      res.json({ summary: response.text });
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to summarize" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, documentId, history = [], aiMode = "HYBRID" } = req.body;

      let context = "";
      let sources: { title: string }[] = [];
      let currentMode = aiMode;
      
      let allowInternet = true;
      
      const geminiApiKey = (req.headers['x-gemini-api-key'] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
         if (!res.headersSent) {
            res.write("data: Error: Missing GEMINI_API_KEY environment variable.\n\n");
            res.end();
            return;
         }
      }

      const { GoogleGenAI } = await import("@google/genai");
      const _ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const kimiApiKey = (req.headers['x-kimi-api-key'] as string) || dynamicKimiKey || process.env.KIMI_API_KEY;

      if (message) {
        // Step 1: Retrieval Setup if requested mode is RAG or HYBRID
        if (currentMode === "RAG" || currentMode === "HYBRID") {
          try {
            const results = await queryChroma("kabu-ai-docs", message, 5, documentId);
            if (results && results.length > 0) {
                context = results.map((r: any) => r.document).join("\n\n---\n\n");
                const uniqueTitles = new Set<string>();
                results.forEach((r: any) => {
                    if (r.metadata && r.metadata.title) {
                        uniqueTitles.add(r.metadata.title);
                    }
                });
                sources = Array.from(uniqueTitles).map(t => ({ title: t }));
            }
          } catch (e: any) {
             console.warn("Chroma query failed:", e.message);
          }
        }
      }

      let systemPrompt = "";
      let finalPrompt = "";
      let toolsConfig: any = undefined;

      if (currentMode === "RAG") {
        if (!context) {
           systemPrompt = "You are Kabu AI, an academic research assistant for Kabarak University. You MUST ONLY use the provided context. If context is empty, say exactly 'No relevant documents found.' Do not use any outside knowledge.";
           finalPrompt = `CONTEXT:\nNone\n\nQUESTION:\n${message}`;
        } else {
          systemPrompt = "You are Kabu AI, an academic research assistant for Kabarak University. You MUST ONLY use the provided context to answer the user's question. Write in a ghost writing style—natural, human, not robotic. If the context does not contain the answer, say 'I could not find the answer in the uploaded materials.'";
          finalPrompt = `CONTEXT:\n${context}\n\nQUESTION:\n${message}`;
        }
      } else if (currentMode === "INTERNET") {
        systemPrompt = "You are Kabu AI. Respond directly to the user's query utilizing internet search capabilities. Maintain a professional, academic tone.";
        finalPrompt = message;
        toolsConfig = [{ googleSearch: {} }];
      } else {
        // HYBRID MODE
        systemPrompt = "You are Kabu AI, a highly capable academic assistant. You have access to university documents (Context) and can also use general reasoning/web search if needed to provide a complete answer. Prioritize the context if it is relevant.";
        finalPrompt = `CONTEXT:\n${context || "No context found."}\n\nQUESTION:\n${message}`;
        toolsConfig = [{ googleSearch: {} }];
      }

      // Set headers for SSE stream
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      res.write(`data: ${JSON.stringify({ sources, mode: currentMode })}\n\n`);

      const formattedHistory = history
        .filter((m: any) => m.role === 'user' || m.role === 'model')
        .map((m: any) => ({
           role: m.role,
           parts: [{ text: m.content }]
        }));

      // In HYBRID or RAG we use Gemini for reasoning, or maybe Kimi if available. Let's design it: 
      // If Kimi API is available and mode is not internet-driven googleSearch, we can route it. 
      // But we need google search for internet mode. GoogleGenAI uses toolsConfig. 
      // So if internet is enabled, we MUST use GoogleGenAI.
      // If RAG only, we can use Kimi if available.
      if (currentMode === "RAG" && kimiApiKey) {
         try {
           const kimiHistory = history.map((m: any) => ({
             role: m.role === 'model' ? 'assistant' : m.role,
             content: m.content
           }));
           
           const fetchRes = await fetch("https://api.moonshot.ai/v1/chat/completions", {
              method: "POST",
              headers: {
                 "Content-Type": "application/json",
                 "Authorization": `Bearer ${kimiApiKey}`
              },
              body: JSON.stringify({
                 model: "moonshot-v1-8k",
                 messages: [
                    { role: "system", content: systemPrompt },
                    ...kimiHistory.slice(0, -1),
                    { role: "user", content: finalPrompt }
                 ],
                 stream: true
              })
           });
           
           if (fetchRes.ok && fetchRes.body) {
              const reader = fetchRes.body.getReader();
              const decoder = new TextDecoder();
              while (true) {
                 const { done, value } = await reader.read();
                 if (done) break;
                 const chunk = decoder.decode(value);
                 const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
                 for (const line of lines) {
                    if (line === 'data: [DONE]') break;
                    try {
                       const data = JSON.parse(line.substring(6));
                       const text = data.choices[0]?.delta?.content || "";
                       if (text) res.write(text);
                    } catch (e) {}
                 }
              }
           }
         } catch (e) {
           console.error("Kimi error:", e);
           res.write("Kimi AI failed to generate a response. Attempting fallback...");
         }
      } else {
         try {
            const aiModel = 'gemini-2.5-flash'; // more robust model

            const responseStream = await _ai.models.generateContentStream({
              model: aiModel,
              contents: [
                 ...formattedHistory.slice(0, -1),
                 { role: 'user', parts: [{ text: finalPrompt }]}
              ],
              config: {
                 systemInstruction: systemPrompt,
                 tools: toolsConfig
              }
            });

            for await (const chunk of responseStream) {
               if (chunk.text) {
                  res.write(chunk.text);
               }
            }
         } catch (genErr: any) {
            console.error("Gemini Generation Error:", genErr);
            res.write(`\n\n[Model Error]: ${genErr.message}\n`);
         }
      }
      res.end();

    } catch (error: any) {
      console.error("Chat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to generate response" });
      } else {
        res.end();
      }
    }
  });

  // Generate Flashcards endpoint
  app.post("/api/flashcards/generate", async (req, res) => {
    try {
      const { topic, documentId } = req.body;
      
      let context = "";
      if (documentId) {
         try {
             // In a real app we'd retrieve the whole sequence of chunks or specific chunks based on topic
             const results = await queryChroma("kabu-ai-docs", topic || "Summary", 10, documentId);
             if (results && results.length > 0) {
                 context = results.map((r: any) => r.document).join("\n\n---\n\n");
             }
         } catch(e) {}
      }

      const prompt = `Generate exactly 5 advanced study flashcards about the following topic or context.
Topic: ${topic || "General Knowledge"}
Context: ${context || "None provided. Use general knowledge."}

Return the output as a valid JSON array of objects, where each object has a 'question' and 'answer' field. Do not include any markdown fences.
EXAMPLE:
[
  { "question": "What is the capital of Kenya?", "answer": "Nairobi" }
]
`;

      const geminiApiKey = (req.headers['x-gemini-api-key'] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
         return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const _ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const response = await _ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: prompt
      });
      const text = response.text || "";

      let parsed = [];
      try {
         parsed = JSON.parse(text.trim().replace(/^```json/,'').replace(/```$/,''));
      } catch(e) {
         parsed = [{ question: "Error generating flashcards", answer: "The AI did not return valid JSON format." }];
      }

      res.json({ flashcards: parsed });
    } catch (error: any) {
      console.error("Flashcards error:", error);
      res.status(500).json({ error: error.message || "Failed to generate flashcards" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled Global Error:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
