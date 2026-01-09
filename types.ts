export type Language = 'en' | 'zh-TW';

export interface Ingredient {
  item: string;
  quantity: string;
  unit: string;
  notes?: string;
  category: string; // e.g., Produce, Dairy, Meat
  imageTerm?: string; // Single noun for image lookup
}

export interface CookingStep {
  id: string;
  description: string;
  durationMinutes: number;
  type: 'active' | 'passive'; // Active = cutting, stirring; Passive = roasting, boiling
  ingredientsNeeded?: string[];
}

export interface Recipe {
  id: string;
  name: string;
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  cuisine?: string;
  difficulty?: string;
  sourceUrl?: string;
  imageUrl?: string;
}

export interface TimelineEvent {
  id: string;
  recipeName: string;
  task: string;
  startTimeOffset: number; // Minutes from T-0 (start of cooking)
  duration: number;
  type: 'active' | 'passive';
  critical: boolean; // True if on critical path
}

export interface MealPlan {
  id: string;
  createdAt: number;
  title: string;
  guestCount: number;
  dietaryRestrictions: string;
  recipes: Recipe[];
  shoppingList: Ingredient[];
  timeline: TimelineEvent[];
  totalEstimatedTimeMinutes: number;
}