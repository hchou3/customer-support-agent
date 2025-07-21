import { NextResponse, NextRequest } from "next/server";
import { Logger } from "@/utils/logger";
import { env } from "@/config/env";
import OpenAI from "openai";

const logger = new Logger("API:ChatCompletions");

// Allowed Gemini models
const ALLOWED_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
];

const gemini = new OpenAI({
  apiKey: env.GOOGLE_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(req: NextRequest) {
  logger.info("=== Starting chat completions API request ===");

  if (req.method !== "POST") {
    logger.error("Invalid HTTP method", { method: req.method });
    return NextResponse.json({ message: "Not Found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    const {
      model,
      messages,
      max_tokens,
      temperature,
      stream,
      call,
      ...restParams
    } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logger.error("Invalid messages array", { messages });
      return NextResponse.json(
        { error: "Messages array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Enforce allowed Gemini models
    const selectedModel = model || "gemini-1.5-flash";
    if (!ALLOWED_MODELS.includes(selectedModel)) {
      logger.error("Unsupported model requested", { requestedModel: model });
      return NextResponse.json(
        {
          error: `Model '${model}' is not supported. Allowed models: ${ALLOWED_MODELS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];

    const prompt = await gemini.chat.completions.create({
      model: "gemini-2.0-flash-lite",
      messages: [
        {
          role: "user",
          content: `
      Create a prompt which can act as a prompt templete where I put the original prompt and it can modify it according to my intentions so that the final modified prompt is more detailed.You can expand certain terms or keywords.
      ----------
      PROMPT: ${lastMessage.content}.
      MODIFIED PROMPT: `,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const modifiedMessage = [
      ...messages.slice(0, messages.length - 1),
      { ...lastMessage, content: prompt.choices[0].message.content },
    ];

    if (stream) {
      const completionStream = await gemini.chat.completions.create({
        model: selectedModel,
        messages: modifiedMessage,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: true,
      } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);

      // Create a ReadableStream for proper streaming
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          let chunkCount = 0;
          try {
            for await (const chunk of completionStream) {
              chunkCount++;
              const chunkData = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(chunkData));

              if (chunkCount % 10 === 0) {
                logger.info("Streaming progress", { chunkCount });
              }
            }
            logger.info("Streaming completed", { totalChunks: chunkCount });
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          } catch (error) {
            logger.error("Error in streaming", { error, chunkCount });
            controller.error(error);
          } finally {
            logger.info("Closing stream controller");
            controller.close();
          }
        },
      });

      logger.info("Returning streaming response");
      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } else {
      const completion = await gemini.chat.completions.create({
        model: selectedModel,
        messages: modifiedMessage,
        max_tokens: max_tokens || 150,
        temperature: temperature || 0.7,
        stream: false,
      });

      logger.info("Non-streaming completion successful", {
        usage: completion.usage,
        responseLength: completion.choices[0]?.message?.content?.length,
      });

      return NextResponse.json(completion);
    }
  } catch (error) {
    logger.error("=== Error in chat completions API ===", {
      error,
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : undefined,
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `API Error: ${error.message}`, code: error.code },
        { status: error.status || 500 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.error("Unknown error type", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
