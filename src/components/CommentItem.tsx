import React, { useState, useEffect, useRef } from 'react';
import { EmojiAddIcon, MoreOptionsIcon, ChevronDownIcon } from './icons';

export interface UIReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface UIReply {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  reactions: UIReaction[];
  isEdited: boolean;
  isOwner: boolean;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  reactions: UIReaction[];
  replies: UIReply[];
  isEdited: boolean;
  isOwner: boolean;
}

interface CommentItemProps {
  comment: Comment;
  canInteract: boolean;
  onAddReply: (content: string) => Promise<void>;
  onToggleReaction: (emoji: string, replyId?: string) => Promise<void>;
  onEdit: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onEditReply: (replyId: string, content: string) => Promise<void>;
  onDeleteReply: (replyId: string) => Promise<void>;
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

// ── Comment Menu (3-dots dropdown) ────────────────────────────────────────────

interface CommentMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

function CommentMenu({ onEdit, onDelete }: CommentMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !e.composedPath().includes(ref.current)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="comment-menu-wrapper">
      <button className="comment-menu-btn" onClick={() => setOpen(v => !v)} aria-label="More options">
        <MoreOptionsIcon />
      </button>
      {open && (
        <div className="comment-dropdown">
          <button
            className="comment-dropdown-item"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            Edit
          </button>
          <button
            className="comment-dropdown-item comment-dropdown-item--danger"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ── Edit Form ──────────────────────────────────────────────────────────────────

interface EditFormProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

function EditForm({ initialContent, onSave, onCancel }: EditFormProps): React.ReactElement {
  const [content, setContent] = useState(initialContent);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const len = initialContent.length;
    ref.current?.setSelectionRange(len, len);
  }, []);

  return (
    <div className="edit-form-wrapper">
      <textarea
        ref={ref}
        className="comment-form-input"
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
        rows={3}
      />
      <div className="comment-form-actions">
        <span className="comment-form-counter">{MAX_CHARS - content.length}</span>
        <button className="reply-cancel-btn" onClick={onCancel}>Cancel</button>
        <button
          className="reply-submit-btn"
          disabled={!content.trim() || content.trim() === initialContent.trim()}
          onClick={() => onSave(content.trim())}
        >
          Save
        </button>
      </div>
    </div>
  );
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
        <textarea
          ref={inputRef}
          className="comment-form-input reply-form-input"
          value={content}
          onChange={handleChange}
          rows={2}
        />
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
  reply: UIReply;
  canInteract: boolean;
  onReply: () => void;
  onToggleReaction: (emoji: string) => void;
  onEdit: (content: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

function ReplyItem({ reply, canInteract, onReply, onToggleReaction, onEdit, onDelete }: ReplyItemProps): React.ReactElement {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const initials = reply.author.charAt(0).toUpperCase();
  const isOwner = reply.isOwner;

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
    onToggleReaction(emoji);
  };

  const handleSaveEdit = async (content: string) => {
    await onEdit(content);
    setEditMode(false);
  };

  return (
    <div className="reply-item">
      <div className="comment-avatar">{initials}</div>
      <div className="comment-body">
        <div className="comment-header">
          <div className="comment-header-left">
            <span className="comment-author">{reply.author}</span>
            <span className="comment-date">{formatRelativeTime(reply.createdAt)}</span>
            {reply.isEdited && <span className="comment-edited-label">(edited)</span>}
          </div>
          {isOwner && (
            <CommentMenu
              onEdit={() => setEditMode(true)}
              onDelete={onDelete}
            />
          )}
        </div>

        {editMode ? (
          <EditForm
            initialContent={reply.content}
            onSave={handleSaveEdit}
            onCancel={() => setEditMode(false)}
          />
        ) : (
          <p className="comment-content">{reply.content}</p>
        )}

        {!editMode && (
          <div className="comment-actions">
            <div className="comment-actions-left">
              {reply.reactions.map(r => (
                <button
                  key={r.emoji}
                  className={`comment-reaction${r.mine ? ' active' : ''}`}
                  onClick={canInteract ? () => onToggleReaction(r.emoji) : undefined}
                  style={canInteract ? undefined : { cursor: 'default' }}
                >
                  <span className="comment-reaction-emoji">{r.emoji}</span>
                  <span className="comment-reaction-count">{r.count}</span>
                </button>
              ))}
              {canInteract && (
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
              )}
              {canInteract && (
                <button className="comment-reply-btn" onClick={onReply}>Reply</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Comment Item ───────────────────────────────────────────────────────────────

export function CommentItem({ comment, canInteract, onAddReply, onToggleReaction, onEdit, onDelete, onEditReply, onDeleteReply }: CommentItemProps): React.ReactElement {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const isOwner = comment.isOwner;

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
    onToggleReaction(emoji);
  };

  const handleReplyToMain = () => {
    setReplyingTo({ id: 'main', author: comment.author });
    setShowReplies(true);
  };

  const handleReplyToReply = (reply: UIReply) => {
    setReplyingTo({ id: reply.id, author: reply.author });
    setShowReplies(true);
  };

  const handleRepliesToggle = () => {
    const next = !showReplies;
    setShowReplies(next);
    if (!next) setReplyingTo(null);
  };

  const handleReplySubmit = (content: string) => {
    onAddReply(content);
    setReplyingTo(null);
    setShowReplies(true);
  };

  const handleSaveEdit = async (content: string) => {
    await onEdit(content);
    setEditMode(false);
  };

  const totalReplies = comment.replies.length;
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
              {comment.isEdited && <span className="comment-edited-label">(edited)</span>}
            </div>
            {isOwner && (
              <CommentMenu
                onEdit={() => setEditMode(true)}
                onDelete={onDelete}
              />
            )}
          </div>

          {editMode ? (
            <EditForm
              initialContent={comment.content}
              onSave={handleSaveEdit}
              onCancel={() => setEditMode(false)}
            />
          ) : (
            <p className="comment-content">{comment.content}</p>
          )}

          {!editMode && (
            <div className="comment-actions">
              <div className="comment-actions-left">
                {comment.reactions.map(r => (
                  <button
                    key={r.emoji}
                    className={`comment-reaction${r.mine ? ' active' : ''}`}
                    onClick={canInteract ? () => onToggleReaction(r.emoji) : undefined}
                    style={canInteract ? undefined : { cursor: 'default' }}
                  >
                    <span className="comment-reaction-emoji">{r.emoji}</span>
                    <span className="comment-reaction-count">{r.count}</span>
                  </button>
                ))}

                {canInteract && (
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
                )}

                {canInteract && (
                  <button className="comment-reply-btn" onClick={handleReplyToMain}>Reply</button>
                )}
              </div>

              {totalReplies > 0 && (
                <button className="comment-replies-btn" onClick={handleRepliesToggle}>
                  <span>{totalReplies} {totalReplies === 1 ? 'reply' : 'replies'}</span>
                  <ChevronDownIcon rotated={showReplies} />
                </button>
              )}
            </div>
          )}
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

          {showReplies && comment.replies.map(reply => (
            <React.Fragment key={reply.id}>
              <ReplyItem
                reply={reply}
                canInteract={canInteract}
                onReply={() => handleReplyToReply(reply)}
                onToggleReaction={(emoji) => onToggleReaction(emoji, reply.id)}
                onEdit={(content) => onEditReply(reply.id, content)}
                onDelete={() => onDeleteReply(reply.id)}
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
