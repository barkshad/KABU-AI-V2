import { streamText, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

async function run() {
  try {
    const result = streamText({
      model: google('gemini-3.5-flash'),
      prompt: "Hello"
    });
    console.log("Result type:", typeof result, result);
    // @ts-ignore
    result.pipeTextStreamToResponse(null);
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}
run();
