import { useState, useEffect } from 'react';

/**
 * Parsuje mediaId z URL Crunchyroll.
 * Obsługuje format:
 *   - crunchyroll.com/watch/XXXXXXXX/tytul-odcinka
 *
 * Przykład: /watch/G4PH0WXVJ/the-suffering → "G4PH0WXVJ"
 */
export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Tylko strony odcinków: /watch/XXXXXXXX/...
    const match = parsed.pathname.match(/^\/watch\/([A-Z0-9]+)/i);
    if (match) return match[1];

    return null;
  } catch {
    return null;
  }
}

export function extractStableEpisodeId(): string | null {
  const episodeSlug = window.location.pathname.match(/^\/watch\/[A-Z0-9]+\/(.+)/i)?.[1];
  if (!episodeSlug) return null;

  const seriesLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="/series/"]');
  for (const link of seriesLinks) {
    const match = link.pathname.match(/^\/series\/([A-Z0-9]+)/i);
    if (match) {
      return `${match[1]}-${episodeSlug}`;
    }
  }

  return episodeSlug;
}

/**
 * Hook zwracający aktualne videoId na podstawie URL strony.
 * Nasłuchuje zmian nawigacji (SPA YouTube zmienia URL bez pełnego przeładowania).
 */
export function useVideoId(): string | null {
  const [videoId, setVideoId] = useState<string | null>(() =>
    extractVideoId(window.location.href)
  );

  useEffect(() => {
    // Crunchyroll jest SPA — URL zmienia się przez History API
    const handleNavigation = () => {
      setVideoId(extractVideoId(window.location.href));
    };

    // Nasłuchuj zdarzeń nawigacji
    window.addEventListener('popstate', handleNavigation);

    // Monkey-patch pushState i replaceState, bo nie emitują zdarzeń DOM
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      originalPushState(...args);
      handleNavigation();
    };

    history.replaceState = (...args) => {
      originalReplaceState(...args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);

  return videoId;
}
