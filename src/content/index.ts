import { injectComments } from './injector';
import { extractVideoId, extractStableEpisodeId } from '../hooks/useVideoId';

/**
 * Selektory kontenera, WEWNĄTRZ którego wstrzykujemy sekcję komentarzy.
 * Crunchyroll renderuje DOM asynchronicznie — sprawdzamy kilka możliwości.
 * Docelowy element: .erc-current-media-info (kontener z tytułem i opisem odcinka)
 */
const TARGET_SELECTORS = [
  '.erc-current-media-info',     // Główny kontener info o odcinku
  '.current-media-wrapper',      // Wrapper nadrzędny (fallback)
];

/**
 * Próbuje wstrzyknąć komentarze jeśli:
 * 1. Jesteśmy na stronie odcinka (URL zawiera /watch/XXXXXXXX/)
 * 2. Element docelowy istnieje w DOM
 * 3. Komentarze nie zostały jeszcze wstrzyknięte do tego elementu
 */
function tryInject(): void {
  const videoId = extractVideoId(window.location.href);

  // Nie jesteśmy na stronie odcinka — usuń ewentualne poprzednie wstrzyknięcie
  if (!videoId) {
    removeInjected();
    return;
  }

  // Jeśli kontener już istnieje w DOM — nie wstrzykuj ponownie
  if (document.getElementById('crunchyroll-comments-root')) return;

  // Szukamy pierwszego dostępnego selektora
  for (const selector of TARGET_SELECTORS) {
    const target = document.querySelector(selector);

    if (target) {
      const stableId = extractStableEpisodeId() ?? videoId;
      injectComments(target, stableId);
      break;
    }
  }
}

/**
 * Usuwa wstrzyknięty kontener (np. przy nawigacji do strony bez filmu).
 */
function removeInjected(): void {
  const existing = document.getElementById('crunchyroll-comments-root');
  if (existing) {
    existing.remove();
  }

}

/**
 * MutationObserver czeka na dynamicznie renderowane elementy DOM.
 * Crunchyroll jest SPA — elementy pojawiają się asynchronicznie po nawigacji.
 */
const observer = new MutationObserver(() => {
  tryInject();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Próbuj od razu przy załadowaniu skryptu (np. przy twardym przeładowaniu strony)
tryInject();
