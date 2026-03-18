import React from 'react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { CommentsIcon, SortIcon } from './icons';
import type { Comment as UIComment } from './CommentItem';
import { useComments } from '../hooks/useComments';
import type { Comment } from '../lib/supabase';

function toUIComment(row: Comment): UIComment {
  return {
    id: row.id,
    author: row.author_name,
    content: row.content,
    createdAt: new Date(row.created_at),
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
`;

export function CommentsSection({ videoId }: CommentsSectionProps): React.ReactElement {
  const { comments, loading, error, addComment } = useComments(videoId);

  const handleAddComment = async (content: string) => {
    await addComment('You', content);
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
          <button className="comments-sortby">
            <SortIcon />
            <span>Sort by</span>
          </button>
        </div>

        <CommentForm onSubmit={handleAddComment} />

        {loading && <p className="comments-empty">Ładowanie komentarzy...</p>}
        {error && <p className="comments-empty">{error}</p>}

        {!loading && !error && comments.length === 0 && (
          <p className="comments-empty">No comments yet. Be the first!</p>
        )}
        {!loading && !error && comments.length > 0 && (
          <ul className="comments-list">
            {comments.map(comment => (
              <li key={comment.id}>
                <CommentItem comment={toUIComment(comment)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default CommentsSection;
