import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import CommentsSection from '../components/CommentsSection';

/**
 * Wstrzykuje sekcję komentarzy React jako ostatnie dziecko elementu docelowego.
 * React jest montowany wewnątrz Shadow DOM — pełna izolacja CSS i JS od Crunchyroll.
 *
 * @param targetElement - Element DOM (.erc-current-media-info), wewnątrz którego montujemy
 * @param mediaId       - ID odcinka wyciągnięte z URL, przekazywane do komponentu
 */
export function injectComments(targetElement: Element, mediaId: string): void {
  // Kontener montowany wewnątrz .erc-current-media-info
  const hostContainer = document.createElement('div');
  hostContainer.id = 'crunchyroll-comments-root';

  // Shadow root zapewnia pełną izolację: style i JS rozszerzenia
  // nie wpływają na stronę Crunchyroll i odwrotnie
  const shadowRoot = hostContainer.attachShadow({ mode: 'open' });

  // Punkt montowania React wewnątrz shadow root
  const mountPoint = document.createElement('div');
  mountPoint.id = 'mount';
  shadowRoot.appendChild(mountPoint);

  // Dołączamy na końcu elementu docelowego (po opisie, akcjach itp.)
  targetElement.appendChild(hostContainer);

  // Montujemy React wewnątrz Shadow DOM
  const root = createRoot(mountPoint);
  root.render(createElement(CommentsSection, { videoId: mediaId }));
}
