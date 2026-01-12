import { generateObject } from "ai";
import { model } from "./openrouter";
import { z } from "zod";
import { retrieveContext, wrapContextForSafety } from "./retrieval";

const PlanSchema = z.object({
  calories: z.number(),
  macros: z.object({
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  meals: z.array(z.object({
    day: z.string(),
    mealName: z.string(),
    foods: z.array(z.object({
      name: z.string(),
      qty: z.string(),
      unit: z.string(),
    })),
    approxMacros: z.object({
      protein: z.number(),
      carbs: z.number(),
      fat: z.number(),
    }),
  })),
  workouts: z.array(z.object({
    day: z.string(),
    warmup: z.string(),
    exercises: z.array(z.object({
      name: z.string(),
      sets: z.number(),
      reps: z.string(),
      rest: z.string(),
      RPE: z.number().optional(),
    })),
    cooldown: z.string(),
  })),
  groceryList: z.array(z.string()),
  adherenceTips: z.array(z.string()),
  safetyNotes: z.array(z.string()),
});

export type GeneratedPlan = z.infer<typeof PlanSchema>;

export async function generateCustomPlan(userId: string, intakeData: any): Promise<GeneratedPlan> {
  // 1. Retrieve context based on intake (e.g., diet type, goals)
  const query = `Diet: ${intakeData.dietType}, Goal: ${intakeData.goal}, Medical: ${intakeData.medicalHistory}`;
  const contextResults = await retrieveContext(query, 5, 0.6);
  const context = wrapContextForSafety(contextResults);

  // 2. Generate plan using Gemini
  const { object } = await generateObject({
    model,
    schema: PlanSchema,
    system: `
      You are the "SwasthaLabs AI Fitness & Nutrition Coach". 
      Your goal is to provide a highly personalized Indian diet and workout plan.
      Use the provided reference material as your source of truth for principles and safety.
      
      User Profile:
      ${JSON.stringify(intakeData, null, 2)}

      ${context}

      Guidelines:
      - Indian diet friendly: Include roti, rice, dal, paneer, curd, eggs, chicken, fish as appropriate.
      - Realistic portions.
      - Progressive workout structure.
      - Ensure safety notes include necessary medical disclaimers.
    `,
    prompt: "Generate a comprehensive 7-day personalized fitness and nutrition plan.",
  });

  return object;
}

