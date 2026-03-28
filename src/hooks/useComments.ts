import { useState, useEffect } from 'react';
import { supabase, getSessionId, type Comment, type Reply, type Reaction } from '../lib/supabase';

export interface ReactionGroup {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ReplyWithReactions extends Reply {
  reactions: ReactionGroup[];
}

export interface CommentWithData extends Comment {
  replies: ReplyWithReactions[];
  reactions: ReactionGroup[];
}

function groupReactions(
  reactions: Reaction[],
  targetId: string,
  field: 'comment_id' | 'reply_id',
  effectiveId: string
): ReactionGroup[] {
  const filtered = reactions.filter(r => r[field] === targetId);
  const map = new Map<string, { count: number; mine: boolean }>();
  for (const r of filtered) {
    const prev = map.get(r.emoji) ?? { count: 0, mine: false };
    map.set(r.emoji, { count: prev.count + 1, mine: prev.mine || r.session_id === effectiveId });
  }
  return Array.from(map.entries()).map(([emoji, d]) => ({ emoji, ...d }));
}

function updateReactionGroups(
  reactions: ReactionGroup[],
  emoji: string,
  wasAlreadyMine: boolean
): ReactionGroup[] {
  const existing = reactions.find(r => r.emoji === emoji);
  if (wasAlreadyMine) {
    if (!existing) return reactions;
    const updated = { ...existing, count: existing.count - 1, mine: false };
    return updated.count === 0
      ? reactions.filter(r => r.emoji !== emoji)
      : reactions.map(r => r.emoji === emoji ? updated : r);
  } else {
    if (existing) {
      return reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r);
    }
    return [...reactions, { emoji, count: 1, mine: true }];
  }
}

export function useComments(videoId: string, userId: string | null = null) {
  const [comments, setComments] = useState<CommentWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = getSessionId();
  // For authenticated users, use their user ID so reactions are per-account,
  // not per-browser (session_id is shared across accounts on the same browser).
  const effectiveId = userId ?? sessionId;

  useEffect(() => {
    if (!videoId) return;

    const fetchAll = async () => {
      setLoading(true);

      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('video_id', videoId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        setError('Nie udało się pobrać komentarzy');
        setLoading(false);
        return;
      }

      const rawComments: Comment[] = commentsData ?? [];

      if (rawComments.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      const commentIds = rawComments.map(c => c.id);

      const [{ data: repliesData }, { data: commentReactionsData }] = await Promise.all([
        supabase.from('replies').select('*').in('comment_id', commentIds).order('created_at', { ascending: true }),
        supabase.from('reactions').select('*').in('comment_id', commentIds),
      ]);

      const replies: Reply[] = repliesData ?? [];
      const replyIds = replies.map(r => r.id);

      let replyReactions: Reaction[] = [];
      if (replyIds.length > 0) {
        const { data } = await supabase.from('reactions').select('*').in('reply_id', replyIds);
        replyReactions = data ?? [];
      }

      const allReactions: Reaction[] = [...(commentReactionsData ?? []), ...replyReactions];

      setComments(rawComments.map(comment => ({
        ...comment,
        reactions: groupReactions(allReactions, comment.id, 'comment_id', effectiveId),
        replies: replies
          .filter(r => r.comment_id === comment.id)
          .map(reply => ({
            ...reply,
            reactions: groupReactions(allReactions, reply.id, 'reply_id', effectiveId),
          })),
      })));
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel(`comments-${videoId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `video_id=eq.${videoId}`,
      }, (payload) => {
        const newComment = payload.new as Comment;
        setComments(prev => [{ ...newComment, replies: [], reactions: [] }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [videoId, effectiveId]);

  const addComment = async (authorName: string, content: string, userId: string | null = null) => {
    const { data, error } = await supabase
      .from('comments')
      .insert({ video_id: videoId, video_url: window.location.href, author_name: authorName, content, user_id: userId, session_id: sessionId })
      .select().single();

    if (error) throw new Error('Nie udało się dodać komentarza');
    if (data) {
      setComments(prev => [{ ...data, replies: [], reactions: [] }, ...prev]);
    }
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw new Error('Nie udało się usunąć komentarza');
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const editComment = async (commentId: string, content: string) => {
    const { error } = await supabase
      .from('comments')
      .update({ content, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', commentId);
    if (error) throw new Error('Nie udało się edytować komentarza');
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, content, is_edited: true } : c
    ));
  };

  const addReply = async (commentId: string, authorName: string, content: string, userId: string | null = null) => {
    const { data, error } = await supabase
      .from('replies')
      .insert({ comment_id: commentId, author_name: authorName, content, user_id: userId, session_id: sessionId })
      .select().single();

    if (error) throw new Error('Nie udało się dodać odpowiedzi');
    if (data) {
      const newReply: ReplyWithReactions = { ...data, reactions: [] };
      setComments(prev => prev.map(c =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
      ));
    }
  };

  const toggleReaction = async (emoji: string, commentId?: string, replyId?: string) => {
    let wasAlreadyMine = false;

    if (replyId) {
      const comment = comments.find(c => c.replies.some(r => r.id === replyId));
      const reply = comment?.replies.find(r => r.id === replyId);
      wasAlreadyMine = reply?.reactions.find(r => r.emoji === emoji)?.mine ?? false;
    } else if (commentId) {
      const comment = comments.find(c => c.id === commentId);
      wasAlreadyMine = comment?.reactions.find(r => r.emoji === emoji)?.mine ?? false;
    } else {
      return;
    }

    if (wasAlreadyMine) {
      const query = supabase.from('reactions').delete().eq('session_id', effectiveId).eq('emoji', emoji);
      const { error } = replyId
        ? await query.eq('reply_id', replyId)
        : await query.eq('comment_id', commentId!);
      if (error) throw new Error('Nie udało się usunąć reakcji');
    } else {
      const { error } = await supabase.from('reactions').insert({
        comment_id: replyId ? null : (commentId ?? null),
        reply_id: replyId ?? null,
        emoji,
        session_id: effectiveId,
      });
      if (error) {
        console.error('[reactions insert error]', error);
        throw new Error('Nie udało się dodać reakcji');
      }
    }

    setComments(prev => prev.map(comment => {
      if (replyId) {
        return {
          ...comment,
          replies: comment.replies.map(reply =>
            reply.id === replyId
              ? { ...reply, reactions: updateReactionGroups(reply.reactions, emoji, wasAlreadyMine) }
              : reply
          ),
        };
      }
      if (comment.id === commentId) {
        return { ...comment, reactions: updateReactionGroups(comment.reactions, emoji, wasAlreadyMine) };
      }
      return comment;
    }));
  };

  const editReply = async (replyId: string, content: string) => {
    const { error } = await supabase
      .from('replies')
      .update({ content, is_edited: true, updated_at: new Date().toISOString() })
      .eq('id', replyId);
    if (error) throw new Error('Nie udało się edytować odpowiedzi');
    setComments(prev => prev.map(c => ({
      ...c,
      replies: c.replies.map(r => r.id === replyId ? { ...r, content, is_edited: true } : r),
    })));
  };

  const deleteReply = async (replyId: string) => {
    const { error } = await supabase.from('replies').delete().eq('id', replyId);
    if (error) throw new Error('Nie udało się usunąć odpowiedzi');
    setComments(prev => prev.map(c => ({
      ...c,
      replies: c.replies.filter(r => r.id !== replyId),
    })));
  };

  return { comments, loading, error, sessionId, addComment, deleteComment, editComment, addReply, editReply, deleteReply, toggleReaction };
}
