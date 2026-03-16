import React from 'react';

export interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

interface CommentItemProps {
  comment: Comment;
}

/**
 * Wyświetla pojedynczy komentarz: avatar z inicjałem, autor, treść i datę.
 */
export function CommentItem({ comment }: CommentItemProps): React.ReactElement {
  const initials = comment.author.charAt(0).toUpperCase();

  const formattedDate = new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(comment.createdAt);

  return (
    <div className="comment-item">
      <div className="comment-avatar">{initials}</div>
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-author">{comment.author}</span>
          <span className="comment-date">{formattedDate}</span>
        </div>
        <p className="comment-content">{comment.content}</p>
      </div>
    </div>
  );
}
