export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_decisions: {
        Row: {
          confidence_score: number | null
          created_at: string
          decision_type: string
          final_decision: Json
          id: string
          original_plan: Json | null
          reasoning: string
          shopping_session_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          decision_type: string
          final_decision: Json
          id?: string
          original_plan?: Json | null
          reasoning: string
          shopping_session_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          decision_type?: string
          final_decision?: Json
          id?: string
          original_plan?: Json | null
          reasoning?: string
          shopping_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_decisions_shopping_session_id_fkey"
            columns: ["shopping_session_id"]
            isOneToOne: false
            referencedRelation: "shopping_history"
            referencedColumns: ["id"]
          },
        ]
      }
      aldi_prices: {
        Row: {
          average_price: number | null
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          price: number
          source: string | null
        }
        Insert: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price: number
          source?: string | null
        }
        Update: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price?: number
          source?: string | null
        }
        Relationships: []
      }
      amazon_prices: {
        Row: {
          average_price: number | null
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          product_url: string | null
        }
        Insert: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          product_url?: string | null
        }
        Update: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          product_url?: string | null
        }
        Relationships: []
      }
      asda_prices: {
        Row: {
          average_price: number | null
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          product_url: string | null
        }
        Insert: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          product_url?: string | null
        }
        Update: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          product_url?: string | null
        }
        Relationships: []
      }
      connected_stores: {
        Row: {
          created_at: string
          credentials: Json | null
          has_loyalty_card: boolean | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials?: Json | null
          has_loyalty_card?: boolean | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json | null
          has_loyalty_card?: boolean | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coop_prices: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          price: number
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price: number
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price?: number
        }
        Relationships: []
      }
      iceland_prices: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          price: number
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price: number
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price?: number
        }
        Relationships: []
      }
      ingredient_price_history: {
        Row: {
          id: string
          ingredient_name: string
          normalized_name: string
          price: number
          recorded_at: string | null
          store_name: string
          unit: string | null
        }
        Insert: {
          id?: string
          ingredient_name: string
          normalized_name: string
          price: number
          recorded_at?: string | null
          store_name: string
          unit?: string | null
        }
        Update: {
          id?: string
          ingredient_name?: string
          normalized_name?: string
          price?: number
          recorded_at?: string | null
          store_name?: string
          unit?: string | null
        }
        Relationships: []
      }
      lidl_prices: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          price: number
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price: number
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price?: number
        }
        Relationships: []
      }
      meal_options: {
        Row: {
          created_at: string | null
          estimated_cost: number | null
          id: string
          meal_type: string | null
          recipe_data: Json
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          meal_type?: string | null
          recipe_data: Json
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          meal_type?: string | null
          recipe_data?: Json
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          actual_cost: number | null
          created_at: string
          data: Json
          id: string
          meal_type: string | null
          status: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          actual_cost?: number | null
          created_at?: string
          data: Json
          id?: string
          meal_type?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          actual_cost?: number | null
          created_at?: string
          data?: Json
          id?: string
          meal_type?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      morrisons_prices: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          price: number
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price: number
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price?: number
        }
        Relationships: []
      }
      ocado_prices: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          price: number
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price: number
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price?: number
        }
        Relationships: []
      }
      order_history: {
        Row: {
          basket_urls: Json | null
          id: string
          meal_plan_data: Json
          ordered_at: string | null
          total_cost: number | null
          user_id: string
          week_start: string
        }
        Insert: {
          basket_urls?: Json | null
          id?: string
          meal_plan_data: Json
          ordered_at?: string | null
          total_cost?: number | null
          user_id: string
          week_start: string
        }
        Update: {
          basket_urls?: Json | null
          id?: string
          meal_plan_data?: Json
          ordered_at?: string | null
          total_cost?: number | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      price_history: {
        Row: {
          id: string
          price: number
          price_id: string | null
          recorded_at: string | null
        }
        Insert: {
          id?: string
          price: number
          price_id?: string | null
          recorded_at?: string | null
        }
        Update: {
          id?: string
          price?: number
          price_id?: string | null
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          barcode: string | null
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_api_source: string | null
          last_updated: string | null
          price: number
          product_image: string | null
          product_title: string | null
          product_url: string | null
          quantity: string | null
          store_name: string
          unit: string | null
        }
        Insert: {
          barcode?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_api_source?: string | null
          last_updated?: string | null
          price: number
          product_image?: string | null
          product_title?: string | null
          product_url?: string | null
          quantity?: string | null
          store_name: string
          unit?: string | null
        }
        Update: {
          barcode?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_api_source?: string | null
          last_updated?: string | null
          price?: number
          product_image?: string | null
          product_title?: string | null
          product_url?: string | null
          quantity?: string | null
          store_name?: string
          unit?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: Json | null
          allergies: string[] | null
          budget_tier: string | null
          created_at: string
          dietary_preferences: string[] | null
          email: string | null
          full_name: string | null
          household_size: number | null
          id: string
          meal_types: Json | null
          suggestic_jwt_expires_at: string | null
          suggestic_jwt_token: string | null
          suggestic_user_id: string | null
          updated_at: string
          weekly_budget: number | null
        }
        Insert: {
          address?: Json | null
          allergies?: string[] | null
          budget_tier?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          email?: string | null
          full_name?: string | null
          household_size?: number | null
          id: string
          meal_types?: Json | null
          suggestic_jwt_expires_at?: string | null
          suggestic_jwt_token?: string | null
          suggestic_user_id?: string | null
          updated_at?: string
          weekly_budget?: number | null
        }
        Update: {
          address?: Json | null
          allergies?: string[] | null
          budget_tier?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          email?: string | null
          full_name?: string | null
          household_size?: number | null
          id?: string
          meal_types?: Json | null
          suggestic_jwt_expires_at?: string | null
          suggestic_jwt_token?: string | null
          suggestic_user_id?: string | null
          updated_at?: string
          weekly_budget?: number | null
        }
        Relationships: []
      }
      recipe_favorites: {
        Row: {
          created_at: string | null
          id: string
          recipe_data: Json
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_data: Json
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      sainsbury_prices: {
        Row: {
          average_price: number | null
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          product_url: string | null
        }
        Insert: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          product_url?: string | null
        }
        Update: {
          average_price?: number | null
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          product_url?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shopping_history: {
        Row: {
          completion_status: string
          created_at: string
          id: string
          session_date: string
          stores_used: string[]
          total_cost: number
          total_items: number
          total_savings: number
          user_id: string
        }
        Insert: {
          completion_status?: string
          created_at?: string
          id?: string
          session_date?: string
          stores_used?: string[]
          total_cost?: number
          total_items?: number
          total_savings?: number
          user_id: string
        }
        Update: {
          completion_status?: string
          created_at?: string
          id?: string
          session_date?: string
          stores_used?: string[]
          total_cost?: number
          total_items?: number
          total_savings?: number
          user_id?: string
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          basket_urls: Json | null
          created_at: string
          id: string
          items: Json
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          basket_urls?: Json | null
          created_at?: string
          id?: string
          items: Json
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          basket_urls?: Json | null
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      substitution_rules: {
        Row: {
          acceptable_substitutes: Json[] | null
          created_at: string
          id: string
          never_substitute: string[] | null
          original_item: string
          user_id: string
        }
        Insert: {
          acceptable_substitutes?: Json[] | null
          created_at?: string
          id?: string
          never_substitute?: string[] | null
          original_item: string
          user_id: string
        }
        Update: {
          acceptable_substitutes?: Json[] | null
          created_at?: string
          id?: string
          never_substitute?: string[] | null
          original_item?: string
          user_id?: string
        }
        Relationships: []
      }
      tesco_prices: {
        Row: {
          average_price: number
          created_at: string
          currency: string
          id: string
          ingredient_name: string
          last_updated: string
          product_url: string | null
        }
        Insert: {
          average_price: number
          created_at?: string
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string
          product_url?: string | null
        }
        Update: {
          average_price?: number
          created_at?: string
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string
          product_url?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          budget_priority: boolean | null
          id: string
          max_price_variance: number | null
          preferred_brands: Json | null
          preferred_stores: Json | null
          substitution_tolerance: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_priority?: boolean | null
          id?: string
          max_price_variance?: number | null
          preferred_brands?: Json | null
          preferred_stores?: Json | null
          substitution_tolerance?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_priority?: boolean | null
          id?: string
          max_price_variance?: number | null
          preferred_brands?: Json | null
          preferred_stores?: Json | null
          substitution_tolerance?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitrose_prices: {
        Row: {
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
          last_updated: string | null
          price: number
        }
        Insert: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
          last_updated?: string | null
          price: number
        }
        Update: {
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
          last_updated?: string | null
          price?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_budget_compliance: {
        Args: { p_total_cost: number; p_user_id: string }
        Returns: Json
      }
      decrypt_store_credentials: {
        Args: { encrypted_creds: string; encryption_key: string }
        Returns: Json
      }
      encrypt_store_credentials: {
        Args: { creds: Json; encryption_key: string }
        Returns: string
      }
      get_latest_prices_by_store: {
        Args: { ingredient_name_param: string }
        Returns: {
          last_updated: string
          price: number
          product_title: string
          product_url: string
          store_name: string
        }[]
      }
      get_price_trends: {
        Args: {
          days_back?: number
          ingredient_name_param: string
          store_name_param: string
        }
        Returns: {
          price: number
          recorded_at: string
        }[]
      }
      get_user_store_credentials: {
        Args: { p_store_name: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
