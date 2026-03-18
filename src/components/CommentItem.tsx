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
const MAX_CHARS = 500;

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
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [localReplies, setLocalReplies] = useState<Comment[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (!replyOpen || !replyInputRef.current) return;
    const mention = `@${comment.author} `;
    setReplyContent(mention);
    replyInputRef.current.focus();
    // Place cursor at end after value is set
    requestAnimationFrame(() => {
      if (replyInputRef.current) {
        replyInputRef.current.setSelectionRange(mention.length, mention.length);
      }
    });
  }, [replyOpen, comment.author]);

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

  const handleReplyClick = () => {
    setReplyOpen(true);
    setShowReplies(true);
  };

  const handleRepliesToggle = () => {
    const next = !showReplies;
    setShowReplies(next);
    if (!next) setReplyOpen(false);
  };

  const handleReplySubmit = () => {
    if (!replyContent.trim()) return;
    setLocalReplies(prev => [
      ...prev,
      {
        id: `${comment.id}-reply-${Date.now()}`,
        author: 'You',
        content: replyContent.trim(),
        createdAt: new Date(),
      },
    ]);
    setReplyContent('');
    setReplyOpen(false);
  };

  const totalReplies = (comment.replyCount ?? 0) + localReplies.length;
  const initials = comment.author.charAt(0).toUpperCase();
  const showRepliesSection = showReplies || replyOpen;

  return (
    <div className="comment-wrapper">
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

              <button className="comment-reply-btn" onClick={handleReplyClick}>Reply</button>
            </div>

            {totalReplies > 0 && (
              <button className="comment-replies-btn" onClick={handleRepliesToggle}>
                <span>{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</span>
                <ChevronDownIcon rotated={showReplies} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showRepliesSection && (
        <div className="comment-replies-section">
          {replyOpen && (
            <div className="reply-form-row">
              <div className="comment-avatar">Y</div>
              <div className="reply-form-content">
                <textarea
                  ref={replyInputRef}
                  className="comment-form-input"
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value.slice(0, MAX_CHARS))}
                  rows={2}
                />
                <div className="comment-form-actions">
                  <span className="comment-form-counter">{MAX_CHARS - replyContent.length}</span>
                  <button className="reply-cancel-btn" onClick={() => setReplyOpen(false)}>
                    Cancel
                  </button>
                  <button
                    className="reply-submit-btn"
                    onClick={handleReplySubmit}
                    disabled={!replyContent.trim()}
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}

          {showReplies && localReplies.map(reply => (
            <div key={reply.id} className="reply-item">
              <div className="comment-avatar">{reply.author.charAt(0).toUpperCase()}</div>
              <div className="comment-body">
                <div className="comment-header">
                  <div className="comment-header-left">
                    <span className="comment-author">{reply.author}</span>
                    <span className="comment-date">{formatRelativeTime(reply.createdAt)}</span>
                  </div>
                  <button className="comment-menu-btn" aria-label="More options">
                    <MoreOptionsIcon />
                  </button>
                </div>
                <p className="comment-content">{reply.content}</p>
                <div className="comment-actions">
                  <div className="comment-actions-left">
                    <div className="comment-emoji-wrapper">
                      <button className="comment-emoji-btn" aria-label="Add reaction">
                        <EmojiAddIcon active={false} />
                      </button>
                    </div>
                    <button className="comment-reply-btn">Reply</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
