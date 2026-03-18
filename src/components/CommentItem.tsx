import React, { useState, useEffect, useRef } from 'react';
import { EmojiAddIcon, MoreOptionsIcon, ChevronDownIcon } from './icons';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  reactions?: { emoji: string; count: number }[];
  replyCount?: number;
}

interface Reaction {
  emoji: string;
  count: number;
  mine: boolean;
}

interface CommentItemProps {
  comment: Comment;
}

const EMOJI_PICKER = ['👍', '👎', '😆', '😏', '😎'];

function formatRelativeTime(date: Date): string {
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function CommentItem({ comment }: CommentItemProps): React.ReactElement {
  const [reactions, setReactions] = useState<Reaction[]>(
    (comment.reactions ?? []).map(r => ({ ...r, mine: false }))
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !e.composedPath().includes(pickerRef.current)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  const handlePickerSelect = (emoji: string) => {
    setPickerOpen(false);
    setReactions(prev => {
      const existing = prev.find(r => r.emoji === emoji);
      if (existing) {
        if (existing.mine) {
          const updated = { ...existing, count: existing.count - 1, mine: false };
          return updated.count === 0
            ? prev.filter(r => r.emoji !== emoji)
            : prev.map(r => r.emoji === emoji ? updated : r);
        }
        return prev.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r);
      }
      return [...prev, { emoji, count: 1, mine: true }];
    });
  };

  const toggleReaction = (emoji: string) => {
    setReactions(prev => {
      const existing = prev.find(r => r.emoji === emoji);
      if (!existing) return prev;
      if (existing.mine) {
        const updated = { ...existing, count: existing.count - 1, mine: false };
        return updated.count === 0
          ? prev.filter(r => r.emoji !== emoji)
          : prev.map(r => r.emoji === emoji ? updated : r);
      }
      return prev.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r);
    });
  };

  const initials = comment.author.charAt(0).toUpperCase();

  return (
    <div className="comment-item">
      <div className="comment-avatar">{initials}</div>
      <div className="comment-body">
        <div className="comment-header">
          <div className="comment-header-left">
            <span className="comment-author">{comment.author}</span>
            <span className="comment-date">{formatRelativeTime(comment.createdAt)}</span>
          </div>
          <button className="comment-menu-btn" aria-label="More options">
            <MoreOptionsIcon />
          </button>
        </div>

        <p className="comment-content">{comment.content}</p>

        <div className="comment-actions">
          <div className="comment-actions-left">
            {reactions.map(r => (
              <button
                key={r.emoji}
                className={`comment-reaction${r.mine ? ' active' : ''}`}
                onClick={() => toggleReaction(r.emoji)}
              >
                <span className="comment-reaction-emoji">{r.emoji}</span>
                <span className="comment-reaction-count">{r.count}</span>
              </button>
            ))}

            <div className="comment-emoji-wrapper" ref={pickerRef}>
              <button
                className="comment-emoji-btn"
                onClick={() => setPickerOpen(v => !v)}
                aria-label="Add reaction"
              >
                <EmojiAddIcon active={pickerOpen} />
              </button>
              {pickerOpen && (
                <div className="comment-emoji-picker">
                  {EMOJI_PICKER.map(emoji => (
                    <button key={emoji} onClick={() => handlePickerSelect(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button className="comment-reply-btn">Reply</button>
          </div>

          {(comment.replyCount ?? 0) > 0 && (
            <button className="comment-replies-btn" onClick={() => setShowReplies(v => !v)}>
              <span>{comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}</span>
              <ChevronDownIcon rotated={showReplies} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
