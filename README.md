# Stress-Marketing Widget

An embeddable React toast that hotels paste into their direct-booking
site to add urgency / social-proof signals. Three variants share one
bundle — the `variant` config field picks which is rendered.

| Variant       | Class                | Visual               | Purpose                                  |
| ------------- | -------------------- | -------------------- | ---------------------------------------- |
| `just-booked` | `LiveBookingToast`   | Green pulse + name   | "Mark in Paris just booked the Suite"   |
| `scarcity`    | `ScarcityToast`      | Red accent + counter | "Only 3 rooms left at this price"       |
| `social-proof`| `SocialProofToast`   | Purple bar chart     | "31 people viewed in the last hour"     |

<p align="center"><em>One script tag. Three urgency patterns. No backend.</em></p>

---

## How it works

1. The hotel deploys a config JSON (e.g. `hm_demo001.json`) picking the
   variant and its content. Configs are managed via the admin SPA
   (`hotel-widget-admin`).
2. The widget loads `widget.js?id=<hotelId>` on the host page, fetches
   the matching config from `configs/<id>.json`, and waits for its
   trigger (immediate / time / scroll / time_or_scroll).
3. The relevant toast variant is rendered in the configured corner
   with a slide-in / fade-in reveal.
4. Visitor clicks ×. Toast disappears.

The widget is fully static — no backend, no analytics POST.

---

## Quick start (hotelier)

```html
<div id="stress-widget"></div>
<script async src="https://your-cdn/widget.js?id=YOUR_HOTEL_ID"></script>
```

If no `#stress-widget` (or `[data-stress-widget]`) element exists, the
widget auto-creates one.

For an inline config (testing): set
`window.STRESS_WIDGET_CONFIG = { … }` before loading `widget.js`.

---

## Configuration reference

Configs are JSON, served from `configs/<hotelId>.json` next to `widget.js`.

### Shared (every variant)

| Key                     | Type                          | Description                                                                  |
| ----------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| `variant`               | `'just-booked'` (default) \| `'scarcity'` \| `'social-proof'` | Which toast is rendered. |
| `title`                 | string                        | Top-line label inside the toast.                                             |
| `accentColor`           | hex string                    | Variant accent (defaults: green / red / purple).                             |
| `position`              | `'bottom-left'` (default) \| `'bottom-right'` \| `'top-left'` \| `'top-right'` \| `'center-left'` \| `'center-right'` | Where the toast pins. |
| `triggerMode`           | `'immediate'` \| `'time'` \| `'scroll'` \| `'time_or_scroll'` | When the toast appears. |
| `triggerDelaySec`       | seconds (0–120)               | Delay for time-based triggers.                                               |
| `triggerScrollPercent`  | 5–95                          | Scroll-depth threshold for scroll triggers.                                  |

### `just-booked` extras

| Key          | Type    | Description                                                             |
| ------------ | ------- | ----------------------------------------------------------------------- |
| `guestName`  | string  | First name + city (`"Mark from Paris"`).                                |
| `roomName`   | string  | Room booked (`"Junior Suite"`).                                         |
| `initials`   | string  | 1–2 letters for the avatar bubble.                                      |
| `avatarBg`   | hex     | Avatar bubble background.                                               |
| `avatarFg`   | hex     | Avatar bubble text color.                                               |
| `timeAgo`    | string  | Human-formatted relative time (`"2 minutes ago"`).                      |

### `scarcity` extras

| Key       | Type    | Description                                                |
| --------- | ------- | ---------------------------------------------------------- |
| `count`   | integer | Items remaining.                                           |
| `unit`    | string  | Singular/plural label (`"room"`, `"rooms"`).               |
| `context` | string  | Suffix (`"left at this price"`).                           |

### `social-proof` extras

| Key        | Type      | Description                                                              |
| ---------- | --------- | ------------------------------------------------------------------------ |
| `subtitle` | string    | Primary metric line.                                                     |
| `caption`  | string    | Smaller line below.                                                      |
| `bars`     | `number[]`| Up to 24 hourly buckets for the mini bar chart. Each value clamped ≥ 0. |

See `public/configs/hm_demo001.json` for a concrete example.

---

## Style isolation

The widget mounts into **Shadow DOM** — host-page CSS can't reach in,
the widget can't leak out. Styles are inline (CSS-in-JS). A single
`<style>` tag is injected on mount to host the keyframes and the
mobile media query.

`prefers-reduced-motion` is honoured — animations are disabled for
users with vestibular sensitivity.

---

## Preview mode

Admin previews live edits via `transparent.html?preview=<base64>`. The
widget decodes the payload and bypasses the remote fetch. The
pathname gate (`/transparent.html`) prevents phishing-style preview
injection on the operator's actual site.

---

## Development

```bash
npm install
npm run dev       # Vite dev server at :5173, opens demo.html
npm run build     # Produces dist/widget.js + dist/configs/ + dist/demo.html
```

### Project structure

```
├── src/
│   ├── embed.jsx        # Entry: Shadow DOM mount, hands over to Widget
│   ├── Widget.jsx       # Variant dispatch + LiveBookingToast / ScarcityToast / SocialProofToast
│   └── loader.js        # Config resolution: ?preview= / ?id= / window.STRESS_WIDGET_CONFIG
├── public/
│   ├── demo.html
│   └── transparent.html
├── scripts/
│   └── postbuild.js
├── vite.config.js
└── package.json
```

### Build output

```
dist/
├── widget.js     # ~50 kB min (~18 kB gzip) — React + ReactDOM bundled
├── configs/
└── demo.html
```

---

## Editorial note

Stress-marketing patterns (urgency, scarcity, social proof) are
ethically charged. The widget itself is neutral — accuracy is on the
operator. The admin SPA blocks publish if `count` looks improbable
(e.g. very low for a property with hundreds of rooms), but the
integrator should review variant content before going live, and
consider cycling between variants rather than running a single
high-pressure tone permanently.

---

## License

MIT.
