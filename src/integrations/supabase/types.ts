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
      ai_usage: {
        Row: {
          count: number
          day: string
          feature: string
          user_id: string
        }
        Insert: {
          count?: number
          day?: string
          feature: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          feature?: string
          user_id?: string
        }
        Relationships: []
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
      assistant_threads: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          created_at: string
          customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          cancel_at_next_billing_date: boolean
          customer_id: string
          event_at: string
          next_billing_date: string | null
          plan: string | null
          product_id: string
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          cancel_at_next_billing_date?: boolean
          customer_id: string
          event_at: string
          next_billing_date?: string | null
          plan?: string | null
          product_id: string
          status: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          cancel_at_next_billing_date?: boolean
          customer_id?: string
          event_at?: string
          next_billing_date?: string | null
          plan?: string | null
          product_id?: string
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_webhook_events: {
        Row: {
          received_at: string
          type: string
          webhook_id: string
        }
        Insert: {
          received_at?: string
          type: string
          webhook_id: string
        }
        Update: {
          received_at?: string
          type?: string
          webhook_id?: string
        }
        Relationships: []
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
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
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
          revision: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          revision?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          revision?: number
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
          id?: number
          name: string
          path?: string
          props?: Json
        }
        Update: {
          created_at?: string
          id?: number
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
      workspace_trail: {
        Row: {
          actor_id: string
          id: number
          organization_id: string
          outcome: string
          recorded_at: string
          ref: string | null
          title: string
          who: string
        }
        Insert: {
          actor_id?: string
          id?: number
          organization_id: string
          outcome: string
          recorded_at?: string
          ref?: string | null
          title: string
          who: string
        }
        Update: {
          actor_id?: string
          id?: number
          organization_id?: string
          outcome?: string
          recorded_at?: string
          ref?: string | null
          title?: string
          who?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_trail_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
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
      accept_org_invitation: {
        Args: { p_token_hash: string }
        Returns: string
      }
      can_edit_org: {
        Args: { p_org: string }
        Returns: boolean
      }
      can_read_org: {
        Args: { p_org: string }
        Returns: boolean
      }
      claim_workspace_revision: {
        Args: { p_expected: number; p_org: string }
        Returns: number
      }
      consume_ai_quota: {
        Args: { p_feature: string; p_limit: number }
        Returns: boolean
      }
      org_member_directory: {
        Args: { p_org: string }
        Returns: {
          user_id: string
          role: string
          display_name: string
          email: string
          joined_at: string
        }[]
      }
      org_role: {
        Args: { p_org: string }
        Returns: string
      }
      record_billing_webhook: {
        Args: { p_subscription: Json; p_type: string; p_webhook_id: string }
        Returns: string
      }
      remove_org_member: {
        Args: { p_org: string; p_user: string }
        Returns: undefined
      }
      save_veritrail_workspace: {
        Args: { p_name: string; p_org: string; p_sources: Json; p_state: Json }
        Returns: string
      }
      save_workspace_checked: {
        Args: { p_name: string; p_org: string; p_revision: number; p_sources: Json; p_state: Json }
        Returns: Json
      }
      set_org_member_role: {
        Args: { p_org: string; p_role: string; p_user: string }
        Returns: undefined
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
