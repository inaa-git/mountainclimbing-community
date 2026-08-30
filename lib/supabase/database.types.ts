export type HikingLevel = "beginner" | "intermediate" | "advanced";
export type ProfileRole = "user" | "moderator" | "admin";
export type ScheduleType = "general" | "theme" | "regular" | "event";
export type ScheduleDifficulty = "easy" | "easy_medium" | "medium" | "medium_hard" | "hard";
export type ScheduleStatus = "open" | "closed" | "completed" | "cancelled";
export type ParticipantStatus = "joined" | "cancelled" | "waitlisted";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          profile_image_url: string | null;
          region: string | null;
          introduction: string | null;
          hiking_level: HikingLevel | null;
          role: ProfileRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          profile_image_url?: string | null;
          region?: string | null;
          introduction?: string | null;
          hiking_level?: HikingLevel | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          profile_image_url?: string | null;
          region?: string | null;
          introduction?: string | null;
          hiking_level?: HikingLevel | null;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          schedule_type: ScheduleType;
          leader_id: string;
          hiking_date: string;
          start_time: string;
          end_time: string | null;
          meeting_location: string;
          region: string | null;
          mountain_name: string;
          course_description: string | null;
          difficulty: ScheduleDifficulty;
          max_participants: number | null;
          preparation: string | null;
          transportation: string | null;
          estimated_distance_km: number | null;
          estimated_duration_minutes: number | null;
          status: ScheduleStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          schedule_type: ScheduleType;
          leader_id: string;
          hiking_date: string;
          start_time: string;
          end_time?: string | null;
          meeting_location: string;
          region?: string | null;
          mountain_name: string;
          course_description?: string | null;
          difficulty: ScheduleDifficulty;
          max_participants?: number | null;
          preparation?: string | null;
          transportation?: string | null;
          estimated_distance_km?: number | null;
          estimated_duration_minutes?: number | null;
          status?: ScheduleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Database["public"]["Tables"]["schedules"]["Insert"], "id" | "leader_id">>;
        Relationships: [
          {
            foreignKeyName: "schedules_leader_id_fkey";
            columns: ["leader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      schedule_participants: {
        Row: {
          id: string;
          schedule_id: string;
          user_id: string;
          status: ParticipantStatus;
          joined_at: string;
          cancelled_at: string | null;
        };
        Insert: {
          id?: string;
          schedule_id: string;
          user_id: string;
          status?: ParticipantStatus;
          joined_at?: string;
          cancelled_at?: string | null;
        };
        Update: {
          status?: ParticipantStatus;
          joined_at?: string;
          cancelled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "schedule_participants_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "schedules";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedule_participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_schedule: {
        Args: { schedule_data: Record<string, unknown>; join_as_participant: boolean };
        Returns: ScheduleRpcResult & { schedule_id?: string };
      };
      join_schedule: { Args: { schedule_uuid: string }; Returns: ScheduleRpcResult };
      cancel_schedule_participation: { Args: { schedule_uuid: string }; Returns: ScheduleRpcResult };
      get_schedule_public_metadata: {
        Args: Record<never, never>;
        Returns: Array<{ schedule_id: string; leader_nickname: string; joined_count: number }>;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

export interface ScheduleRpcResult {
  success: boolean;
  code: string;
}
