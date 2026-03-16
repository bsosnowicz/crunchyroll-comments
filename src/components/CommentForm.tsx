import React, { useState } from 'react';
import type { Comment } from './CommentItem';

interface CommentFormProps {
  onSubmit: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
}

/**
 * Formularz dodawania nowego komentarza.
 * Pola: imię autora + treść komentarza.
 */
export function CommentForm({ onSubmit }: CommentFormProps): React.ReactElement {
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState<{ author?: string; content?: string }>({});

  const validate = (): boolean => {
    const newErrors: { author?: string; content?: string } = {};

    if (!author.trim()) newErrors.author = 'Imię jest wymagane';
    if (!content.trim()) newErrors.content = 'Treść komentarza jest wymagana';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit({ author: author.trim(), content: content.trim() });

    // Wyczyść formularz po dodaniu
    setAuthor('');
    setContent('');
    setErrors({});
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <h3 className="form-title">Dodaj komentarz</h3>

      <div className="form-field">
        <label htmlFor="vc-author" className="form-label">
          Twoje imię
        </label>
        <input
          id="vc-author"
          type="text"
          className={`form-input ${errors.author ? 'form-input--error' : ''}`}
          placeholder="np. Jan Kowalski"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          maxLength={100}
        />
        {errors.author && <span className="form-error">{errors.author}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="vc-content" className="form-label">
          Komentarz
        </label>
        <textarea
          id="vc-content"
          className={`form-textarea ${errors.content ? 'form-input--error' : ''}`}
          placeholder="Napisz swój komentarz..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          maxLength={2000}
        />
        {errors.content && <span className="form-error">{errors.content}</span>}
        <span className="form-counter">{content.length}/2000</span>
      </div>

      <button type="submit" className="form-submit">
        Dodaj komentarz
      </button>
    </form>
  );
}
