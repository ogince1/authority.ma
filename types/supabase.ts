
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
    PostgrestVersion: "13.0.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: Json
          created_at: string | null
          excerpt: Json | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          keywords: Json | null
          meta_description: Json | null
          meta_title: Json | null
          published_at: string | null
          title: Json
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: Json
          created_at?: string | null
          excerpt?: Json | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: Json | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          title: Json
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: Json
          created_at?: string | null
          excerpt?: Json | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: Json | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          title?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          check_in_date: string
          check_out_date: string
          created_at: string | null
          guests: number | null
          id: string
          message: string | null
          property_id: string | null
          status: string | null
          total_price: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          created_at?: string | null
          guests?: number | null
          id?: string
          message?: string | null
          property_id?: string | null
          status?: string | null
          total_price: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          created_at?: string | null
          guests?: number | null
          id?: string
          message?: string | null
          property_id?: string | null
          status?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          content: Json | null
          created_at: string | null
          description: Json | null
          id: string
          is_published: boolean | null
          keywords: Json | null
          meta_description: Json | null
          meta_title: Json | null
          slug: string
          title: Json
          type: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_published?: boolean | null
          keywords?: Json | null
          meta_description?: Json | null
          meta_title?: Json | null
          slug: string
          title: Json
          type: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: Json | null
          id?: string
          is_published?: boolean | null
          keywords?: Json | null
          meta_description?: Json | null
          meta_title?: Json | null
          slug?: string
          title?: Json
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: Json
          category: string
          created_at: string | null
          id: string
          is_published: boolean | null
          order: number | null
          question: Json
          related_to: string | null
          updated_at: string | null
        }
        Insert: {
          answer: Json
          category: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order?: number | null
          question: Json
          related_to?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: Json
          category?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          order?: number | null
          question?: Json
          related_to?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string | null
          amenities: Json | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          created_at: string | null
          description: string | null
          id: string
          images: Json | null
          is_approved: boolean | null
          is_available: boolean | null
          lat: number | null
          lng: number | null
          max_guests: number | null
          owner_id: string | null
          price_per_night: number
          property_type: string | null
          rating: number | null
          reviews_count: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_approved?: boolean | null
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          owner_id?: string | null
          price_per_night: number
          property_type?: string | null
          rating?: number | null
          reviews_count?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          is_approved?: boolean | null
          is_available?: boolean | null
          lat?: number | null
          lng?: number | null
          max_guests?: number | null
          owner_id?: string | null
          price_per_night?: number
          property_type?: string | null
          rating?: number | null
          reviews_count?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_avatar: string | null
          author_name: string
          city: string | null
          content: Json
          created_at: string | null
          id: string
          is_published: boolean | null
          is_verified: boolean | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_name: string
          city?: string | null
          content: Json
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          city?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      travel_guides: {
        Row: {
          author: string | null
          city_slug: string
          content: Json
          created_at: string | null
          description: Json | null
          featured_image: string | null
          id: string
          is_published: boolean | null
          keywords: Json | null
          meta_description: Json | null
          meta_title: Json | null
          published_at: string | null
          sections: Json | null
          title: Json
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          city_slug: string
          content: Json
          created_at?: string | null
          description?: Json | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: Json | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          sections?: Json | null
          title: Json
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          city_slug?: string
          content?: Json
          created_at?: string | null
          description?: Json | null
          featured_image?: string | null
          id?: string
          is_published?: boolean | null
          keywords?: Json | null
          meta_description?: Json | null
          meta_title?: Json | null
          published_at?: string | null
          sections?: Json | null
          title?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
