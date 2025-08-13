export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          has_loyalty_card: boolean | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_loyalty_card?: boolean | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
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
      meal_plans: {
        Row: {
          created_at: string
          data: Json
          id: string
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
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
          created_at: string | null
          currency: string
          id: string
          ingredient_name: string
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
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name: string
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
          created_at?: string | null
          currency?: string
          id?: string
          ingredient_name?: string
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
          created_at: string
          dietary_preferences: string[] | null
          email: string | null
          full_name: string | null
          household_size: number | null
          id: string
          updated_at: string
          weekly_budget: number | null
        }
        Insert: {
          address?: Json | null
          allergies?: string[] | null
          created_at?: string
          dietary_preferences?: string[] | null
          email?: string | null
          full_name?: string | null
          household_size?: number | null
          id: string
          updated_at?: string
          weekly_budget?: number | null
        }
        Update: {
          address?: Json | null
          allergies?: string[] | null
          created_at?: string
          dietary_preferences?: string[] | null
          email?: string | null
          full_name?: string | null
          household_size?: number | null
          id?: string
          updated_at?: string
          weekly_budget?: number | null
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
      shopping_lists: {
        Row: {
          created_at: string
          id: string
          items: Json
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          items: Json
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
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
      get_latest_prices_by_store: {
        Args: { ingredient_name_param: string }
        Returns: {
          store_name: string
          price: number
          product_url: string
          product_title: string
          last_updated: string
        }[]
      }
      get_price_trends: {
        Args: {
          ingredient_name_param: string
          store_name_param: string
          days_back?: number
        }
        Returns: {
          price: number
          recorded_at: string
        }[]
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
