import { z } from "zod";
import { Logger } from "@/utils/logger";

const logger = new Logger("Config:Env");

// Schema for environment variables
const envSchema = z.object({
  NEXT_PUBLIC_VAPI_ID: z.string(),
  NEXT_PUBLIC_VAPI_KEY: z.string(),
  VAPI_PRIVATE_KEY: z.string(),
  OPENAI_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
  FIRECRAWL_KEY: z.string(),
  PINECONE_KEY: z.string(),
  PINECONE_INDEX: z.string(),
  PINECONE_ENV: z.string(),
});

// Function to validate environment variables
const validateEnv = () => {
  try {
    logger.info("Validating environment variables");
    const env = {
      NEXT_PUBLIC_VAPI_ID: process.env.NEXT_PUBLIC_VAPI_ID,
      NEXT_PUBLIC_VAPI_KEY: process.env.NEXT_PUBLIC_VAPI_KEY,
      VAPI_PRIVATE_KEY: process.env.VAPI_PRIVATE_KEY,
      OPENAI_KEY: process.env.OPENAI_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      FIRECRAWL_KEY: process.env.FIRECRAWL_KEY,
      PINECONE_KEY: process.env.PINECONE_KEY,
      PINECONE_INDEX: process.env.PINECONE_INDEX,
      PINECONE_ENV: process.env.PINECONE_ENV,
    };
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((err) => err.path.join("."));
      logger.error("Invalid environment variables", { error: { missingVars } });
      throw new Error(
        `❌ Invalid environment variables: ${missingVars.join(
          ", "
        )}. Please check your .env file`
      );
    }
    throw error;
  }
};

export const env = validateEnv();
