import { useState, useEffect } from 'react';
import { supabase, type Comment } from '../lib/supabase';

export function useComments(videoId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pobierz komentarze przy załadowaniu
  useEffect(() => {
    if (!videoId) return;

    const fetchComments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (error) {
        setError('Nie udało się pobrać komentarzy');
      } else {
        setComments(data ?? []);
      }
      setLoading(false);
    };

    fetchComments();

    // Real-time — nowe komentarze bez odświeżania
    const channel = supabase
      .channel(`comments-${videoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `video_id=eq.${videoId}`,
      }, (payload) => {
        setComments(prev => [payload.new as Comment, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId]);

  // Dodaj komentarz
  const addComment = async (authorName: string, content: string) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        video_id: videoId,
        video_url: window.location.href,
        author_name: authorName,
        content,
        user_id: null, // null = tryb bez logowania (na start)
      })
      .select()
      .single();

    if (error) throw new Error('Nie udało się dodać komentarza');

    // Dodaj od razu lokalnie — nie czekamy na real-time event
    if (data) {
      setComments(prev => [data, ...prev]);
    }
  };

  // Usuń komentarz
  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw new Error('Nie udało się usunąć komentarza');

    // Usuń lokalnie bez refetch
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return { comments, loading, error, addComment, deleteComment };
}