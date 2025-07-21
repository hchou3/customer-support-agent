import FirecrawlApp from "@mendable/firecrawl-js";
import { env } from "@/config/env";
import { Logger } from "@/utils/logger";
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const logger = new Logger("PineconeInsert");
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_KEY!,
});

async function main() {
  const app = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_KEY!,
  });

  const result = await app.scrapeUrl("https://www.aven.com/", {
    formats: ["markdown"],
    onlyMainContent: true,
  });

  logger.info("Scrape result:", result);

  if (!result.success || !result.markdown) {
    throw new Error("Failed to scrape content or no markdown found");
  }

  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: result.markdown,
    outputDimensionality: 768,
  });

  logger.info("Embedding response:", response);

  const namespace = pinecone
    .index(
      process.env.PINECONE_INDEX!,
      `https://${process.env
        .PINECONE_INDEX!}-gsm1if1.svc.aped-4627-b74a.pinecone.io`
    )
    .namespace("aven-embeddings");

  const url = "https://www.aven.com/";
  const pinecone_response = await namespace.upsert([
    {
      id: `${url}-${Date.now()}`,
      values: response.embeddings,
      metadata: {
        chunk_text: result.markdown,
        category: "website",
        url: url,
      },
    },
  ]);

  logger.info("Pinecone upsert response:", pinecone_response);
}

main();
