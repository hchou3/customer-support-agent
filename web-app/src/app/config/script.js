import Exa from "exa-js";
import { env } from "./../config/env";
import { Pinecone } from "@pinecone-database/pinecone";

const pa_index = env.PINECONE_INDEX;
const exa = new Exa({
  apiKey: env.EXA_API_KEY,
});

export const pinecone = new Pinecone({
  apiKey: env.PINECONE_API_KEY,
  environment: env.PINECONE_ENVIRONMENT, // e.g., "us-west1-gcp"
});

export async function scrapeWebPage(url) {
  const result = await exa.getContents([url], {
    text: true,
    context: true,
  });

  return result.contents[0].text;
}

export async function upsertWebPageToPinecone(url, text) {
  const index = pinecone.Index(pa_index);
  const chunks = chunkText(text);
  const vectors = await Promise.all(
    chunks.map(async (chunk, i) => ({
      id: `${url}-chunk-${i}`,
      values: await getEmbeddings(chunk),
      metadata: { url, chunk },
    }))
  );
  await index.upsert({ vectors });
}

export async function queryPinecone(query) {
  const index = pinecone.Index(pa_index);
  const queryEmbedding = await getEmbeddings(query);
  const result = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
  });
  return result.matches?.map((match) => match.metadata?.chunk);
}
