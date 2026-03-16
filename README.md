# VideoComments — Chrome Extension

Chrome Extension wstrzykujący sekcję komentarzy pod filmami na YouTube.
Komentarze są izolowane w Shadow DOM i przechowywane lokalnie w stanie React (docelowo `chrome.storage.local`).

## Stack technologiczny

- **Vite 5** — bundler i dev server z hot reload
- **React 18 + TypeScript** — komponenty UI
- **Shadow DOM** — pełna izolacja CSS i JS od strony hosta
- **@crxjs/vite-plugin** — integracja Vite z Chrome Extension (hot reload)
- **Manifest V3** — nowoczesny format rozszerzenia Chrome

## Struktura projektu

```
video-comments-extension/
├── manifest.json                 # Manifest rozszerzenia (V3)
├── vite.config.ts                # Konfiguracja Vite + crxjs
├── tsconfig.json
├── package.json
├── src/
│   ├── content/
│   │   ├── index.ts              # Entry point — MutationObserver + tryInject
│   │   └── injector.ts           # Montowanie React w Shadow DOM
│   ├── components/
│   │   ├── CommentsSection.tsx   # Główny komponent (style inline → Shadow DOM)
│   │   ├── CommentItem.tsx       # Pojedynczy komentarz
│   │   └── CommentForm.tsx       # Formularz dodawania
│   ├── hooks/
│   │   └── useVideoId.ts         # Parsowanie videoId z URL
│   ├── background/
│   │   └── service-worker.ts     # Service worker (Manifest V3)
│   ├── popup/
│   │   ├── index.html
│   │   └── Popup.tsx             # Popup rozszerzenia
│   └── styles/
│       └── extension.css         # Dokumentacja palety kolorów (nie importować bezpośrednio)
└── public/
    └── icons/                    # Ikony placeholder (podmień na docelowe)
```

## Uruchomienie

### Wymagania
- Node.js 18+
- npm 9+
- Google Chrome / Chromium

### Instalacja i budowanie

```bash
# Instalacja zależności
npm install

# Tryb developerski — Vite obserwuje zmiany i przebudowuje do dist/
npm run dev

# Produkcyjny build
npm run build
```

### Ładowanie rozszerzenia w Chrome

1. Uruchom `npm run dev`
2. Otwórz Chrome i przejdź na `chrome://extensions/`
3. Włącz **Tryb dewelopera** (prawy górny róg)
4. Kliknij **Załaduj rozpakowany**
5. Wskaż folder `dist/`
6. Przejdź na `https://www.youtube.com/watch?v=...` — sekcja komentarzy pojawi się pod metadanymi filmu

> Każda zmiana kodu → Vite przebuduje → odśwież stronę YouTube (`F5`)

## Architektura Shadow DOM

Kluczowa decyzja projektowa: React montowany jest **wewnątrz Shadow DOM**, nie bezpośrednio w DOM strony.

```
Strona YouTube (host)
└── <div id="video-comments-extension-root">  ← kontener w DOM hosta
    └── #shadow-root (open)                   ← Shadow DOM (izolacja)
        └── <div id="mount">                  ← punkt montowania React
            └── <CommentsSection />           ← drzewo React
```

**Dlaczego inline `<style>` zamiast importów CSS?**
Vite domyślnie wstrzykuje pliki CSS do `<head>` strony hosta — style wychodzą poza Shadow DOM i mogą kolidować z YouTube. Dlatego style zdefiniowane są jako template literals bezpośrednio w `CommentsSection.tsx` i renderowane przez `<style>` tag wewnątrz shadow root.

## Następne kroki

- [ ] Persystencja komentarzy przez `chrome.storage.local`
- [ ] Synchronizacja z zewnętrznym API (wymaga dodania `host_permissions`)
- [ ] Docelowe ikony rozszerzenia (podmień pliki w `public/icons/`)
- [ ] Wsparcie dla innych platform wideo (Vimeo, Twitch)
- [ ] Sortowanie i filtrowanie komentarzy
