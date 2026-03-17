import React, { useState } from 'react';

const MAX_CHARS = 500;

interface CommentFormProps {
  onSubmit: (content: string) => void;
}

export function CommentForm({ onSubmit }: CommentFormProps): React.ReactElement {
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent('');
  };

  return (
    <div className="comment-form">
      <div className="comment-avatar">U</div>
      <div className="comment-form-content">
        <textarea
          className="comment-form-input"
          placeholder="Leave a comment"
          value={content}
          onChange={e => setContent(e.target.value.slice(0, MAX_CHARS))}
          rows={3}
        />
        <div className="comment-form-actions">
          <span className="comment-form-counter">{MAX_CHARS - content.length}</span>
          <button
            className="comment-form-submit"
            onClick={handleSubmit}
            disabled={!content.trim()}
          >
            Comment
          </button>
        </div>
      </div>
    </div>
  );
}
