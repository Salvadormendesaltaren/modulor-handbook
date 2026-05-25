# Handbook — Design System

Documento de referencia del sistema de diseño del Handbook de Modulor Studios. Single-page app vanilla (HTML + CSS + JS) sin frameworks.

---

## Arquitectura

```
handbook/
├── public/
│   ├── index.html          ← Todo el CSS + HTML + JS en un solo archivo
│   ├── fonts/              ← Untitled Sans (300–900, normal + italic)
│   └── logos/              ← SVGs de las boutiques del grupo
├── api/
│   ├── content.js          ← Serverless: sirve los .md
│   ├── versions.js         ← Serverless: versiones del handbook
│   └── chat.js             ← Serverless: chat IA (Claude)
├── _content/               ← Markdown por versión y tier (full/lite/redux)
└── vercel.json             ← Rewrites, CSP headers, functions config
```

---

## Tokens de diseño

### Colores

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `white` | Fondo principal |
| `--bg-secondary` | `#F5F5F5` | Fondo sidebar, cards, inputs |
| `--bg-tertiary` | `#e9e9e9` | Fondo badges, avatares |
| `--bg-hover` | `rgba(0,0,0,0.06)` | Hover sobre elementos interactivos |
| `--bg-active` | `rgba(0,0,0,0.08)` | Estado activo (sidebar nav) |
| `--bg-dark` | `black` | Botones primarios, FABs |
| `--text` | `#000` | Texto principal, headings |
| `--text-secondary` | `rgba(0,0,0,0.4)` | Texto secundario, subtítulos |
| `--text-muted` | `rgba(0,0,0,0.25)` | Labels, placeholders |
| `--text-faint` | `rgba(0,0,0,0.16)` | Texto decorativo, versiones |
| `--text-body` | `rgba(0,0,0,0.55)` | Cuerpo de texto en secciones |
| `--text-on-dark` | `#fff` | Texto sobre fondo oscuro |
| `--accent` | `#133EEC` | Azul primario, progress bar, onboarding |
| `--accent-subtle` | `rgba(19,62,236,0.06)` | Fondo blockquotes |
| `--border` | `rgba(0,0,0,0.1)` | Bordes generales |
| `--border-subtle` | `rgba(0,0,0,0.16)` | Bordes inputs, checkboxes |

**Colores semánticos fijos:**
- Error: fondo `#FEF2F2`, texto `#991B1B`
- Warning/banner: fondo `#FEF3C7`, borde `#FCD34D`, texto `#92400E`
- Success (onboarding check): `#16a34a`

### Tipografía

**Familia:** Untitled Sans (fallback: system-ui, sans-serif)

| Elemento | Tamaño | Peso | Line-height | Letter-spacing |
|---|---|---|---|---|
| Body | 1rem (16px) | 400 | 1.5rem | -0.04375rem |
| h1 | 2.75rem | 400 | 2.875rem | -0.15rem |
| h2 | 2rem | 400 | 2.25rem | -0.1rem |
| h3 | 1.2rem | 400 | 1.5rem | -0.04rem |
| h4 | 1rem | 400 | 1.5rem | -0.04375rem |
| h1 + p (intro) | 1.125rem | 400 | 1.7 | — |
| Sidebar nav | 0.8125rem | 400 | 1.5 | — |
| Sidebar title | 1.1rem | 400 | 1.3 | — |
| Labels/caps | 0.625–0.6875rem | 400–500 | — | 0.1em |
| Code | 0.85em | — | — | — |

**Principio:** peso uniforme 400 para casi todo. Se usa 500 solo en labels uppercase y popup titles. El contraste jerárquico se logra con tamaño, color y spacing, no con peso.

**Código:** `SF Mono`, `Fira Code`, monospace.

### Espaciado y layout

| Token | Valor |
|---|---|
| `--sidebar-w` | 280px |
| `--content-max` | 800px |
| `--ease` | `cubic-bezier(0.165, 0.84, 0.44, 1)` |

**Padding de sección:** `2.25rem clamp(2rem, 6vw, 6rem) 8rem` — padding bottom generoso para respirar.

**Max-width del contenedor:** `calc(var(--content-max) + clamp(4rem, 12vw, 12rem))` — el contenido se centra a 800px, el contenedor total incluye los márgenes laterales.

### Radios

| Uso | Valor |
|---|---|
| Pills, FABs, avatares | 999px |
| Cards, modales, footer | 1.25rem |
| Inputs, sidebar nav, blockquotes | 0.625–0.75rem |
| Badges, logos | 0.5rem |
| Code inline | 0.25rem |

### Sombras

| Uso | Valor |
|---|---|
| FABs | `0 2px 12px rgba(0,0,0,0.15)` |
| Onboarding FAB | `0 2px 12px rgba(19,62,236,0.3)` |
| Popups, modales | `0 8px 30px rgba(0,0,0,0.12)` |
| Pill close chat | `0 2px 8px rgba(0,0,0,0.06)` |
| Dropdowns | `0 4px 12px rgba(0,0,0,0.08)` |

---

## Componentes

### Sidebar

- Fija a la izquierda, 280px, `--bg-secondary`
- Brand logo (2.5rem, border-radius 0.5rem) + nombre
- Nav items con label uppercase + título grande
- Item activo: `--bg-active`, muestra subtitle
- Footer: avatar + nombre + botón logout
- View switcher: dropdown con dot indicator (verde/gris)
- Version selector: select nativo estilizado
- **Mobile (≤991px):** se oculta con `translateX(-100%)`, hamburger button top-left, overlay blur

### Contenido principal

- `margin-left: var(--sidebar-w)`, centrado con max-width
- Chapter header: logo boutique (2.5rem) + h1
- Markdown renderizado con markdown-it
- Tablas envueltas en `.table-wrapper` para scroll horizontal
- h2 con `border-bottom` y `margin-top: 6rem` como separador de sección
- Blockquotes con fondo `--accent-subtle`, sin borde lateral
- `strong` = peso 400 + color `--text` (destaca por contraste de color, no peso)
- Links con underline sutil (`text-decoration-color: --text-faint`), hover a `--accent`
- `hr` = 3rem de ancho, decorativo

### Reading progress bar

- Fixed top, 2px, color `--accent`
- Se extiende de sidebar-w a 100%
- Transición linear 0.1s

### Botones

**Primario (dark):**
- Background negro, texto blanco, pill shape (999px)
- Hover: `opacity: 0.7`
- Padding: `0.875rem 2rem` (login), `0.75rem 1.75rem` (download)

**Secundario (outlined):**
- Background blanco, borde `--border-subtle`, pill
- Mismo hover opacity

**Admin:**
- Más pequeños (`0.5rem 1rem`), border-radius 0.5rem
- Variante danger: sin fondo, borde rojo, hover fondo rojo claro

### Chat

**FAB:** pill centrado bottom, negro, con icono + texto "Pregunta al Handbook"

**Panel:** fullscreen overlay (`position: fixed; inset: 0`), transición opacity.
- Close: pill button sticky centered top con sombra
- Welcome: centered, logo + título + descripción
- Mensajes usuario: alineados derecha, texto secundario, border-bottom
- Mensajes assistant: estilo documento (misma tipografía que secciones)
- Input area: textarea auto-resize + botón send circular
- Typing indicator: 3 dots animados con bounce

### Onboarding

**FAB:** pill bottom-right, color `--accent` (azul), icono + "Primeros pasos X/Y"

**Popup:** card 320px encima del FAB, animación slide-up.
- Título "Primeros pasos"
- Steps como checklist con checkbox circular
- Completado: check verde `#16a34a`, título tachado
- Steps con link: clickable con hover
- "Cerrar para siempre": link discreto al final

**Persistencia:** localStorage key `handbook-onboarding`

### Announcement modal

**Overlay:** fondo negro 50% + blur 6px, z-index 700.

**Card:** max-width 480px, border-radius 1.25rem.
- Barra superior de colores animada (shimmer gradient)
- Emoji grande centrado
- Título + badge de versión en `--accent`
- Features como lista icono + texto
- CTA button full-width, pill, negro

**Persistencia:** localStorage key `handbook-announce`, versionado

### Footer

- Card con fondo `--bg-secondary`, border-radius 1.25rem
- Grid de logos de boutiques (3.5rem, hover lift -2px)
- Brand label uppercase + subtítulo + versión

### Login

- Centrado vertical/horizontal, max-width 360px
- Logo + título + subtítulo + botón Google
- Error message: card roja con border-radius 0.75rem

---

## Animaciones

| Nombre | Uso | Definición |
|---|---|---|
| `fadeIn` | Entrada de secciones y headings | opacity 0→1, translateY 8px→0, 0.6–0.8s |
| `onb-in` | Popup onboarding | opacity 0→1, translateY 8px→0, 0.3s |
| `announce-fade-in` | Overlay modal | opacity 0→1, 0.4s |
| `announce-slide-up` | Card modal | translateY 20px→0, 0.5s |
| `announce-shimmer` | Barra colores modal | background-position shift, 2s linear infinite |
| `chatTyping` | Dots del typing indicator | translateY bounce, 1.4s infinite |

**Easing global:** `cubic-bezier(0.165, 0.84, 0.44, 1)` — ease-out suave tipo Quart.

**Transiciones estándar:** `0.3s var(--ease)` para hover, color, background, opacity.

---

## Breakpoints

| Breakpoint | Cambios |
|---|---|
| ≤991px (tablet) | Sidebar oculta, hamburger visible, main full-width, version banner full-width |
| ≤479px (mobile) | Section padding reducido, h1 más pequeño (2rem), FABs ajustados, popup onboarding full-width |

---

## Convenciones

- **Un solo archivo**: todo el CSS, HTML y JS vive en `index.html`. No hay build step.
- **Sin frameworks**: vanilla JS, markdown-it para render, JSZip para descargas, Supabase para auth.
- **Peso tipográfico uniforme**: 400 para casi todo. La jerarquía se crea con tamaño + color.
- **Scrollbar oculta**: `::-webkit-scrollbar { width: 0 }` global.
- **Anti-aliased**: webkit + moz font smoothing activado.
- **Content Security Policy**: inline styles/scripts permitidos, conexiones limitadas a Supabase y Anthropic.
- **Persistencia en localStorage**: onboarding (`handbook-onboarding`), announcement (`handbook-announce`).
- **Roles**: `team` (default) y `admin`. Admin ve panel de admin + paso extra en onboarding.
- **Versionado de contenido**: `_content/versions.json`, selector en sidebar, banner cuando no es versión actual.
- **Tiers de contenido**: `full`, `lite`, `redux` — controlados por `viewMode`.
