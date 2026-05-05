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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["community_category"]
          content: string
          created_at: string
          id: string
          images: string[] | null
          price: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: Database["public"]["Enums"]["community_category"]
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          price?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["community_category"]
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          price?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          apply_url: string
          category: string
          company: string
          created_at: string
          created_by: string
          deadline: string | null
          description: string
          id: string
          location: string | null
          role: string
          status: Database["public"]["Enums"]["opp_status"]
          type: string
          updated_at: string
        }
        Insert: {
          apply_url: string
          category: string
          company: string
          created_at?: string
          created_by: string
          deadline?: string | null
          description: string
          id?: string
          location?: string | null
          role: string
          status?: Database["public"]["Enums"]["opp_status"]
          type: string
          updated_at?: string
        }
        Update: {
          apply_url?: string
          category?: string
          company?: string
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string
          id?: string
          location?: string | null
          role?: string
          status?: Database["public"]["Enums"]["opp_status"]
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: string | null
          college_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_banned: boolean
          is_disabled: boolean
          mobile_number: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
          verified: boolean
          year: number | null
        }
        Insert: {
          branch?: string | null
          college_name?: string
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_banned?: boolean
          is_disabled?: boolean
          mobile_number?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean
          year?: number | null
        }
        Update: {
          branch?: string | null
          college_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_banned?: boolean
          is_disabled?: boolean
          mobile_number?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          verified?: boolean
          year?: number | null
        }
        Relationships: []
      }
      resource_likes: {
        Row: {
          created_at: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_likes_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          branch: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          like_count: number
          rejected_at: string | null
          rejection_reason: string | null
          semester: number
          status: Database["public"]["Enums"]["resource_status"]
          subject: string
          title: string
          updated_at: string
          uploader_id: string
          year: number
        }
        Insert: {
          branch: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          like_count?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          semester: number
          status?: Database["public"]["Enums"]["resource_status"]
          subject: string
          title: string
          updated_at?: string
          uploader_id: string
          year: number
        }
        Update: {
          branch?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          like_count?: number
          rejected_at?: string | null
          rejection_reason?: string | null
          semester?: number
          status?: Database["public"]["Enums"]["resource_status"]
          subject?: string
          title?: string
          updated_at?: string
          uploader_id?: string
          year?: number
        }
        Relationships: []
      }
      support_replies: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          request_id: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          request_id: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_replies_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      support_requests: {
        Row: {
          anonymous: boolean
          author_id: string
          created_at: string
          description: string
          id: string
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at: string
          urgency: Database["public"]["Enums"]["support_urgency"]
        }
        Insert: {
          anonymous?: boolean
          author_id: string
          created_at?: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["support_urgency"]
        }
        Update: {
          anonymous?: boolean
          author_id?: string
          created_at?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          updated_at?: string
          urgency?: Database["public"]["Enums"]["support_urgency"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          admin_type: Database["public"]["Enums"]["admin_type"] | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          admin_type?: Database["public"]["Enums"]["admin_type"] | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          admin_type?: Database["public"]["Enums"]["admin_type"] | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rejected_resources: { Args: never; Returns: undefined }
      has_admin_type: {
        Args: {
          _t: Database["public"]["Enums"]["admin_type"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_verified: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_type: "khabri" | "professor"
      app_role: "super_admin" | "admin" | "user"
      community_category: "lost_found" | "rooms" | "marketplace"
      opp_status: "open" | "closed"
      resource_status: "pending" | "approved" | "rejected"
      support_status: "pending" | "approved" | "resolved"
      support_urgency: "standard" | "emergency"
      user_type: "student" | "alumni" | "faculty"
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
    Enums: {
      admin_type: ["khabri", "professor"],
      app_role: ["super_admin", "admin", "user"],
      community_category: ["lost_found", "rooms", "marketplace"],
      opp_status: ["open", "closed"],
      resource_status: ["pending", "approved", "rejected"],
      support_status: ["pending", "approved", "resolved"],
      support_urgency: ["standard", "emergency"],
      user_type: ["student", "alumni", "faculty"],
    },
  },
} as const
