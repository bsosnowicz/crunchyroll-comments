import React, { useState } from 'react';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import type { Comment } from './CommentItem';

interface CommentsSectionProps {
  videoId: string;
}

/**
 * Style wstrzykiwane bezpośrednio do Shadow DOM.
 * NIE importujemy zewnętrznych plików CSS — Vite wstrzykuje je do <head> strony,
 * co łamie izolację Shadow DOM.
 */
const styles = `
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .comments-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    font-size: 14px;
    color: #0f0f0f;
    max-width: 800px;
    padding: 24px 16px;
    background: #fff;
    border-radius: 8px;
    margin-top: 16px;
  }

  .comments-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f2f2f2;
  }

  .comments-title {
    font-size: 18px;
    font-weight: 700;
    color: #0f0f0f;
  }

  .comments-badge {
    font-size: 12px;
    font-weight: 600;
    background: #ff0000;
    color: #fff;
    padding: 2px 8px;
    border-radius: 12px;
  }

  .comments-list {
    list-style: none;
    margin-bottom: 24px;
  }

  .comments-empty {
    text-align: center;
    color: #606060;
    padding: 32px 0;
    font-size: 15px;
  }

  /* --- CommentItem --- */

  .comment-item {
    display: flex;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid #f2f2f2;
  }

  .comment-item:last-child {
    border-bottom: none;
  }

  .comment-avatar {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #065fd4;
    color: #fff;
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .comment-body {
    flex: 1;
    min-width: 0;
  }

  .comment-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }

  .comment-author {
    font-weight: 600;
    font-size: 13px;
    color: #0f0f0f;
  }

  .comment-date {
    font-size: 11px;
    color: #606060;
  }

  .comment-content {
    font-size: 14px;
    line-height: 1.5;
    color: #0f0f0f;
    word-break: break-word;
    white-space: pre-wrap;
  }

  /* --- CommentForm --- */

  .comment-form {
    background: #f9f9f9;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 16px;
  }

  .form-title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 14px;
    color: #0f0f0f;
  }

  .form-field {
    margin-bottom: 12px;
    position: relative;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #606060;
    margin-bottom: 5px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .form-input,
  .form-textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d0d0d0;
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    color: #0f0f0f;
    background: #fff;
    transition: border-color 0.15s;
    resize: vertical;
  }

  .form-input:focus,
  .form-textarea:focus {
    outline: none;
    border-color: #065fd4;
    box-shadow: 0 0 0 2px rgba(6, 95, 212, 0.15);
  }

  .form-input--error {
    border-color: #cc0000;
  }

  .form-error {
    display: block;
    font-size: 11px;
    color: #cc0000;
    margin-top: 3px;
  }

  .form-counter {
    display: block;
    font-size: 11px;
    color: #909090;
    text-align: right;
    margin-top: 3px;
  }

  .form-submit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 20px;
    background: #065fd4;
    color: #fff;
    border: none;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }

  .form-submit:hover {
    background: #0356c0;
  }

  .form-submit:active {
    background: #024dab;
  }
`;

/**
 * Główny komponent sekcji komentarzy.
 * Montowany wewnątrz Shadow DOM — style są wstrzykiwane inline.
 */
export function CommentsSection({ videoId }: CommentsSectionProps): React.ReactElement {
  const [comments, setComments] = useState<Comment[]>([]);

  const handleAddComment = (data: Omit<Comment, 'id' | 'createdAt'>) => {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      author: data.author,
      content: data.content,
      createdAt: new Date(),
    };
    // Nowe komentarze na górze listy
    setComments((prev) => [newComment, ...prev]);
  };

  return (
    <>
      {/* Style wstrzykiwane do Shadow DOM, nie do <head> strony */}
      <style>{styles}</style>

      <div className="comments-wrapper">
        <div className="comments-header">
          <h2 className="comments-title">Komentarze VideoComments</h2>
          {comments.length > 0 && (
            <span className="comments-badge">{comments.length}</span>
          )}
        </div>

        {comments.length === 0 ? (
          <p className="comments-empty">
            Brak komentarzy. Bądź pierwszy!
          </p>
        ) : (
          <ul className="comments-list">
            {comments.map((comment) => (
              <li key={comment.id}>
                <CommentItem comment={comment} />
              </li>
            ))}
          </ul>
        )}

        <CommentForm onSubmit={handleAddComment} />
      </div>
    </>
  );
}

export default CommentsSection;
