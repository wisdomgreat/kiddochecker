export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string
          checked_in_at: string | null
          checked_in_by: string | null
          checked_out_at: string | null
          checked_out_by: string | null
          child_id: string
          class_id: string | null
          id: string
        }
        Insert: {
          attendance_date?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          child_id: string
          class_id?: string | null
          id?: string
        }
        Update: {
          attendance_date?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          child_id?: string
          class_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_checked_out_by_fkey"
            columns: ["checked_out_by"]
            isOneToOne: false
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number | null
          allergies: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          family_id: string | null
          first_name: string
          has_guardian_approval: boolean | null
          id: string
          last_name: string
          medical_info: string | null
          notes: string | null
          parent_id: string
          updated_at: string
        }
        Insert: {
          age?: number | null
          allergies?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_id?: string | null
          first_name: string
          has_guardian_approval?: boolean | null
          id?: string
          last_name: string
          medical_info?: string | null
          notes?: string | null
          parent_id: string
          updated_at?: string
        }
        Update: {
          age?: number | null
          allergies?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          family_id?: string | null
          first_name?: string
          has_guardian_approval?: boolean | null
          id?: string
          last_name?: string
          medical_info?: string | null
          notes?: string | null
          parent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          age_range: string | null
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          room: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          room?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          room?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      device_profiles: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          location: string | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          location?: string | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          location?: string | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_public: boolean | null
          location: string | null
          organizer: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          organizer?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          organizer?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_settings: {
        Row: {
          created_at: string | null
          created_by: string | null
          font_family: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          font_family?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_children: {
        Row: {
          child_id: string
          created_at: string
          id: string
          is_authorized_pickup: boolean | null
          parent_id: string
          relationship: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          is_authorized_pickup?: boolean | null
          parent_id: string
          relationship: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          is_authorized_pickup?: boolean | null
          parent_id?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_children_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_children_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          name: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          resource?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          qr_code_data: string | null
          security_answer: string | null
          security_question: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          qr_code_data?: string | null
          security_answer?: string | null
          security_question?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          qr_code_data?: string | null
          security_answer?: string | null
          security_question?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_super_admin: boolean | null
          is_volunteer: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_super_admin?: boolean | null
          is_volunteer?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_super_admin?: boolean | null
          is_volunteer?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_with_emails"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      auth_users_with_emails: {
        Row: {
          email: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_sql_query_safety: {
        Args: { query: string }
        Returns: boolean
      }
      create_class_teacher_assignment: {
        Args: {
          p_class_name: string
          p_description: string
          p_age_range: string
          p_capacity: number
          p_room: string
          p_teacher_id: string
        }
        Returns: string
      }
      create_organization: {
        Args: {
          org_name: string
          primary_color?: string
          font_family?: string
          creator_id?: string
        }
        Returns: string
      }
      create_user_role: {
        Args:
          | {
              p_user_id: string
              p_role?: Database["public"]["Enums"]["app_role"]
              p_is_super_admin?: boolean
            }
          | {
              p_user_id: string
              p_role?: Database["public"]["Enums"]["app_role"]
              p_is_super_admin?: boolean
              p_is_volunteer?: boolean
            }
        Returns: string
      }
      get_all_events: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_public: boolean | null
          location: string | null
          organizer: string | null
          start_date: string
          title: string
          updated_at: string | null
        }[]
      }
      get_attendance_report: {
        Args: { start_date: string; end_date: string }
        Returns: {
          attendance_date: string
          total_checked_in: number
          total_checked_out: number
          class_name: string
          class_id: string
        }[]
      }
      get_class_roster_with_attendance: {
        Args: { class_id_param: string; date_param?: string }
        Returns: {
          child_id: string
          child_name: string
          is_present: boolean
          check_in_time: string
          check_out_time: string
        }[]
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_detailed_attendance_report: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          attendance_date: string
          child_name: string
          class_name: string
          check_in_time: string
          check_out_time: string
          duration_hours: number
        }[]
      }
      get_device_profile: {
        Args: { p_device_id: string }
        Returns: Json
      }
      get_parent_children_with_classes: {
        Args: { parent_user_id: string }
        Returns: {
          child_id: string
          first_name: string
          last_name: string
          age: number
          allergies: string
          current_class_name: string
          current_class_id: string
        }[]
      }
      get_staff_members: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          role: string
          is_super_admin: boolean
          is_volunteer: boolean
          is_active: boolean
        }[]
      }
      get_upcoming_events: {
        Args: { limit_count?: number }
        Returns: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_public: boolean | null
          location: string | null
          organizer: string | null
          start_date: string
          title: string
          updated_at: string | null
        }[]
      }
      get_users_with_roles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string
          last_name: string
          role: string
          is_super_admin: boolean
          is_active: boolean
        }[]
      }
      has_permission: {
        Args: { p_user_id: string; p_resource: string; p_action: string }
        Returns: boolean
      }
      has_role: {
        Args: { user_id: string; role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      register_device: {
        Args: {
          p_device_id: string
          p_name: string
          p_type: string
          p_location?: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "staff"
        | "parent"
        | "super_admin"
        | "teacher"
        | "teacher_assistant"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "staff",
        "parent",
        "super_admin",
        "teacher",
        "teacher_assistant",
      ],
    },
  },
} as const
