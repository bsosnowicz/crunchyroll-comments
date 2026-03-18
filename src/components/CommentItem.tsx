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

// ── Reply Form ─────────────────────────────────────────────────────────────────

interface ReplyFormProps {
  replyToAuthor: string;
  onSubmit: (content: string) => void;
  onCancel: () => void;
}

function ReplyForm({ replyToAuthor, onSubmit, onCancel }: ReplyFormProps): React.ReactElement {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mention = `@${replyToAuthor} `;

  useEffect(() => {
    setContent(mention);
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(mention.length, mention.length);
      }
    });
  }, [replyToAuthor]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Don't allow deleting the @mention prefix
    const val = e.target.value;
    if (!val.startsWith(mention)) {
      setContent(mention);
      return;
    }
    setContent(val.slice(0, MAX_CHARS));
  };

  const handleSubmit = () => {
    if (!content.trim() || content.trim() === mention.trim()) return;
    onSubmit(content.trim());
    setContent(mention);
  };

  return (
    <div className="reply-form-row">
      <div className="comment-avatar">Y</div>
      <div className="reply-form-content">
        <div className="reply-form-input-wrapper">
          <textarea
            ref={inputRef}
            className="comment-form-input reply-form-input"
            value={content}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div className="comment-form-actions">
          <span className="comment-form-counter">{MAX_CHARS - content.length}</span>
          <button className="reply-cancel-btn" onClick={onCancel}>Cancel</button>
          <button
            className="reply-submit-btn"
            onClick={handleSubmit}
            disabled={content.trim() === mention.trim() || !content.trim()}
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reply Item ─────────────────────────────────────────────────────────────────

interface ReplyItemProps {
  reply: Comment;
  onReply: () => void;
}

function ReplyItem({ reply, onReply }: ReplyItemProps): React.ReactElement {
  const [reactions, setReactions] = useState<Reaction[]>(
    (reply.reactions ?? []).map(r => ({ ...r, mine: false }))
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const initials = reply.author.charAt(0).toUpperCase();

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

  return (
    <div className="reply-item">
      <div className="comment-avatar">{initials}</div>
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
            <button className="comment-reply-btn" onClick={onReply}>Reply</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Comment Item ───────────────────────────────────────────────────────────────

export function CommentItem({ comment }: CommentItemProps): React.ReactElement {
  const [reactions, setReactions] = useState<Reaction[]>(
    (comment.reactions ?? []).map(r => ({ ...r, mine: false }))
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  // replyingTo: null = closed, 'main' = replying to main comment, id = replying to specific reply
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [localReplies, setLocalReplies] = useState<Comment[]>([]);
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

  const handleReplyToMain = () => {
    setReplyingTo({ id: 'main', author: comment.author });
    setShowReplies(true);
  };

  const handleReplyToReply = (reply: Comment) => {
    setReplyingTo({ id: reply.id, author: reply.author });
    setShowReplies(true);
  };

  const handleRepliesToggle = () => {
    const next = !showReplies;
    setShowReplies(next);
    if (!next) setReplyingTo(null);
  };

  const handleReplySubmit = (content: string) => {
    setLocalReplies(prev => [
      ...prev,
      {
        id: `${comment.id}-reply-${Date.now()}`,
        author: 'You',
        content,
        createdAt: new Date(),
      },
    ]);
    setReplyingTo(null);
  };

  const totalReplies = (comment.replyCount ?? 0) + localReplies.length;
  const initials = comment.author.charAt(0).toUpperCase();
  const showRepliesSection = showReplies || replyingTo !== null;

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

              <button className="comment-reply-btn" onClick={handleReplyToMain}>Reply</button>
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
          {replyingTo?.id === 'main' && (
            <ReplyForm
              replyToAuthor={replyingTo.author}
              onSubmit={handleReplySubmit}
              onCancel={() => setReplyingTo(null)}
            />
          )}

          {showReplies && localReplies.map(reply => (
            <React.Fragment key={reply.id}>
              <ReplyItem
                reply={reply}
                onReply={() => handleReplyToReply(reply)}
              />
              {replyingTo?.id === reply.id && (
                <ReplyForm
                  replyToAuthor={replyingTo.author}
                  onSubmit={handleReplySubmit}
                  onCancel={() => setReplyingTo(null)}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
