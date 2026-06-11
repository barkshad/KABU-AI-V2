import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { parseDocument, chunkText, storeInChroma, queryChroma, documentStatuses } from "./src/lib/rag";
import { GeminiService } from "./src/services/gemini";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Transient/Environment Configuration overrides
  let dynamicGeminiKey = "";
  let activeModel = process.env.AI_MODEL || "gemini-2.5-flash";

  // Pre-seed some mock CMS data in-memory if needed (will serialize to client-side database too)
  let cmsSettings = {
    siteName: "Kabu AI",
    siteDescription: "The Premium AI Research & Study Hub of Kabarak University",
    contactEmail: "support@kabarak.ac.ke",
    contactPhone: "+254 700 000000",
    themeMode: "light",
    primaryColor: "#0f172a", // Slate-900
    accentColor: "#f59e0b", // Amber-500
    logoUrl: "",
    faviconUrl: "",
    footerText: "© 2026 Kabarak University. Powered by Google Gemini AI.",
    navigation: [
      { id: "nav-home", label: "Dashboard", path: "/" },
      { id: "nav-chat", label: "Research Chat", path: "/chat" },
      { id: "nav-analyze", label: "Analyze Doc", path: "/analyze" },
      { id: "nav-flashcards", label: "Flashcards", path: "/flashcards" },
      { id: "nav-resources", label: "Resources", path: "/resources" }
    ],
    mfaRequired: false,
    rateLimitingEnabled: true,
    csrfProtectionPreview: true
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", engine: "Google Gemini", activeModel });
  });

  // Setup Key and Engine config
  app.post("/api/setup", (req, res) => {
    if (req.body.geminiKey) {
      dynamicGeminiKey = req.body.geminiKey;
      console.log("[Setup] Received dynamic Gemini Key update.");
    }
    if (req.body.model) {
      activeModel = req.body.model;
      console.log(`[Setup] Set active AI model: ${activeModel}`);
    }
    res.json({ success: true, model: activeModel });
  });

  // Test Gemini API Connection Route
  app.post("/api/gemini/test-connection", async (req, res) => {
    try {
      const geminiApiKey = (req.headers["x-gemini-api-key"] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(400).json({ success: false, error: "Missing GEMINI_API_KEY. Please set it in the Setup panel first." });
      }

      console.log(`[Gemini Test] Evaluating connection with model: ${activeModel}...`);
      const { GoogleGenAI } = await import("@google/genai");
      const testClient = new GoogleGenAI({ apiKey: geminiApiKey });

      const response = await testClient.models.generateContent({
        model: activeModel,
        contents: "You are the AI engine. Reply strictly with the word 'CONNECTED' and nothing else."
      });

      const reply = (response.text || "").trim();
      res.json({ success: true, response: reply });
    } catch (err: any) {
      console.error("[Gemini Test] Error checking connection state:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to establish handshake." });
    }
  });

  // Upload endpoint
  app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const docId = req.body.documentId || `doc-${Date.now()}`;
      const status = req.body.status || "Draft";
      const gKey = (req.headers["x-gemini-api-key"] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;

      const text = await parseDocument(req.file.buffer, req.file.mimetype);
      const chunks = chunkText(text, 1000, 200);
      
      // Store status in metadata using the active key for vector embeddings
      await storeInChroma("kabu-ai-docs", docId, chunks, {
        title: req.file.originalname,
        filename: req.file.originalname,
        status: status
      }, gKey);

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

  // Summarize endpoint
  app.post("/api/documents/summarize", async (req, res) => {
    try {
      const { documentId, eli5 } = req.body;
      if (!documentId) return res.status(400).json({ error: "Missing documentId" });
      
      const geminiApiKey = (req.headers["x-gemini-api-key"] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
         return res.json({ summary: "GEMINI_API_KEY is missing. Please configure it in your Setup screen." });
      }

      const results = await queryChroma("kabu-ai-docs", "Summary Introduction Themes", 10, documentId, geminiApiKey);
      let context = "";
      if (results && results.length > 0) {
          context = results.map((r: any) => r.document).join("\n\n---\n\n");
      }

      if (!context) {
         return res.json({ summary: "Not enough document content found in materials to generate a summary." });
      }

      const prompt = eli5 
      ? `Please explain the following document content in very simple terms, as if explaining to a 5-year-old. Use analogies and simple language. Keep it brief.\n\nContext:\n${context}`
      : `Provide a highly summary of the following document content. Highlight the main topic, main ideas, and any critical conclusions.\n\nContext:\n${context}`;

      // Temporarily write the selected model name to process.env.AI_MODEL so Service binds to it
      process.env.AI_MODEL = activeModel;
      const geminiService = GeminiService.getInstance();
      const summary = await geminiService.generateContent(prompt, geminiApiKey);
      
      res.json({ summary });
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ error: "Failed to summarize" });
    }
  });

  // Chat endpoint (Google Gemini SSE Stream)
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, documentId, history = [], aiMode = "HYBRID" } = req.body;

      let context = "";
      let sources: { title: string }[] = [];
      const currentMode = aiMode;
      
      const geminiApiKey = (req.headers["x-gemini-api-key"] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
         res.setHeader("Content-Type", "text/event-stream");
         res.write("data: Error: Missing GEMINI_API_KEY credentials. Please go to Setup of this app to authorize the model.\n\n");
         res.end();
         return;
      }

      if (message) {
        if (currentMode === "RAG" || currentMode === "HYBRID") {
          try {
            const results = await queryChroma("kabu-ai-docs", message, 5, documentId, geminiApiKey);
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
             console.warn("Chroma query run failure:", e.message);
          }
        }
      }

      let systemPrompt = "";
      let finalPrompt = "";
      let toolsConfig: any = undefined;

      if (currentMode === "RAG") {
        if (!context) {
           systemPrompt = "You are Kabu AI, an academic research assistant for Kabarak University. You MUST ONLY use the provided context. If context is empty, respond exactly with 'No relevant documents found.' Do not elaborate with outside knowledge.";
           finalPrompt = `CONTEXT:\nNone\n\nQUESTION:\n${message}`;
        } else {
           systemPrompt = "You are Kabu AI, an academic research assistant for Kabarak University. You MUST ONLY use the provided context to answer the user's question. Write in a clean, natural ghostwriting voice. If the context does not contain the answer, say 'I could not find the answer in the uploaded materials.'";
           finalPrompt = `CONTEXT:\n${context}\n\nQUESTION:\n${message}`;
        }
      } else if (currentMode === "INTERNET") {
        systemPrompt = "You are Kabu AI. Respond directly to the user's query utilizing search grounding. Keep details comprehensive and scholarly.";
        finalPrompt = message;
        toolsConfig = [{ googleSearch: {} }];
      } else {
        // HYBRID MODE
        systemPrompt = "You are Kabu AI, a highly capable academic assistant. You have access to university documents (Context) and can also use general reasoning/web search if needed to provide a complete answer. Prioritize the context if it is relevant.";
        finalPrompt = `CONTEXT:\n${context || "No context found."}\n\nQUESTION:\n${message}`;
        toolsConfig = [{ googleSearch: {} }];
      }

      // Configure response SSE stream
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ sources, mode: currentMode })}\n\n`);

      const formattedHistory = history
        .filter((m: any) => m.role === "user" || m.role === "model")
        .map((m: any) => ({
           role: m.role,
           parts: [{ text: m.content }]
        }));

      process.env.AI_MODEL = activeModel;
      const geminiService = GeminiService.getInstance();

      try {
         const responseStream = await geminiService.generateContentStream(
            [
               ...formattedHistory.slice(0, -1),
               { role: "user", parts: [{ text: finalPrompt }]}
            ],
            geminiApiKey,
            systemPrompt,
            toolsConfig
         );

         for await (const chunk of responseStream) {
            if (chunk.text) {
               res.write(chunk.text);
            }
         }
      } catch (genErr: any) {
         console.error("[Gemini Chat Flow Error]:", genErr);
         res.write(`\n\n[Model Error]: ${genErr.message || "Failed stream generation"}\n`);
      }
      res.end();

    } catch (error: any) {
      console.error("Chat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed response loop." });
      } else {
        res.end();
      }
    }
  });

  // Generate Flashcards endpoint
  app.post("/api/flashcards/generate", async (req, res) => {
    try {
      const { topic, documentId } = req.body;
      
      const geminiApiKey = (req.headers["x-gemini-api-key"] as string) || dynamicGeminiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
         return res.status(400).json({ error: "Missing GEMINI_API_KEY Credentials. Please visit setup." });
      }

      let context = "";
      if (documentId) {
         try {
              const results = await queryChroma("kabu-ai-docs", topic || "Summary", 10, documentId, geminiApiKey);
              if (results && results.length > 0) {
                  context = results.map((r: any) => r.document).join("\n\n---\n\n");
              }
         } catch(e) {}
      }

      const prompt = `Generate exactly 5 advanced study flashcards about the following topic or context.
Topic: ${topic || "General Knowledge"}
Context: ${context || "None provided. Use general knowledge."}

Return the output as a valid and clean JSON array of objects, where each object has a 'question' and 'answer' field. Do not include any markdown fences or triple backticks.
EXAMPLE:
[
  { "question": "What is the capital of Kenya?", "answer": "Nairobi" }
]
`;

      process.env.AI_MODEL = activeModel;
      const geminiService = GeminiService.getInstance();
      const text = await geminiService.generateContent(prompt, geminiApiKey);

      let parsed = [];
      try {
         const cleanedText = text.trim().replace(/^```json/i, "").replace(/```$/i, "").trim();
         parsed = JSON.parse(cleanedText);
      } catch(e) {
         console.warn("[Flashcards Parser] Fallback required due to layout formatting:", text);
         parsed = [
           { question: `Advanced question about ${topic || "University study"}`, answer: "View uploaded documents to analyze." }
         ];
      }

      res.json({ flashcards: parsed });
    } catch (error: any) {
      console.error("Flashcards generate error:", error);
      res.status(500).json({ error: error.message || "Failed study generation" });
    }
  });

  // CMS Settings Endpoint
  app.get("/api/cms/settings", (req, res) => {
    res.json(cmsSettings);
  });

  app.post("/api/cms/settings", (req, res) => {
    cmsSettings = { ...cmsSettings, ...req.body };
    console.log("[CMS] Configuration updated dynamically!");
    res.json({ success: true, settings: cmsSettings });
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
    console.log(`[Kabu AI Server] Node platform bound to port ${PORT} with Google Gemini Engine.`);
  });
}

startServer();
