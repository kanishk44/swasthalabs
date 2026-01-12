import { streamText, tool } from "ai";
import { model } from "@/lib/ai/openrouter";
import { z } from "zod";
import { retrieveContext, wrapContextForSafety } from "@/lib/ai/retrieval";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { messages, userId } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // 1. Retrieve RAG context for the specific question
  const contextResults = await retrieveContext(lastMessage, 3, 0.6);
  const context = wrapContextForSafety(contextResults);

  // 2. Fetch user plan context if unlocked
  const plan = await prisma.planVersion.findFirst({
    where: { 
      plan: { userId },
      isReleased: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const result = await streamText({
    model,
    messages,
    system: `
      You are "MasalaMacros AI Coach", a supportive and knowledgeable fitness/nutrition expert.
      Reference the following material for safety and principles:
      ${context}

      ${plan ? `The user's current plan: ${JSON.stringify(plan.jsonPlan)}` : "The user's custom plan is still being generated. Provide general healthy advice for now."}

      Guidelines:
      - Be concise and supportive.
      - Use Indian food examples.
      - Never give medical advice; refer to the safety notes.
    `,
    tools: {
      get_current_plan: tool({
        description: "Get the user's current nutrition and workout plan",
        parameters: z.object({}),
        execute: async () => {
          return plan?.jsonPlan || { error: "Plan not yet unlocked." };
        },
      }),
      suggest_meal_swap: tool({
        description: "Suggest a healthy swap for a meal item",
        parameters: z.object({
          originalFood: z.string(),
          dietType: z.string(),
        }),
        execute: async ({ originalFood, dietType }) => {
          // Logic for swap
          return { suggestion: `Swap ${originalFood} for a healthier alternative suitable for ${dietType}.` };
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}

