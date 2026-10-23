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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ai_change_reviews: {
        Row: {
          organization_id: string
          reviews: Json
          updated_at: string
        }
        Insert: {
          organization_id: string
          reviews?: Json
          updated_at?: string
        }
        Update: {
          organization_id?: string
          reviews?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_change_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_corrective_actions: {
        Row: {
          actions: Json
          organization_id: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          organization_id: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_corrective_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_governance_decisions: {
        Row: {
          decisions: Json
          organization_id: string
          updated_at: string
        }
        Insert: {
          decisions?: Json
          organization_id: string
          updated_at?: string
        }
        Update: {
          decisions?: Json
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_governance_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_incidents: {
        Row: {
          incidents: Json
          organization_id: string
          updated_at: string
        }
        Insert: {
          incidents?: Json
          organization_id: string
          updated_at?: string
        }
        Update: {
          incidents?: Json
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_monitoring_plans: {
        Row: {
          organization_id: string
          plans: Json
          updated_at: string
        }
        Insert: {
          organization_id: string
          plans?: Json
          updated_at?: string
        }
        Update: {
          organization_id?: string
          plans?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_monitoring_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_systems: {
        Row: {
          organization_id: string
          systems: Json
        }
        Insert: {
          organization_id: string
          systems?: Json
        }
        Update: {
          organization_id?: string
          systems?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_systems_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          answers: Json
          organization_id: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          organization_id: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      guardrail_configs: {
        Row: {
          controls: Json
          organization_id: string
          tier: string
        }
        Insert: {
          controls?: Json
          organization_id: string
          tier?: string
        }
        Update: {
          controls?: Json
          organization_id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardrail_configs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          display_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      roadmap_items: {
        Row: {
          items: Json
          organization_id: string
        }
        Insert: {
          items?: Json
          organization_id: string
        }
        Update: {
          items?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      site_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_events: {
        Row: {
          created_at: string
          id: number
          name: string
          path: string
          props: Json
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          path?: string
          props?: Json
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          path?: string
          props?: Json
        }
        Relationships: []
      }
      site_leads: {
        Row: {
          ai_systems: string
          company: string
          consent: boolean
          created_at: string
          email: string
          form: string
          id: string
          industry: string
          message: string
          name: string
          payload: Json
          role: string
          tool: string
        }
        Insert: {
          ai_systems?: string
          company?: string
          consent: boolean
          created_at?: string
          email: string
          form: string
          id?: string
          industry?: string
          message?: string
          name?: string
          payload?: Json
          role?: string
          tool?: string
        }
        Update: {
          ai_systems?: string
          company?: string
          consent?: boolean
          created_at?: string
          email?: string
          form?: string
          id?: string
          industry?: string
          message?: string
          name?: string
          payload?: Json
          role?: string
          tool?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          entries: Json
          organization_id: string
        }
        Insert: {
          entries?: Json
          organization_id: string
        }
        Update: {
          entries?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_aegis_workspace: {
        Args: { p_name: string; p_org: string; p_sources: Json; p_state: Json }
        Returns: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
