export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          details: Json | null;
          email: string;
          id: string;
          name: string | null;
          register_complete: boolean;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          details?: Json | null;
          email: string;
          id: string;
          name?: string | null;
          register_complete: boolean;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          details?: Json | null;
          email?: string;
          id?: string;
          name?: string | null;
          register_complete?: boolean;
        };
        Relationships: [];
      };
      descriptions: {
        Row: {
          content: Json;
          created_at: string;
          embedding: string;
          id: string;
          name: string | null;
          room_id: string | null;
          unique: boolean;
          user_id: string | null;
          user_ids: string[] | null;
        };
        Insert: {
          content: Json;
          created_at?: string;
          embedding: string;
          id?: string;
          name?: string | null;
          room_id?: string | null;
          unique?: boolean;
          user_id?: string | null;
          user_ids?: string[] | null;
        };
        Update: {
          content?: Json;
          created_at?: string;
          embedding?: string;
          id?: string;
          name?: string | null;
          room_id?: string | null;
          unique?: boolean;
          user_id?: string | null;
          user_ids?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "descriptions_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "descriptions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          created_at: string;
          description: string | null;
          id: string;
          name: string | null;
          objectives: Json[];
          status: string | null;
          user_id: string | null;
          user_ids: string[];
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string | null;
          objectives?: Json[];
          status?: string | null;
          user_id?: string | null;
          user_ids?: string[];
        };
        Update: {
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string | null;
          objectives?: Json[];
          status?: string | null;
          user_id?: string | null;
          user_ids?: string[];
        };
        Relationships: [];
      };
      logs: {
        Row: {
          agent_id: string;
          body: Json;
          created_at: string;
          id: string;
          room_id: string;
          type: string;
          user_id: string;
          user_ids: string[];
        };
        Insert: {
          agent_id: string;
          body: Json;
          created_at?: string;
          id?: string;
          room_id: string;
          type: string;
          user_id: string;
          user_ids: string[];
        };
        Update: {
          agent_id?: string;
          body?: Json;
          created_at?: string;
          id?: string;
          room_id?: string;
          type?: string;
          user_id?: string;
          user_ids?: string[];
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: Json | null;
          created_at: string;
          embedding: string | null;
          id: string;
          is_edited: boolean | null;
          room_id: string | null;
          unique: boolean;
          updated_at: string | null;
          user_id: string | null;
          user_ids: string[];
        };
        Insert: {
          content?: Json | null;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          is_edited?: boolean | null;
          room_id?: string | null;
          unique?: boolean;
          updated_at?: string | null;
          user_id?: string | null;
          user_ids?: string[];
        };
        Update: {
          content?: Json | null;
          created_at?: string;
          embedding?: string | null;
          id?: string;
          is_edited?: boolean | null;
          room_id?: string | null;
          unique?: boolean;
          updated_at?: string | null;
          user_id?: string | null;
          user_ids?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      participants: {
        Row: {
          created_at: string;
          id: string;
          last_message_read: string | null;
          room_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_message_read?: string | null;
          room_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_message_read?: string | null;
          room_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "participants_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      relationships: {
        Row: {
          created_at: string;
          id: string;
          room_id: string | null;
          status: string | null;
          user_a: string | null;
          user_b: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          room_id?: string | null;
          status?: string | null;
          user_a?: string | null;
          user_b?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          room_id?: string | null;
          status?: string | null;
          user_a?: string | null;
          user_b?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "relationships_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relationships_user_a_fkey";
            columns: ["user_a"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relationships_user_b_fkey";
            columns: ["user_b"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "relationships_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      summarizations: {
        Row: {
          content: Json;
          created_at: string;
          embedding: string;
          id: string;
          room_id: string | null;
          unique: boolean;
          user_id: string | null;
          user_ids: string[] | null;
        };
        Insert: {
          content: Json;
          created_at?: string;
          embedding: string;
          id?: string;
          room_id?: string | null;
          unique?: boolean;
          user_id?: string | null;
          user_ids?: string[] | null;
        };
        Update: {
          content?: Json;
          created_at?: string;
          embedding?: string;
          id?: string;
          room_id?: string | null;
          unique?: boolean;
          user_id?: string | null;
          user_ids?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "reflections_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reflections_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_similarity_and_insert: {
        Args: {
          query_table_name: string;
          query_user_id: string;
          query_user_ids: string[];
          query_content: Json;
          query_room_id: string;
          query_embedding: string;
          similarity_threshold: number;
        };
        Returns: undefined;
      };
      count_memories: {
        Args: {
          query_table_name: string;
          query_user_ids: string[];
          query_unique?: boolean;
        };
        Returns: number;
      };
      create_friendship_and_room_for_user: {
        Args: {
          p_new_user_id: string;
        };
        Returns: undefined;
      };
      get_goals_by_user_ids: {
        Args: {
          query_user_ids: string[];
          query_user_id?: string;
          only_in_progress?: boolean;
          row_count?: number;
        };
        Returns: {
          created_at: string;
          description: string | null;
          id: string;
          name: string | null;
          objectives: Json[];
          status: string | null;
          user_id: string | null;
          user_ids: string[];
        }[];
      };
      get_memories: {
        Args: {
          query_table_name: string;
          query_user_ids: string[];
          query_count: number;
          query_unique?: boolean;
        };
        Returns: {
          id: string;
          user_id: string;
          content: Json;
          created_at: string;
          user_ids: string[];
          room_id: string;
          embedding: string;
        }[];
      };
      get_message_count: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          room_id: string;
          unread_messages_count: number;
        }[];
      };
      get_recent_rows_per_user: {
        Args: {
          query_table_name: string;
          array_of_uuid_arrays: string[];
          n_rows_per_user: number;
          timestamp_column_name: string;
        };
        Returns: {
          user_id: string;
          content: Json;
          timestamp_column: string;
        }[];
      };
      get_relationship: {
        Args: {
          usera: string;
          userb: string;
        };
        Returns: {
          created_at: string;
          id: string;
          room_id: string | null;
          status: string | null;
          user_a: string | null;
          user_b: string | null;
          user_id: string;
        }[];
      };
      is_user_participant_in_room: {
        Args: {
          p_user_id: string;
          p_room_id: string;
        };
        Returns: boolean;
      };
      remove_memories: {
        Args: {
          query_table_name: string;
          query_user_ids: string[];
        };
        Returns: undefined;
      };
      search_memories: {
        Args: {
          query_table_name: string;
          query_user_ids: string[];
          query_embedding: string;
          query_match_threshold: number;
          query_match_count: number;
          query_unique: boolean;
        };
        Returns: {
          id: string;
          user_id: string;
          content: Json;
          created_at: string;
          similarity: number;
          user_ids: string[];
          room_id: string;
          embedding: string;
        }[];
      };
      search_messages: {
        Args: {
          query_embedding: string;
          similarity_threshold: number;
          match_count: number;
          owner_id: string;
          chat_id?: string;
        };
        Returns: {
          content: string;
          role: string;
          created_at: string;
        }[];
      };
    };
    Enums: {
      pricing_plan_interval: "day" | "week" | "month" | "year";
      pricing_type: "one_time" | "recurring";
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null;
          avif_autodetection: boolean | null;
          created_at: string | null;
          file_size_limit: number | null;
          id: string;
          name: string;
          owner: string | null;
          owner_id: string | null;
          public: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id: string;
          name: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_mime_types?: string[] | null;
          avif_autodetection?: boolean | null;
          created_at?: string | null;
          file_size_limit?: number | null;
          id?: string;
          name?: string;
          owner?: string | null;
          owner_id?: string | null;
          public?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      migrations: {
        Row: {
          executed_at: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Insert: {
          executed_at?: string | null;
          hash: string;
          id: number;
          name: string;
        };
        Update: {
          executed_at?: string | null;
          hash?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      objects: {
        Row: {
          bucket_id: string | null;
          created_at: string | null;
          id: string;
          last_accessed_at: string | null;
          metadata: Json | null;
          name: string | null;
          owner: string | null;
          owner_id: string | null;
          path_tokens: string[] | null;
          updated_at: string | null;
          version: string | null;
        };
        Insert: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Update: {
          bucket_id?: string | null;
          created_at?: string | null;
          id?: string;
          last_accessed_at?: string | null;
          metadata?: Json | null;
          name?: string | null;
          owner?: string | null;
          owner_id?: string | null;
          path_tokens?: string[] | null;
          updated_at?: string | null;
          version?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey";
            columns: ["bucket_id"];
            isOneToOne: false;
            referencedRelation: "buckets";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string;
          name: string;
          owner: string;
          metadata: Json;
        };
        Returns: undefined;
      };
      extension: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      filename: {
        Args: {
          name: string;
        };
        Returns: string;
      };
      foldername: {
        Args: {
          name: string;
        };
        Returns: unknown;
      };
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>;
        Returns: {
          size: number;
          bucket_id: string;
        }[];
      };
      search: {
        Args: {
          prefix: string;
          bucketname: string;
          limits?: number;
          levels?: number;
          offsets?: number;
          search?: string;
          sortcolumn?: string;
          sortorder?: string;
        };
        Returns: {
          name: string;
          id: string;
          updated_at: string;
          created_at: string;
          last_accessed_at: string;
          metadata: Json;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;
