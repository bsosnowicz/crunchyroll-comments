import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface Comment {
  id: string;
  video_id: string;
  video_url: string;
  user_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}
