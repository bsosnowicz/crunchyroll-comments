/**
 * Background Service Worker — Manifest V3
 *
 * Service worker jest uruchamiany przez przeglądarkę w tle.
 * W Manifest V3 zastępuje dawny background page/script.
 *
 * Aktualne zadania:
 * - Nasłuchiwanie instalacji rozszerzenia
 * - Obsługa wiadomości z content scriptów (przygotowane na przyszłość)
 *
 * Docelowo tutaj trafi logika:
 * - Synchronizacja komentarzy z zewnętrznym API
 * - Cache'owanie danych
 * - Autoryzacja użytkownika
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[VideoComments] Rozszerzenie zainstalowane pomyślnie.');
  } else if (details.reason === 'update') {
    console.log(`[VideoComments] Rozszerzenie zaktualizowane do wersji ${chrome.runtime.getManifest().version}.`);
  }
});

/**
 * Obsługa wiadomości od content scriptów i popupa.
 * Używamy chrome.runtime.sendMessage() do komunikacji.
 */
chrome.runtime.onMessage.addListener(
  (message: unknown, sender, sendResponse) => {
    // Typowanie przychodzących wiadomości
    if (!isMessage(message)) return;

    switch (message.type) {
      case 'GET_STATUS':
        sendResponse({ active: true, version: chrome.runtime.getManifest().version });
        break;

      case 'OPEN_POPUP':
        chrome.action.openPopup();
        break;

      default:
        console.warn('[VideoComments] Nieznany typ wiadomości:', message.type);
    }

    // Zwróć true, jeśli sendResponse będzie wywołane asynchronicznie
    return false;
  }
);

// --- Pomocnicze typy i funkcje ---

interface Message {
  type: string;
  payload?: unknown;
}

function isMessage(value: unknown): value is Message {
  return typeof value === 'object' && value !== null && 'type' in value;
}
