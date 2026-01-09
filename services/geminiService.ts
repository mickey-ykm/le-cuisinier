import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Recipe, Ingredient, TimelineEvent, MealPlan } from "../types";

// Ensure process.env is defined for TypeScript, even if @types/node is missing or not picked up
declare const process: { env: Record<string, string | undefined> };

const getAi = (apiKey?: string) => new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY });

// Schemas
const ingredientSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    item: { type: Type.STRING },
    quantity: { type: Type.STRING },
    unit: { type: Type.STRING },
    notes: { type: Type.STRING },
    category: { type: Type.STRING },
    imageTerm: { type: Type.STRING, description: "A SINGLE standard English noun for the ingredient to look up its image. Must be singular and common (e.g. 'Garlic', 'Chicken', 'Beef', 'Onion', 'Rice'). Do not include adjectives." },
  },
  required: ["item", "quantity", "unit", "category"],
};

const cookingStepSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    description: { type: Type.STRING },
    durationMinutes: { type: Type.NUMBER },
    type: { type: Type.STRING, enum: ["active", "passive"] },
  },
  required: ["id", "description", "durationMinutes", "type"],
};

const recipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    name: { type: Type.STRING },
    servings: { type: Type.NUMBER },
    ingredients: {
      type: Type.ARRAY,
      items: ingredientSchema,
    },
    steps: {
      type: Type.ARRAY,
      items: cookingStepSchema,
    },
    cuisine: { type: Type.STRING },
    difficulty: { type: Type.STRING },
    sourceUrl: { type: Type.STRING, description: "The URL of the website where this recipe was found." },
    imageUrl: { type: Type.STRING, description: "The direct URL of the main image (OG image or Hero image) from the sourceUrl page." },
  },
  required: ["name", "ingredients", "steps"],
};

const recipeListSchema: Schema = {
  type: Type.ARRAY,
  items: recipeSchema,
};

const timelineEventSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    recipeName: { type: Type.STRING },
    task: { type: Type.STRING },
    startTimeOffset: { type: Type.NUMBER, description: "Minutes from the start of the entire cooking session" },
    duration: { type: Type.NUMBER },
    type: { type: Type.STRING, enum: ["active", "passive"] },
    critical: { type: Type.BOOLEAN },
  },
  required: ["recipeName", "task", "startTimeOffset", "duration", "type"],
};

const timelineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    timeline: { type: Type.ARRAY, items: timelineEventSchema },
    shoppingList: { type: Type.ARRAY, items: ingredientSchema },
    totalEstimatedTimeMinutes: { type: Type.NUMBER },
  },
  required: ["timeline", "shoppingList", "totalEstimatedTimeMinutes"],
};

/**
 * Attempts to find a new image URL for a specific dish using Google Search.
 * Used when the original image link is broken.
 */
export const findDishImage = async (dishName: string, apiKey?: string): Promise<string | null> => {
  const prompt = `Find a representative high-quality image URL for the dish: "${dishName}". Return JSON { "imageUrl": "..." }.`;
  try {
     const ai = getAi(apiKey);
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: { imageUrl: { type: Type.STRING } }
        }
      },
    });
    const res = JSON.parse(response.text || '{}');
    return res.imageUrl || null;
  } catch (e) {
    console.error("Failed to recover image", e);
    return null;
  }
}

export const fetchRecipes = async (
  dishes: string, 
  headcount: number, 
  dietary: string,
  sideDishCount: number,
  language: 'en' | 'zh-TW',
  modelId: string,
  apiKey?: string
): Promise<Recipe[]> => {
  
  const langPrompt = language === 'zh-TW' ? "Output all text (except URLs) in Traditional Chinese (zh-TW)." : "Output all text in English.";
  
  const sideDishPrompt = sideDishCount > 0 
    ? `Also, suggest and include exactly ${sideDishCount} appropriate side dish(es) that complement the meal. Name them creatively.` 
    : "";
  
  const prompt = `
    You are a professional chef. 
    1. Search for authentic and high-rated recipes for: ${dishes}.
    2. Create detailed recipes based on your research.
    3. Scale ingredients for ${headcount} people.
    Constraint: ${dietary || "None"}.
    ${sideDishPrompt}
    ${langPrompt}
    Structure each recipe carefully. Distinguish between 'active' steps (chopping, stirring) and 'passive' steps (roasting, boiling, marinating).
    IMPORTANT: For each recipe, you MUST include the 'sourceUrl' from the search result.
    CRITICAL: You MUST extract the main image URL (such as the 'og:image' meta tag or the main article image) directly from the specific source URL found. Populate 'imageUrl' with this specific URL. Do not use generic placeholders.
  `;

  try {
    const ai = getAi(apiKey);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}], // Enable Google Search
        responseMimeType: 'application/json',
        responseSchema: recipeListSchema,
      },
    });

    const text = response.text;
    if (!text) return [];
    
    // Sometimes grounding chunks are available, but we rely on the model extracting them into the JSON schema as requested.
    return JSON.parse(text) as Recipe[];
  } catch (e) {
    console.error("Failed to fetch recipes", e);
    return [];
  }
};

export const generateOrchestration = async (
  recipes: Recipe[],
  language: 'en' | 'zh-TW',
  modelId: string,
  apiKey?: string
): Promise<{ timeline: TimelineEvent[], shoppingList: Ingredient[], totalTime: number }> => {

  const langPrompt = language === 'zh-TW' ? "Output task descriptions and ingredients in Traditional Chinese (zh-TW)." : "Output in English.";

  // Simplify prompt to avoid token limits and reduce latency
  const prompt = `
    You are a logistics expert. I have these recipes:
    ${JSON.stringify(recipes)}

    1. Create a consolidated Shopping List.
       - IMPORTANT: For each ingredient, populate 'imageTerm' with a SINGLE English noun (e.g., 'Chopped Garlic' -> 'Garlic', '500g Beef' -> 'Beef') to be used for fetching a thumbnail image.
    2. Create a "Parallel Processing" Cooking Itinerary.
       - Interleave steps to minimize time.
       - Active tasks during passive times.
       - All dishes finish at the end.
    ${langPrompt}
  `;

  try {
    const ai = getAi(apiKey);
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: timelineSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    return {
      timeline: data.timeline,
      shoppingList: data.shoppingList,
      totalTime: data.totalEstimatedTimeMinutes
    };
  } catch (e) {
    console.error("Failed to parse orchestration", e);
    throw e;
  }
};
