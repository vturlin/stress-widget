/**
 * Remote config loader for the stress-marketing widget.
 *
 * Resolves the widget config from (in priority order):
 *   1. ?preview=<base64> on the host page URL  (admin live preview)
 *   2. ?id=xxx in the <script src>             (remote CDN fetch)
 *   3. window.STRESS_WIDGET_CONFIG             (inline override)
 *   4. {} — render with the component's defaults
 */

const CONFIGS_BASE_URL = resolveConfigsBase();

function resolveConfigsBase() {
  const scripts = document.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].src || '';
    if (src.includes('widget.js')) {
      return src.replace(/widget\.js(?:\?.*)?$/, '') + 'configs/';
    }
  }
  return './configs/';
}

function findSelfScript() {
  if (document.currentScript && document.currentScript.src) {
    return document.currentScript.src;
  }
  const scripts = document.getElementsByTagName('script');
  for (let i = scripts.length - 1; i >= 0; i--) {
    const src = scripts[i].src || '';
    if (src.includes('widget.js')) return src;
  }
  return null;
}

function extractIdFromScript() {
  const src = findSelfScript();
  if (!src) return null;
  try {
    const url = new URL(src);
    const id = url.searchParams.get('id');
    return id && id.trim() ? id.trim() : null;
  } catch {
    return null;
  }
}

const VARIANTS = ['just-booked', 'scarcity', 'social-proof'];

/**
 * Normalize the raw config into the shape StressWidget expects. Most
 * fields are optional — undefined values let the component fall back
 * to its built-in defaults.
 */
export function normalizeConfig(raw) {
  if (!raw || typeof raw !== 'object') return {};

  const pick = (k) =>
    typeof raw[k] === 'string' && raw[k].trim() ? raw[k] : undefined;

  let count;
  if (Number.isFinite(raw.count)) {
    count = Math.max(0, Math.round(raw.count));
  }

  let bars;
  if (Array.isArray(raw.bars)) {
    bars = raw.bars
      .filter((n) => Number.isFinite(n))
      .map((n) => Math.max(0, Math.round(n)))
      .slice(0, 24); // cap at 24 bars
  }

  return {
    _hotelId: raw._hotelId || null,
    variant: VARIANTS.includes(raw.variant) ? raw.variant : 'just-booked',

    // Shared fields
    title: pick('title'),
    accentColor: pick('accentColor'),

    // LiveBookingToast
    guestName: pick('guestName'),
    roomName: pick('roomName'),
    initials: pick('initials'),
    avatarBg: pick('avatarBg'),
    avatarFg: pick('avatarFg'),
    timeAgo: pick('timeAgo'),

    // ScarcityToast
    count,
    unit: pick('unit'),
    context: pick('context'),

    // SocialProofToast
    subtitle: pick('subtitle'),
    caption: pick('caption'),
    bars,

    _preview: raw._preview === true,
  };
}

export function extractPreviewConfig() {
  try {
    const params = new URLSearchParams(window.location.search);
    const b64 = params.get('preview');
    if (!b64) return null;
    const std = b64.replace(/-/g, '+').replace(/_/g, '/');
    const pad = std.length % 4 === 0 ? '' : '='.repeat(4 - (std.length % 4));
    const binary = atob(std + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (err) {
    console.warn('[stress-widget] extractPreviewConfig failed', err);
    return null;
  }
}

export async function loadConfig() {
  const previewConfig = extractPreviewConfig();
  if (previewConfig) {
    previewConfig._hotelId = previewConfig._hotelId || 'preview';
    return normalizeConfig(previewConfig);
  }

  const id = extractIdFromScript();
  if (id) {
    const url = `${CONFIGS_BASE_URL}${encodeURIComponent(id)}.json`;
    try {
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status} fetching config ${id}`);
      const raw = await res.json();
      raw._hotelId = id;
      return normalizeConfig(raw);
    } catch (err) {
      if (window.STRESS_WIDGET_CONFIG) {
        console.warn(
          `[stress-widget] Remote config '${id}' failed, falling back to inline.`,
          err
        );
        return normalizeConfig(window.STRESS_WIDGET_CONFIG);
      }
      throw err;
    }
  }

  if (window.STRESS_WIDGET_CONFIG) {
    return normalizeConfig(window.STRESS_WIDGET_CONFIG);
  }

  return {};
}
