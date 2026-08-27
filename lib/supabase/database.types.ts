export type HikingLevel = "beginner" | "intermediate" | "advanced";
export type ProfileRole = "user" | "moderator" | "admin";

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
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
