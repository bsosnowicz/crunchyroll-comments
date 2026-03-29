import React, { useState, useRef, useEffect } from 'react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { AuthPanel } from './AuthPanel';
import { CommentsIcon, SortIcon } from './icons';
import type { Comment as UIComment } from './CommentItem';
import { useComments } from '../hooks/useComments';
import type { CommentWithData } from '../hooks/useComments';
import { useAuth } from '../hooks/useAuth';
import type { User } from '@supabase/supabase-js';

function computeIsOwner(
  itemUserId: string | null,
  itemSessionId: string | null,
  user: User | null,
  sessionId: string
): boolean {
  if (user) return itemUserId === user.id;
  return itemSessionId !== null && itemSessionId === sessionId;
}

function toUIComment(row: CommentWithData, user: User | null, sessionId: string): UIComment {
  return {
    id: row.id,
    author: row.author_name,
    content: row.content,
    createdAt: new Date(row.created_at),
    reactions: row.reactions,
    isEdited: row.is_edited ?? false,
    isOwner: computeIsOwner(row.user_id, row.session_id ?? null, user, sessionId),
    replies: row.replies.map(r => ({
      id: r.id,
      author: r.author_name,
      content: r.content,
      createdAt: new Date(r.created_at),
      reactions: r.reactions,
      isEdited: r.is_edited ?? false,
      isOwner: computeIsOwner(r.user_id, r.session_id ?? null, user, sessionId),
    })),
  };
}

interface CommentsSectionProps {
  videoId: string;
}

/**
 * Style wstrzykiwane bezpośrednio do Shadow DOM.
 * NIE importujemy zewnętrznych plików CSS — Vite wstrzykuje je do <head> strony,
 * co łamie izolację Shadow DOM.
 */
const styles = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .comments-wrapper {
    font-family: 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    color: #ffffff;
    width: 716px;
    background: #000000;
    padding: 24px 0;
  }

  /* ── Header ── */

  .comments-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    margin-bottom: 24px;
  }

  .comments-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .comments-title {
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.362;
  }

  .comments-sort-wrapper {
    position: relative;
  }

  .comments-sortby {
    display: flex;
    align-items: center;
    gap: 8px;
    background: none;
    border: none;
    cursor: pointer;
    color: #ffffff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.714;
  }

  .comments-sort-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: #1a1a1a;
    border: 1px solid #333333;
    border-radius: 8px;
    z-index: 100;
    min-width: 160px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .comments-sort-item {
    display: block;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    text-align: left;
    line-height: 1.4;
  }

  .comments-sort-item:hover {
    background: #262626;
  }

  .comments-sort-item.active {
    color: #F9E507;
  }

  /* ── Comment Form ── */

  .comment-form {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 0 20px;
    margin-bottom: 24px;
  }

  .comment-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #555555;
    color: #ffffff;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .comment-form-content {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex: 1;
  }

  .comment-form-input {
    width: 100%;
    min-height: 64px;
    background: #1A1A1A;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 400;
    color: #ffffff;
    line-height: 1.429;
    resize: none;
  }

  .comment-form-input::placeholder {
    color: #989898;
  }

  .comment-form-input:focus {
    outline: none;
  }

  .comment-form-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .comment-form-counter {
    font-size: 14px;
    font-weight: 500;
    color: #C0C0C0;
    line-height: 1.714;
  }

  .comment-form-submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 12px;
    height: 32px;
    background: #F9E507;
    border: none;
    border-radius: 32px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    cursor: pointer;
  }

  .comment-form-submit:hover {
    background: #e6d400;
  }

  .comment-form-submit:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* ── Comments list ── */

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: 0 20px;
    list-style: none;
  }

  .comments-empty {
    text-align: center;
    color: #C0C0C0;
    padding: 32px 20px;
    font-size: 14px;
  }

  /* ── Comment Item ── */

  .comment-item {
    display: flex;
    gap: 16px;
  }

  .comment-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .comment-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .comment-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .comment-author {
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.714;
  }

  .comment-date {
    font-size: 14px;
    font-weight: 500;
    color: #C0C0C0;
    line-height: 1.714;
  }

  .comment-menu-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    border-radius: 200px;
    display: flex;
    align-items: center;
    color: #ffffff;
    flex-shrink: 0;
  }

  .comment-content {
    font-size: 14px;
    font-weight: 400;
    line-height: 1.429;
    color: #ffffff;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .comment-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .comment-actions-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ── Reaction pills ── */

  .comment-reaction {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border: 1px solid #262626;
    border-radius: 200px;
    cursor: pointer;
    background: none;
    color: inherit;
  }

  .comment-reaction.active {
    border-color: #C0C0C0;
  }

  .comment-reaction-emoji {
    font-size: 16px;
    line-height: 1;
    font-weight: 600;
  }

  .comment-reaction-count {
    font-size: 12px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.333;
  }

  /* ── Emoji picker ── */

  .comment-emoji-wrapper {
    position: relative;
  }

  .comment-emoji-btn {
    display: flex;
    align-items: center;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 200px;
    line-height: 0;
  }

  .comment-emoji-picker {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 0;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 12px;
    height: 40px;
    background: #262626;
    border: 1px solid #444444;
    border-radius: 200px;
    z-index: 100;
    white-space: nowrap;
  }

  .comment-emoji-picker button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    font-weight: 600;
    color: #ffffff;
    padding: 0;
    font-family: inherit;
    line-height: 1.2;
    transition: transform 0.1s;
  }

  .comment-emoji-picker button:hover {
    transform: scale(1.3);
  }

  /* ── Reply button ── */

  .comment-reply-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 0 12px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  .comment-replies-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    padding: 0 8px;
  }

  /* ── Replies section (thread) ── */

  .comment-wrapper {
    display: flex;
    flex-direction: column;
  }

  .comment-replies-section {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-left: 48px;
    margin-top: 16px;
  }

  .comment-replies-section::before {
    content: '';
    position: absolute;
    left: 15px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #2a2a2a;
    border-radius: 2px;
  }

  .reply-item {
    display: flex;
    gap: 16px;
  }

  /* ── Reply form ── */

  .reply-form-row {
    display: flex;
    gap: 16px;
  }

  .reply-form-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .reply-form-input {
    caret-color: #F9E507;
  }

  .reply-cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    height: 32px;
    background: #313131;
    border: none;
    border-radius: 32px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
  }

  .reply-submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    height: 32px;
    background: #F9E507;
    border: none;
    border-radius: 32px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    cursor: pointer;
  }

  .reply-submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  /* ── Logged-out banner ── */

  .logged-out-banner-wrapper {
    padding: 0 20px;
    margin-bottom: 24px;
  }

  .logged-out-banner {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #181818;
    border: 1px solid #262626;
    border-radius: 16px;
  }

  .logged-out-banner-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .logged-out-banner-title {
    font-size: 16px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.362;
  }

  .logged-out-banner-subtitle {
    font-size: 14px;
    font-weight: 400;
    color: #C0C0C0;
    line-height: 1.429;
  }

  .logged-out-signup-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 12px;
    height: 40px;
    background: #F9E507;
    border: none;
    border-radius: 32px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    cursor: pointer;
  }

  .logged-out-signup-btn:hover {
    background: #e6d400;
  }

  /* ── Auth panel ── */

  .auth-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0 20px 24px;
  }

  .auth-tabs {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid #262626;
  }

  .auth-tab {
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    padding: 8px 16px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #989898;
    cursor: pointer;
  }

  .auth-tab.active {
    color: #ffffff;
    border-bottom-color: #F9E507;
  }

  .auth-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .auth-input {
    width: 100%;
    background: #1A1A1A;
    border: none;
    border-radius: 8px;
    padding: 10px 12px;
    font-family: inherit;
    font-size: 14px;
    color: #ffffff;
    outline: none;
  }

  .auth-input::placeholder {
    color: #989898;
  }

  .auth-input:focus {
    outline: 1px solid #444444;
  }

  .auth-error {
    font-size: 13px;
    color: #ff5555;
    margin: 0;
  }

  .auth-info {
    font-size: 13px;
    color: #4caf50;
    margin: 0;
  }

  .auth-submit-btn {
    align-self: flex-end;
    padding: 0 20px;
    height: 36px;
    background: #F9E507;
    border: none;
    border-radius: 32px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #000000;
    cursor: pointer;
  }

  .auth-submit-btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .auth-user-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px 16px;
  }

  .auth-user-name {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: #ffffff;
  }

  .auth-signout-btn {
    background: none;
    border: 1px solid #444444;
    border-radius: 32px;
    padding: 0 12px;
    height: 28px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: #989898;
    cursor: pointer;
  }

  .auth-signout-btn:hover {
    color: #ffffff;
    border-color: #666666;
  }

  /* ── Comment dropdown menu ── */

  .comment-menu-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .comment-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    background: #1a1a1a;
    border: 1px solid #333333;
    border-radius: 8px;
    z-index: 100;
    min-width: 140px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .comment-dropdown-item {
    display: block;
    width: 100%;
    padding: 10px 16px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #ffffff;
    text-align: left;
    line-height: 1.4;
  }

  .comment-dropdown-item:hover {
    background: #262626;
  }

  .comment-dropdown-item--danger {
    color: #ff5555;
  }

  /* ── Edited label & edit form ── */

  .comment-edited-label {
    font-size: 12px;
    color: #989898;
    font-style: italic;
  }

  .edit-form-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    width: 100%;
  }
`;

type SortOrder = 'newest' | 'popular';

const SORT_LABELS: Record<SortOrder, string> = {
  newest: 'Newest',
  popular: 'Most popular',
};

function totalReactions(comment: CommentWithData): number {
  return comment.reactions.reduce((s, r) => s + r.count, 0);
}

export function CommentsSection({ videoId }: CommentsSectionProps): React.ReactElement {
  const { user, displayName, signIn, signUp } = useAuth();
  const { comments, loading, error, sessionId, addComment, deleteComment, editComment, addReply, editReply, deleteReply, toggleReaction } = useComments(videoId, user?.id ?? null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !e.composedPath().includes(sortRef.current)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  const sortedComments = [...comments].sort((a, b) => {
    if (sortOrder === 'popular') {
      const reactionsDiff = totalReactions(b) - totalReactions(a);
      if (reactionsDiff !== 0) return reactionsDiff;
      return b.replies.length - a.replies.length;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handleAddComment = async (content: string) => {
    if (!user) return;
    await addComment(displayName, content, user.id);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="comments-wrapper">
        <div className="comments-header">
          <div className="comments-header-left">
            <CommentsIcon />
            <h2 className="comments-title">Comments</h2>
          </div>
          <div ref={sortRef} className="comments-sort-wrapper">
            <button className="comments-sortby" onClick={() => setSortOpen(v => !v)}>
              <SortIcon />
              <span>{SORT_LABELS[sortOrder]}</span>
            </button>
            {sortOpen && (
              <div className="comments-sort-dropdown">
                {(['newest', 'popular'] as SortOrder[]).map(option => (
                  <button
                    key={option}
                    className={`comments-sort-item${sortOrder === option ? ' active' : ''}`}
                    onClick={() => { setSortOrder(option); setSortOpen(false); }}
                  >
                    {SORT_LABELS[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {user ? (
          <CommentForm onSubmit={handleAddComment} />
        ) : showAuthPanel ? (
          <AuthPanel onSignIn={signIn} onSignUp={signUp} defaultTab="register" />
        ) : (
          <div className="logged-out-banner-wrapper">
            <div className="logged-out-banner">
              <div className="logged-out-banner-text">
                <span className="logged-out-banner-title">Join the community</span>
                <span className="logged-out-banner-subtitle">Do you want to comment or leave reaction?</span>
              </div>
              <button className="logged-out-signup-btn" onClick={() => setShowAuthPanel(true)}>
                Sign up
              </button>
            </div>
          </div>
        )}

        {loading && <p className="comments-empty">Ładowanie komentarzy...</p>}
        {error && <p className="comments-empty">{error}</p>}

        {!loading && !error && sortedComments.length === 0 && (
          <p className="comments-empty">No comments yet. Be the first!</p>
        )}
        {!loading && !error && sortedComments.length > 0 && (
          <ul className="comments-list">
            {sortedComments.map(comment => (
              <li key={comment.id}>
                <CommentItem
                  comment={toUIComment(comment, user, sessionId)}
                  canInteract={!!user}
                  onAddReply={async (content) => { if (user) await addReply(comment.id, displayName, content, user.id); }}
                  onToggleReaction={async (emoji, replyId) => { if (user) await toggleReaction(emoji, comment.id, replyId); }}
                  onEdit={(content) => editComment(comment.id, content)}
                  onDelete={() => deleteComment(comment.id)}
                  onEditReply={(replyId, content) => editReply(replyId, content)}
                  onDeleteReply={(replyId) => deleteReply(replyId)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default CommentsSection;
