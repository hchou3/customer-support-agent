import dotenv from "dotenv";
dotenv.config();
import { z } from "zod";
import { Logger } from "@/app/utils/logger";

const logger = new Logger("Config:Env");

const envSchema = z.object({
  VAPI_PUBLIC_KEY: z.string(),
  EXA_API_KEY: z.string(),
  PINECONE_INDEX: z.string(),
});

// Function to validate environment variables
const validateEnv = () => {
  try {
    logger.info("Validating environment variables");
    const env = {
      VAPI_PUBLIC_KEY: process.env.VAPI_PUBLIC_KEY,
      EXA_API_KEY: process.env.EXA_API_KEY,
      PINECONE_INDEX: process.env.PINECONE_INDEX,
    };
    const parsed = envSchema.parse(env);
    logger.info("Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join("."));
      logger.error("Invalid environment variables", { missingVars });
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
