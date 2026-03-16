# CLAUDE.md — VideoComments Chrome Extension

Ten plik definiuje zasady i konwencje projektu dla Claude Code.
Przeczytaj go w całości przed wprowadzeniem jakichkolwiek zmian.

---

## Opis projektu

**VideoComments** to Chrome Extension (Manifest V3), które injektuje sekcję komentarzy
bezpośrednio pod filmami na stronach internetowych (docelowo Crunchyroll i inne platformy video).

Komentarze są injektowane przez Content Script i izolowane od strony hosta za pomocą **Shadow DOM**.

---

## Stack technologiczny

| Technologia | Rola |
|---|---|
| **Vite** | Bundler |
| **React 18** | Komponenty UI |
| **TypeScript** | Język (strict mode) |
| **Shadow DOM** | Izolacja CSS/JS od strony hosta |
| **crxjs/vite-plugin** | HMR dla Chrome Extension podczas developmentu |
| **Manifest V3** | Standard Chrome Extension |

---

## Struktura projektu

```
video-comments-extension/
├── manifest.json              # Manifest V3 — konfiguracja rozszerzenia
├── vite.config.ts
├── tsconfig.json
├── package.json
├── CLAUDE.md                  # Ten plik
├── src/
│   ├── content/
│   │   ├── index.ts           # Entry point content script
│   │   └── injector.ts        # Mountuje React w Shadow DOM
│   ├── components/            # Komponenty React
│   ├── hooks/                 # Custom hooki React
│   ├── background/
│   │   └── service-worker.ts  # Background worker (MV3)
│   ├── popup/                 # UI popup rozszerzenia
│   └── styles/                # Globalne style (tylko dla shadow root)
└── public/
    └── icons/
```

---

## Zasady architektoniczne — KRYTYCZNE

### 1. Shadow DOM jest obowiązkowy

**Każdy** komponent injektowany na stronę MUSI być zamontowany wewnątrz Shadow DOM.
Nigdy nie montuj React bezpośrednio do `document.body` ani do elementów strony hosta bez Shadow DOM.

```ts
// ✅ POPRAWNIE
const shadowRoot = hostContainer.attachShadow({ mode: 'open' });
const mountPoint = document.createElement('div');
shadowRoot.appendChild(mountPoint);
createRoot(mountPoint).render(<CommentsSection />);

// ❌ NIGDY TAK
document.body.appendChild(container);
createRoot(container).render(<CommentsSection />);
```

### 2. Style TYLKO przez inline `<style>` wewnątrz Shadow DOM

Nie używaj globalnych plików CSS importowanych przez Vite — są injektowane do `<head>` strony i łamią izolację.

```tsx
// ✅ POPRAWNIE — style wstrzyknięte do shadow root przez JSX
const css = `.wrapper { font-family: sans-serif; }`;
return (
  <>
    <style>{css}</style>
    <div className="wrapper">...</div>
  </>
);

// ❌ NIGDY TAK — globalny import CSS
import './styles/comments.css';
```

### 3. MutationObserver do injektowania na dynamicznych stronach

Crunchyroll i inne SPA aktualizują DOM bez przeładowania strony. Zawsze używaj MutationObserver
do czekania na docelowy element + oznaczaj elementy atrybutem, żeby nie injektować dwukrotnie.

```ts
const INJECTED_ATTR = 'data-vc-injected';

const observer = new MutationObserver(() => {
  const target = document.querySelector(TARGET_SELECTOR);
  if (target && !target.hasAttribute(INJECTED_ATTR)) {
    target.setAttribute(INJECTED_ATTR, 'true');
    injectComments(target, videoId);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
```

### 4. Manifest V3 — service worker zamiast background page

Używamy `background.service_worker`, nie `background.scripts`. Worker nie ma dostępu
do DOM. Długie operacje → `chrome.alarms` zamiast `setInterval`.

---

## Konwencje kodu

### TypeScript

- **Strict mode** — `"strict": true` w tsconfig, zero tolerancji dla `any`
- Typy dla wszystkich propsów komponentów, parametrów funkcji i zwracanych wartości
- Używaj `interface` dla kształtów obiektów, `type` dla unionów i aliasów

```ts
// ✅ Przykład poprawnego typowania
interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  videoId: string;
}

interface CommentItemProps {
  comment: Comment;
  onDelete?: (id: string) => void;
}
```

### Nazewnictwo

| Co | Konwencja | Przykład |
|---|---|---|
| Komponenty React | PascalCase | `CommentItem.tsx` |
| Hooki | camelCase z `use` | `useVideoId.ts` |
| Funkcje pomocnicze | camelCase | `extractVideoId()` |
| Stałe globalne | UPPER_SNAKE_CASE | `INJECTED_ATTR` |
| Pliki typów | camelCase | `types.ts` |

### Komentarze w kodzie

Komentarze piszemy **po polsku**. Dokumentuj "dlaczego", nie "co":

```ts
// ✅ Dobrze — tłumaczy zamiar
// crunchyroll zmienia URL bez przeładowania strony (SPA), więc nasłuchujemy na popstate
window.addEventListener('popstate', handleNavigation);

// ❌ Źle — opisuje oczywistość
// Dodajemy event listener
window.addEventListener('popstate', handleNavigation);
```

---

## Chrome Extension — ważne ograniczenia

### Content Script

- Ma dostęp do DOM strony, ale działa w **izolowanym kontekście JS** (nie może używać zmiennych strony)
- Komunikacja z background workerem przez `chrome.runtime.sendMessage`
- Nie ma dostępu do `chrome.storage` bez deklaracji w `permissions`

### Komunikacja między częściami rozszerzenia

```
Content Script  <--chrome.runtime.sendMessage-->  Background Worker
Content Script  <--chrome.storage.local-->         Popup
```

### Selektory CSS dla crunchyroll

crunchyroll często zmienia nazwy klas. Preferuj atrybuty i role zamiast klas:

```ts
// ✅ Bardziej odporne na zmiany crunchyroll
document.querySelector('[id="description"]')
document.querySelector('ytd-watch-metadata')

// ❌ Klasy crunchyroll zmieniają się często
document.querySelector('.ytd-video-secondary-info-renderer')
```

---

## Przepływ pracy z Git

```
main          — stabilna wersja
feature/*     — nowe funkcje
fix/*         — poprawki bugów
```

Commit messages po **polsku**, format: `typ: krótki opis`

```
feat: dodaj formularz komentarzy
fix: popraw injektowanie na crunchyroll Shorts
refactor: wydziel logikę parsowania videoId do hooka
chore: zaktualizuj zależności
```

---

## Uruchamianie projektu

```bash
# Instalacja zależności
npm install

# Development (Vite watch + HMR)
npm run dev

# Build produkcyjny
npm run build
```

### Ładowanie extension w Chrome

1. `npm run dev` → buduje do `dist/`
2. Chrome → `chrome://extensions/` → Tryb dewelopera → Załaduj rozpakowany → `dist/`
3. Każda zmiana pliku → Vite przebuduje automatycznie → odśwież testowaną stronę

---

## Checklist przed każdą zmianą

Przed wprowadzeniem zmian Claude Code powinien sprawdzić:

- [ ] Czy nowy komponent jest montowany wewnątrz Shadow DOM?
- [ ] Czy style są wstrzykiwane inline, nie przez globalny import CSS?
- [ ] Czy MutationObserver używa atrybutu zabezpieczającego przed podwójnym injektowaniem?
- [ ] Czy kod jest w pełni otypowany (zero `any`)?
- [ ] Czy manifest.json ma odpowiednie `host_permissions` dla nowej domeny?
- [ ] Czy komunikacja między content script a background używa `chrome.runtime.sendMessage`?

---

## Znane problemy i obejścia

### CSS leaking mimo Shadow DOM

Jeśli style strony "wyciekają" do Shadow DOM, sprawdź czy `attachShadow({ mode: 'open' })`
zostało wywołane **przed** dodaniem `mountPoint` do shadow root.

### Podwójne injektowanie po nawigacji SPA

crunchyroll używa pushState do nawigacji. Nasłuchuj na:

```ts
window.addEventListener('yt-navigate-finish', handleNavigation); // crunchyroll custom event
```

### Hot reload nie działa po zmianie manifest.json

Po zmianie `manifest.json` trzeba ręcznie kliknąć "Odśwież" przy rozszerzeniu
na stronie `chrome://extensions/` — crxjs nie może tego zrobić automatycznie.
