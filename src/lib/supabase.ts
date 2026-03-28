import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function getSessionId(): string {
  const key = 'crunchyroll_comments_session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export interface Comment {
  id: string;
  video_id: string;
  video_url: string;
  user_id: string | null;
  author_name: string;
  content: string;
  is_edited: boolean;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reply {
  id: string;
  comment_id: string;
  author_name: string;
  content: string;
  user_id: string | null;
  is_edited: boolean;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reaction {
  id: string;
  comment_id: string | null;
  reply_id: string | null;
  emoji: string;
  session_id: string;
  created_at: string;
}
