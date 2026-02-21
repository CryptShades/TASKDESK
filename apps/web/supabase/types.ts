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
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          org_id: string
          name: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
          expo_push_token: string | null
          created_at: string
        }
        Insert: {
          id: string
          org_id: string
          name: string
          email: string
          role: Database["public"]["Enums"]["user_role"]
          expo_push_token?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          email?: string
          role?: Database["public"]["Enums"]["user_role"]
          expo_push_token?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          org_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      campaigns: {
        Row: {
          id: string
          org_id: string
          client_id: string
          name: string
          launch_date: string
          risk_status: Database["public"]["Enums"]["campaign_risk"]
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          client_id: string
          name: string
          launch_date: string
          risk_status?: Database["public"]["Enums"]["campaign_risk"]
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          client_id?: string
          name?: string
          launch_date?: string
          risk_status?: Database["public"]["Enums"]["campaign_risk"]
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          campaign_id: string
          org_id: string
          title: string
          owner_id: string
          due_date: string
          dependency_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          risk_flag: Database["public"]["Enums"]["task_risk_flag"] | null
          assigned_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          org_id: string
          title: string
          owner_id: string
          due_date: string
          dependency_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          risk_flag?: Database["public"]["Enums"]["task_risk_flag"] | null
          assigned_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          org_id?: string
          title?: string
          owner_id?: string
          due_date?: string
          dependency_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          risk_flag?: Database["public"]["Enums"]["task_risk_flag"] | null
          assigned_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_dependency_id_fkey"
            columns: ["dependency_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      task_events: {
        Row: {
          id: string
          task_id: string
          org_id: string
          actor_id: string
          event_type: string
          old_value: string | null
          new_value: string | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          org_id: string
          actor_id: string
          event_type: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          org_id?: string
          actor_id?: string
          event_type?: string
          old_value?: string | null
          new_value?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          org_id: string
          user_id: string
          task_id: string | null
          campaign_id: string | null
          type: string
          message: string
          read: boolean
          delivered_push: boolean
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          task_id?: string | null
          campaign_id?: string | null
          type: string
          message: string
          read?: boolean
          delivered_push?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          task_id?: string | null
          campaign_id?: string | null
          type?: string
          message?: string
          read?: boolean
          delivered_push?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_user_role: {
        Args: { p_user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      user_role: "founder" | "manager" | "member"
      campaign_risk: "normal" | "at_risk" | "high_risk"
      task_status: "not_started" | "in_progress" | "completed" | "blocked"
      task_risk_flag: "soft_risk" | "hard_risk"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
