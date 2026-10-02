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
      flock_event_attendance: {
        Row: {
          event_id: string
          response: Database['public']['Enums']['flock_event_response']
          updated_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          response: Database['public']['Enums']['flock_event_response']
          updated_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          response?: Database['public']['Enums']['flock_event_response']
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flock_event_attendance_event_id_fkey'
            columns: ['event_id']
            isOneToOne: false
            referencedRelation: 'flock_events'
            referencedColumns: ['id']
          },
        ]
      }
      flock_events: {
        Row: {
          created_at: string
          created_by: string
          description: string
          flock_id: string
          id: string
          location: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          flock_id: string
          id?: string
          location: string
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          flock_id?: string
          id?: string
          location?: string
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flock_events_flock_id_fkey'
            columns: ['flock_id']
            isOneToOne: false
            referencedRelation: 'flocks'
            referencedColumns: ['id']
          },
        ]
      }
      flock_members: {
        Row: {
          flock_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          flock_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          flock_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'flock_members_flock_id_fkey'
            columns: ['flock_id']
            isOneToOne: false
            referencedRelation: 'flocks'
            referencedColumns: ['id']
          },
        ]
      }
      flocks: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          location?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_flock_invitation: {
        Args: { invitation_token: string }
        Returns: {
          id: string
          name: string
          owner_id: string
        }[]
      }
      create_flock_event: {
        Args: {
          event_description?: string
          event_location: string
          event_starts_at: string
          event_title: string
          target_flock_id: string
        }
        Returns: {
          created_at: string
          created_by: string
          description: string
          flock_id: string
          id: string
          location: string
          starts_at: string
          title: string
        }[]
      }
      update_flock_event: {
        Args: {
          event_description?: string
          event_location: string
          event_starts_at: string
          event_title: string
          target_event_id: string
        }
        Returns: {
          created_at: string
          created_by: string
          description: string
          flock_id: string
          id: string
          location: string
          starts_at: string
          title: string
        }[]
      }
      create_flock_invitation: {
        Args: { target_flock_id: string }
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      list_flock_members: {
        Args: { target_flock_id: string }
        Returns: {
          display_name: string
          joined_at: string
          location: string
          role: string
          user_id: string
        }[]
      }
      set_flock_event_response: {
        Args: {
          next_response: Database['public']['Enums']['flock_event_response']
          target_event_id: string
        }
        Returns: {
          event_id: string
          response: Database['public']['Enums']['flock_event_response']
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: '*'
          to: 'flock_event_attendance'
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_my_profile: {
        Args: { next_display_name: string; next_location?: string }
        Returns: {
          display_name: string
          location: string
          updated_at: string
          user_id: string
        }[]
      }
    }
    Enums: {
      flock_event_response: 'in' | 'out' | 'maybe'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      flock_event_response: ['in', 'out', 'maybe'],
    },
  },
} as const
