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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource: string
          resource_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource?: string
          resource_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
            referencedRelation: "attendance_summary"
            referencedColumns: ["class_id"]
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
      calendar_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      child_notes: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          is_private: boolean | null
          note_text: string
          note_type: string | null
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_text: string
          note_type?: string | null
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_text?: string
          note_type?: string | null
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "child_notes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
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
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          recipient_id: string | null
          sender_id: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          recipient_id?: string | null
          sender_id?: string
          subject?: string | null
          updated_at?: string | null
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
        Relationships: []
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
        Relationships: []
      }
      qr_codes: {
        Row: {
          child_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          qr_data: string
        }
        Insert: {
          child_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_data: string
        }
        Update: {
          child_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          qr_data?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
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
      staff_invitations: {
        Row: {
          completed_at: string | null
          created_at: string
          email: string
          expires_at: string
          first_name: string
          id: string
          invitation_token: string
          invited_by: string | null
          last_name: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          first_name: string
          id?: string
          invitation_token: string
          invited_by?: string | null
          last_name: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          first_name?: string
          id?: string
          invitation_token?: string
          invited_by?: string | null
          last_name?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
            referencedRelation: "attendance_summary"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
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
        Relationships: []
      }
    }
    Views: {
      attendance_summary: {
        Row: {
          attendance_date: string | null
          checked_in_count: number | null
          checked_out_count: number | null
          class_id: string | null
          class_name: string | null
          currently_present: number | null
          total_children: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_organization_creator_role: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: boolean
      }
      check_sql_query_safety: { Args: { query: string }; Returns: boolean }
      checkin_child: {
        Args: {
          p_checked_in_by?: string
          p_child_id: string
          p_class_id?: string
        }
        Returns: string
      }
      checkout_child: {
        Args: { p_attendance_id: string; p_checked_out_by?: string }
        Returns: boolean
      }
      create_class_teacher_assignment: {
        Args: {
          p_age_range: string
          p_capacity: number
          p_class_name: string
          p_description: string
          p_room: string
          p_teacher_id: string
        }
        Returns: string
      }
      create_organization: {
        Args: {
          creator_id?: string
          font_family?: string
          org_name: string
          primary_color?: string
        }
        Returns: string
      }
      create_user_role:
        | {
            Args: {
              p_is_super_admin?: boolean
              p_is_volunteer?: boolean
              p_role?: Database["public"]["Enums"]["app_role"]
              p_user_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_is_super_admin?: boolean
              p_role?: Database["public"]["Enums"]["app_role"]
              p_user_id: string
            }
            Returns: string
          }
      get_all_events: {
        Args: never
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
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_attendance_report: {
        Args: { end_date: string; start_date: string }
        Returns: {
          attendance_date: string
          class_id: string
          class_name: string
          total_checked_in: number
          total_checked_out: number
        }[]
      }
      get_attendance_summary_secure: {
        Args: { p_date?: string }
        Returns: {
          attendance_date: string
          checked_in_count: number
          checked_out_count: number
          class_id: string
          class_name: string
          currently_present: number
          total_children: number
        }[]
      }
      get_class_roster_with_attendance: {
        Args: { class_id_param: string; date_param?: string }
        Returns: {
          check_in_time: string
          check_out_time: string
          child_id: string
          child_name: string
          is_present: boolean
        }[]
      }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_current_user_role_safe: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_current_user_role_secure: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_detailed_attendance_report: {
        Args: { end_date?: string; start_date?: string }
        Returns: {
          attendance_date: string
          check_in_time: string
          check_out_time: string
          child_name: string
          class_name: string
          duration_hours: number
        }[]
      }
      get_device_profile: { Args: { p_device_id: string }; Returns: Json }
      get_parent_children_with_classes: {
        Args: { parent_user_id: string }
        Returns: {
          age: number
          allergies: string
          child_id: string
          current_class_id: string
          current_class_name: string
          first_name: string
          last_name: string
        }[]
      }
      get_staff_members: {
        Args: never
        Returns: {
          email: string
          first_name: string
          is_active: boolean
          is_super_admin: boolean
          is_volunteer: boolean
          last_name: string
          phone: string
          role: string
          user_id: string
        }[]
      }
      get_todays_attendance: {
        Args: never
        Returns: {
          attendance_id: string
          checked_in_at: string
          checked_out_at: string
          child_id: string
          child_name: string
          class_name: string
          is_present: boolean
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
        SetofOptions: {
          from: "*"
          to: "events"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_email: { Args: { p_user_id: string }; Returns: string }
      get_users_emails: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          id: string
        }[]
      }
      get_users_with_roles: {
        Args: never
        Returns: {
          email: string
          first_name: string
          id: string
          is_active: boolean
          is_super_admin: boolean
          last_name: string
          role: string
        }[]
      }
      has_permission: {
        Args: { p_action: string; p_resource: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: { role: Database["public"]["Enums"]["app_role"]; user_id: string }
        Returns: boolean
      }
      has_role_secure: {
        Args: { check_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_secure: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_admin_user_safe: { Args: never; Returns: boolean }
      is_current_user_super_admin: { Args: never; Returns: boolean }
      is_super_admin_secure: { Args: never; Returns: boolean }
      register_device: {
        Args: {
          p_device_id: string
          p_location?: string
          p_name: string
          p_type: string
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
