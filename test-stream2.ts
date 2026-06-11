import { streamText } from 'ai';
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

async function run() {
  const result = streamText({
    model: google('gemini-2.5-flash'),
    prompt: "Say Hi"
  });
  
  const fakeRes = {
    writeHead: () => {},
    setHeader: () => {},
    write: (chunk: any) => console.log("RES WRITE:", chunk.toString()),
    end: () => console.log("RES END")
  };
  // @ts-ignore
  result.pipeTextStreamToResponse(fakeRes);
}
run();
