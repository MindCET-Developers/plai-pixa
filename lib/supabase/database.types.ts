export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      device_type: "desktop" | "tablet" | "mobile" | "unknown";
      game_progress: "setup" | "waiting" | "active" | "between_rounds" | "results" | "closed";
      images_level: "beginners" | "advanced" | "experts" | "mine";
      lang: "hebrew" | "arabic" | "english";
      option_school: "other";
      reviewer_type: "teacher" | "student";
    };
    Tables: {
      bad_prompts: {
        Row: {
          created_at: string;
          game_id: string | null;
          id: string;
          prompt_text: string;
          reason_text: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          id?: string;
          prompt_text: string;
          reason_text?: string | null;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bad_prompts"]["Insert"]>;
        Relationships: [];
      };
      banned_words: {
        Row: { created_at: string; id: string; word_text: string };
        Insert: { created_at?: string; id?: string; word_text: string };
        Update: Partial<Database["public"]["Tables"]["banned_words"]["Insert"]>;
        Relationships: [];
      };
      feedback: {
        Row: {
          created_at: string;
          email_text: string | null;
          id: string;
          message_text: string;
          name_text: string | null;
        };
        Insert: {
          created_at?: string;
          email_text?: string | null;
          id?: string;
          message_text: string;
          name_text?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["feedback"]["Insert"]>;
        Relationships: [];
      };
      game_images: {
        Row: { created_at: string; game_id: string; id: string; image_id: string; position: number };
        Insert: { created_at?: string; game_id: string; id?: string; image_id: string; position: number };
        Update: Partial<Database["public"]["Tables"]["game_images"]["Insert"]>;
        Relationships: [];
      };
      game_players: {
        Row: {
          device_used_option_device: Database["public"]["Enums"]["device_type"];
          game_id: string;
          id: string;
          joined_at: string;
          last_seen_at: string | null;
          user_id: string;
        };
        Insert: {
          device_used_option_device?: Database["public"]["Enums"]["device_type"];
          game_id: string;
          id?: string;
          joined_at?: string;
          last_seen_at?: string | null;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["game_players"]["Insert"]>;
        Relationships: [];
      };
      games: {
        Row: {
          created_at: string;
          created_images_boolean: boolean;
          creator_user_id: string | null;
          current_image_id: string | null;
          current_round_index: number;
          finished_at: string | null;
          game_started_boolean: boolean;
          id: string;
          id_number: number;
          progress_option_progress: Database["public"]["Enums"]["game_progress"];
          qr_code_ilan_custom_image_id: string | null;
          qr_code_ilan_url_text: string | null;
          results_showing_boolean: boolean;
          started_at: string | null;
          teacher_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_images_boolean?: boolean;
          creator_user_id?: string | null;
          current_image_id?: string | null;
          current_round_index?: number;
          finished_at?: string | null;
          game_started_boolean?: boolean;
          id?: string;
          id_number: number;
          progress_option_progress?: Database["public"]["Enums"]["game_progress"];
          qr_code_ilan_custom_image_id?: string | null;
          qr_code_ilan_url_text?: string | null;
          results_showing_boolean?: boolean;
          started_at?: string | null;
          teacher_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [];
      };
      games_data: {
        Row: {
          created_at: string;
          duration_seconds: number | null;
          finished_at: string | null;
          game_id: string | null;
          id: string;
          id_number: number | null;
          players_count_number: number;
          progress_option_progress: Database["public"]["Enums"]["game_progress"] | null;
          started_at: string | null;
          submissions_count_number: number;
          teacher_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          duration_seconds?: number | null;
          finished_at?: string | null;
          game_id?: string | null;
          id?: string;
          id_number?: number | null;
          players_count_number?: number;
          progress_option_progress?: Database["public"]["Enums"]["game_progress"] | null;
          started_at?: string | null;
          submissions_count_number?: number;
          teacher_id?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["games_data"]["Insert"]>;
        Relationships: [];
      };
      images: {
        Row: {
          back_boolean: boolean;
          created_at: string;
          id: string;
          level_option_images_level: Database["public"]["Enums"]["images_level"];
          owner_user_id: string | null;
          pic_image: string | null;
          prompt_text: string;
          runware_task_uuid: string | null;
          source_boolean: boolean;
          updated_at: string;
          url_text: string;
        };
        Insert: {
          back_boolean?: boolean;
          created_at?: string;
          id?: string;
          level_option_images_level?: Database["public"]["Enums"]["images_level"];
          owner_user_id?: string | null;
          pic_image?: string | null;
          prompt_text: string;
          runware_task_uuid?: string | null;
          source_boolean?: boolean;
          updated_at?: string;
          url_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["images"]["Insert"]>;
        Relationships: [];
      };
      submissions: {
        Row: {
          ai_raw_json: Json | null;
          created_at: string;
          game_id: string;
          generated_image_url_text: string | null;
          id: string;
          image_comparison_score: number | null;
          image_id: string | null;
          prompt_comparison_score: number | null;
          revised_prompt_text: string | null;
          score1_number: number;
          score_breakdown_text: string | null;
          score_text: string | null;
          sent_prompt_text: string;
          target_image_id: string;
          tip_text: string | null;
          translated_prompt_text: string | null;
          try_number: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          ai_raw_json?: Json | null;
          created_at?: string;
          game_id: string;
          generated_image_url_text?: string | null;
          id?: string;
          image_comparison_score?: number | null;
          image_id?: string | null;
          prompt_comparison_score?: number | null;
          revised_prompt_text?: string | null;
          score1_number?: number;
          score_breakdown_text?: string | null;
          score_text?: string | null;
          sent_prompt_text: string;
          target_image_id: string;
          tip_text?: string | null;
          translated_prompt_text?: string | null;
          try_number?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["submissions"]["Insert"]>;
        Relationships: [];
      };
      teachers: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          email_text: string;
          id: string;
          name_text: string | null;
          progress_and_players_text: string | null;
          school_text: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          email_text: string;
          id?: string;
          name_text?: string | null;
          progress_and_players_text?: string | null;
          school_text?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["teachers"]["Insert"]>;
        Relationships: [];
      };
      user_schools: {
        Row: {
          created_at: string;
          id: string;
          school: Database["public"]["Enums"]["option_school"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          school?: Database["public"]["Enums"]["option_school"];
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_schools"]["Insert"]>;
        Relationships: [];
      };
      users: {
        Row: {
          admin_permissions_boolean: boolean;
          auth_user_id: string | null;
          avatar_image: string | null;
          created_at: string;
          current_score_number: number;
          final_score_number: number;
          id: string;
          language_option_lang: Database["public"]["Enums"]["lang"];
          name_text: string | null;
          pixa_game_count_number: number;
          pixa_last_logged_date: string | null;
          updated_at: string;
          username_text: string | null;
        };
        Insert: {
          admin_permissions_boolean?: boolean;
          auth_user_id?: string | null;
          avatar_image?: string | null;
          created_at?: string;
          current_score_number?: number;
          final_score_number?: number;
          id?: string;
          language_option_lang?: Database["public"]["Enums"]["lang"];
          name_text?: string | null;
          pixa_game_count_number?: number;
          pixa_last_logged_date?: string | null;
          updated_at?: string;
          username_text?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      visits: {
        Row: {
          cameback_number: number;
          created_at: string;
          id: string;
          pdf_file_file: string | null;
          pressed_number: number;
          tested_number: number;
          updated_at: string;
          visits_count_number: number;
        };
        Insert: {
          cameback_number?: number;
          created_at?: string;
          id?: string;
          pdf_file_file?: string | null;
          pressed_number?: number;
          tested_number?: number;
          updated_at?: string;
          visits_count_number?: number;
        };
        Update: Partial<Database["public"]["Tables"]["visits"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
