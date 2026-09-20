/**
 * Database types for the HoLife Postgres schema.
 *
 * These mirror `supabase/migrations/*.sql` and are shaped exactly like the
 * output of `supabase gen types typescript`, so they can be regenerated with
 * `npm run db:types` once a local Supabase instance is running.
 *
 * If you change a migration, change this file in the same commit.
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UnitSystem = 'metric' | 'imperial';
export type WeightUnit = 'kg' | 'lb' | 'st';
export type ThemePreference = 'system' | 'light' | 'dark';
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MacroSource = 'manual' | 'ai_estimate';
export type EstimateConfidence = 'low' | 'medium' | 'high';
export type HabitFrequency = 'daily' | 'days_of_week';
export type GoalStatus = 'active' | 'achieved' | 'paused' | 'archived';
export type MusicFormat = 'cd' | 'cassette';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_settings: {
        Row: {
          user_id: string;
          unit_system: UnitSystem;
          weight_unit: WeightUnit;
          theme: ThemePreference;
          timezone: string;
          week_start_day: number;
          goal_weight_kg: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          unit_system?: UnitSystem;
          weight_unit?: WeightUnit;
          theme?: ThemePreference;
          timezone?: string;
          week_start_day?: number;
          goal_weight_kg?: number | null;
        };
        Update: {
          unit_system?: UnitSystem;
          weight_unit?: WeightUnit;
          theme?: ThemePreference;
          timezone?: string;
          week_start_day?: number;
          goal_weight_kg?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      weight_entries: {
        Row: {
          id: string;
          user_id: string;
          measured_at: string;
          local_date: string;
          weight_kg: number;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          measured_at?: string;
          local_date: string;
          weight_kg: number;
          note?: string | null;
        };
        Update: {
          measured_at?: string;
          local_date?: string;
          weight_kg?: number;
          note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      nutrition_targets: {
        Row: {
          id: string;
          user_id: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
        };
        Update: {
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      meal_entries: {
        Row: {
          id: string;
          user_id: string;
          eaten_at: string;
          local_date: string;
          name: string;
          slot: MealSlot | null;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          notes: string | null;
          image_path: string | null;
          source: MacroSource;
          estimate_confidence: EstimateConfidence | null;
          estimate_assumptions: string[] | null;
          estimate_model: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          eaten_at?: string;
          local_date: string;
          name: string;
          slot?: MealSlot | null;
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          notes?: string | null;
          image_path?: string | null;
          source?: MacroSource;
          estimate_confidence?: EstimateConfidence | null;
          estimate_assumptions?: string[] | null;
          estimate_model?: string | null;
        };
        Update: {
          eaten_at?: string;
          local_date?: string;
          name?: string;
          slot?: MealSlot | null;
          calories?: number;
          protein_g?: number;
          carbs_g?: number;
          fat_g?: number;
          notes?: string | null;
          image_path?: string | null;
          source?: MacroSource;
          estimate_confidence?: EstimateConfidence | null;
          estimate_assumptions?: string[] | null;
          estimate_model?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string;
          frequency: HabitFrequency;
          days_of_week: number[];
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          icon?: string;
          frequency?: HabitFrequency;
          days_of_week?: number[];
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string | null;
          icon?: string;
          frequency?: HabitFrequency;
          days_of_week?: number[];
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      habit_completions: {
        Row: {
          id: string;
          user_id: string;
          habit_id: string;
          local_date: string;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          habit_id: string;
          local_date: string;
          completed_at?: string;
        };
        Update: {
          local_date?: string;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'habit_completions_habit_id_fkey';
            columns: ['habit_id'];
            referencedRelation: 'habits';
            referencedColumns: ['id'];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          due_date: string | null;
          due_time: string | null;
          priority: number;
          is_completed: boolean;
          completed_at: string | null;
          recurrence: Json | null;
          recurrence_parent_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          notes?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          recurrence?: Json | null;
          recurrence_parent_id?: string | null;
          sort_order?: number;
        };
        Update: {
          title?: string;
          notes?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          priority?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          recurrence?: Json | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          target_date: string | null;
          status: GoalStatus;
          start_value: number | null;
          target_value: number | null;
          current_value: number | null;
          unit: string | null;
          metric_key: string | null;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          target_date?: string | null;
          status?: GoalStatus;
          start_value?: number | null;
          target_value?: number | null;
          current_value?: number | null;
          unit?: string | null;
          metric_key?: string | null;
          completed_at?: string | null;
          sort_order?: number;
        };
        Update: {
          title?: string;
          description?: string | null;
          target_date?: string | null;
          status?: GoalStatus;
          start_value?: number | null;
          target_value?: number | null;
          current_value?: number | null;
          unit?: string | null;
          metric_key?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      music_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          artist: string | null;
          format: MusicFormat;
          release_year: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          artist?: string | null;
          format: MusicFormat;
          release_year?: number | null;
          notes?: string | null;
        };
        Update: {
          title?: string;
          artist?: string | null;
          format?: MusicFormat;
          release_year?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      unit_system: UnitSystem;
      weight_unit: WeightUnit;
      theme_preference: ThemePreference;
      meal_slot: MealSlot;
      macro_source: MacroSource;
      estimate_confidence: EstimateConfidence;
      habit_frequency: HabitFrequency;
      goal_status: GoalStatus;
      music_format: MusicFormat;
    };
    CompositeTypes: Record<never, never>;
  };
}

type PublicSchema = Database['public'];

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row'];
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];
