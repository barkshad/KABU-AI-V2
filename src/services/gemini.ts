import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private static instance: GeminiService | null = null;
  private client: GoogleGenAI | null = null;
  private currentApiKey: string | null = null;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Initialize or reuse global GoogleGenAI client with the specified API key
   */
  public getClient(apiKey?: string): GoogleGenAI {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY is missing. Please configure it in the Setup panel or environment variables.");
    }

    if (this.client && this.currentApiKey === key) {
      return this.client;
    }

    console.log("[Gemini] Initializing new GoogleGenAI client instance.");
    this.currentApiKey = key;
    this.client = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    return this.client;
  }

  /**
   * Gets the configurable active model from environment variables or custom CMS settings
   */
  public getModelName(): string {
    return process.env.AI_MODEL || "gemini-3.5-flash";
  }

  /**
   * Standard generator with automatic retry mechanism
   */
  public async generateContent(prompt: string, apiKey?: string, systemInstruction?: string): Promise<string> {
    const client = this.getClient(apiKey);
    const model = this.getModelName();

    let attempt = 0;
    const maxRetries = 2;
    const baseDelay = 1000;

    while (attempt <= maxRetries) {
      try {
        console.log(`[Gemini] Generating content: ${model} (attempt ${attempt + 1}/${maxRetries + 1})`);
        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: systemInstruction ? { systemInstruction } : undefined,
        });

        const reply = response.text || "";
        return reply;
      } catch (err: any) {
        attempt++;
        if (attempt > maxRetries) {
          console.error(`[Gemini] Failed after ${maxRetries} retries:`, err);
          throw new Error(`Gemini operation failed: ${err.message}`);
        }
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[Gemini] Error: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error("Failed to generate content after retries.");
  }

  /**
   * Chat streams with custom history payload
   */
  public async generateContentStream(contents: any[], apiKey?: string, systemInstruction?: string, tools?: any[]) {
    const client = this.getClient(apiKey);
    const model = this.getModelName();

    try {
      console.log(`[Gemini] Starting content stream: ${model}`);
      const stream = await client.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction,
          tools,
        }
      });
      return stream;
    } catch (err: any) {
      console.error("[Gemini] Failed to start content stream:", err);
      throw new Error(`Gemini stream failed: ${err.message}`);
    }
  }
}
