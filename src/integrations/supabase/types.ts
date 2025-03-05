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
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          is_super_admin: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_super_admin?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_super_admin?: boolean | null
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
          is_active: boolean
        }[]
      }
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "parent" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
