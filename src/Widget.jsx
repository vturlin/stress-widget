/**
 * Stress-marketing widget — three urgency / social-proof toast variants
 * dispatched by config.variant:
 *
 *   'just-booked'   → LiveBookingToast    (green pulse + booking line)
 *   'scarcity'      → ScarcityToast       (red accent + "Only X left")
 *   'social-proof'  → SocialProofToast    (purple aggregate + bar chart)
 *
 * All three share the bottom-left fixed position, the slide-in reveal,
 * the tiny dismiss button, and the same Open Sans type. Each owns its
 * own layout, accent, and content shape.
 *
 * Self-contained: every style is inline (CSS-in-JS), the only DOM
 * dependency is a single <style> tag injected on mount to host the
 * keyframes. The stylesheet attaches to the closest root, so a
 * shadow-DOM mount scopes its keyframes correctly.
 */

import { useEffect, useRef, useMemo, useState } from 'react';

// Position-aware fixed offsets. center-* uses translateY(-50%) on
// the toast; the entry animation is opacity-only (`stress-fade-in`)
// so there is no transform conflict at the centred positions.
function positionStyle(position) {
  switch (position) {
    case 'top-left':
      return { top: 24, left: 24 };
    case 'top-right':
      return { top: 24, right: 24 };
    case 'center-left':
      return { top: '50%', left: 24, transform: 'translateY(-50%)' };
    case 'center-right':
      return { top: '50%', right: 24, transform: 'translateY(-50%)' };
    case 'bottom-right':
      return { bottom: 24, right: 24 };
    case 'bottom-left':
    default:
      return { bottom: 24, left: 24 };
  }
}

// Visibility gate. 'immediate' (or undefined) renders straight
// away; 'time' waits triggerDelaySec seconds; 'scroll' waits for
// the user to scroll past triggerScrollPercent of the page;
// 'time_or_scroll' fires on whichever trigger lands first.
function useTriggeredVisibility(triggerMode, triggerDelaySec, triggerScrollPercent) {
  const isImmediate = !triggerMode || triggerMode === 'immediate';
  const [visible, setVisible] = useState(isImmediate);

  useEffect(() => {
    if (isImmediate || visible) return;
    const fire = () => setVisible(true);
    let timer;
    let scrollHandler;

    if (triggerMode === 'time' || triggerMode === 'time_or_scroll') {
      const ms = Math.max(0, triggerDelaySec || 5) * 1000;
      timer = setTimeout(fire, ms);
    }
    if (triggerMode === 'scroll' || triggerMode === 'time_or_scroll') {
      const threshold = (triggerScrollPercent || 50) / 100;
      scrollHandler = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (max <= 0) return;
        if (window.scrollY / max >= threshold) fire();
      };
      window.addEventListener('scroll', scrollHandler, { passive: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (scrollHandler) window.removeEventListener('scroll', scrollHandler);
    };
  }, [isImmediate, triggerMode, triggerDelaySec, triggerScrollPercent, visible]);

  return visible;
}

// ── Shared keyframes ───────────────────────────────────────────────
const STYLE_ID = 'stress-widget-keyframes';
const STYLE_TEXT = `
@keyframes stress-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes stress-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
@keyframes stress-ripple {
  0%   { transform: scale(1); opacity: 0.55; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes stress-bar-rise {
  from { transform: scaleY(0.2); }
  to   { transform: scaleY(1); }
}

/* Mobile (<= 480px): pin to bottom and stretch horizontally with a
   small inset so the toast doesn't overflow narrow viewports.
   Resets corner anchoring + the centring transform to a single
   bottom-aligned full-width sheet feel. */
@media (max-width: 480px) {
  .stress-toast {
    left: 12px !important;
    right: 12px !important;
    top: auto !important;
    bottom: 12px !important;
    transform: none !important;
    width: auto !important;
  }
}
`;

function ensureKeyframes(rootNode) {
  const target =
    rootNode && rootNode.nodeType === 11 /* DOCUMENT_FRAGMENT */
      ? rootNode
      : document.head;
  if (target.getElementById && target.getElementById(STYLE_ID)) return;
  if (target.querySelector && target.querySelector('#' + STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE_TEXT;
  target.appendChild(style);
}

function useKeyframesInjected(ref) {
  useEffect(() => {
    if (!ref.current) return;
    const root = ref.current.getRootNode
      ? ref.current.getRootNode()
      : document;
    ensureKeyframes(root);
  }, [ref]);
}

// ── Reusable bits ──────────────────────────────────────────────────

function DismissButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dismiss"
      style={{
        position: 'absolute',
        top: 6,
        right: 8,
        width: 18,
        height: 18,
        padding: 0,
        background: 'transparent',
        border: 0,
        color: '#bbb',
        cursor: 'pointer',
        fontSize: 14,
        lineHeight: 1,
        fontFamily: 'inherit',
      }}
    >
      ×
    </button>
  );
}

// Common toast chrome — position offsets are layered on top by each
// variant via positionStyle(props.position). The entry animation is
// opacity-only so it composes cleanly with the centring translateY
// the wrapper applies for center-* positions.
const BASE_TOAST_STYLE = {
  position: 'fixed',
  zIndex: 1000,
  width: 320,
  maxWidth: 'calc(100vw - 48px)',
  background: '#FFFFFF',
  fontFamily:
    '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  animation: 'stress-fade-in 420ms cubic-bezier(.2,.7,.3,1) both',
};

// ── Dispatcher ─────────────────────────────────────────────────────

export default function StressWidget(props) {
  const visible = useTriggeredVisibility(
    props.triggerMode,
    props.triggerDelaySec,
    props.triggerScrollPercent
  );
  if (!visible) return null;

  const v =
    props.variant === 'scarcity' || props.variant === 'social-proof'
      ? props.variant
      : 'just-booked';
  if (v === 'scarcity') return <ScarcityToast {...props} />;
  if (v === 'social-proof') return <SocialProofToast {...props} />;
  return <LiveBookingToast {...props} />;
}

// ───────────────────────────────────────────────────────────────────
// Variant 1 — LiveBookingToast (Just Booked)
// ───────────────────────────────────────────────────────────────────

function LiveBookingToast({
  title = 'Just booked',
  accentColor = '#10B981',
  guestName = 'Marie from Lyon',
  roomName = 'Sea-View Suite',
  initials = 'MD',
  avatarBg = '#FBCFE8',
  avatarFg = '#A41752',
  timeAgo = '2 minutes ago',
  position = 'bottom-left',
  onDismiss,
}) {
  const ref = useRef(null);
  useKeyframesInjected(ref);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="stress-toast"
      style={{
        ...BASE_TOAST_STYLE,
        ...positionStyle(position),
        border: '1px solid #E7E5E4',
        borderRadius: 8,
        padding: '12px 14px',
        boxShadow:
          '0 12px 32px rgba(20,12,36,0.16), 0 1px 2px rgba(20,12,36,0.06)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      {onDismiss && <DismissButton onClick={onDismiss} />}

      {/* Avatar with status dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: avatarBg,
            color: avatarFg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {initials}
        </div>
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: accentColor,
            border: '2px solid #FFFFFF',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingRight: 14 }}>
        {/* Eyebrow: pulsing dot + LIVE label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            aria-hidden="true"
            style={{ position: 'relative', display: 'inline-block', width: 8, height: 8 }}
          >
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: accentColor,
                borderRadius: '50%',
                animation: 'stress-pulse 1.4s ease-in-out infinite',
              }}
            />
            <span
              style={{
                position: 'absolute',
                inset: 0,
                background: accentColor,
                borderRadius: '50%',
                opacity: 0.55,
                animation: 'stress-ripple 1.4s ease-out infinite',
              }}
            />
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: accentColor,
            }}
          >
            {title}
          </span>
        </div>

        <p
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            lineHeight: 1.35,
            color: '#424242',
          }}
        >
          <strong>{guestName}</strong> reserved a {roomName}
        </p>

        <p
          style={{
            margin: '2px 0 0',
            fontSize: 11,
            color: '#999',
          }}
        >
          {timeAgo}
        </p>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Variant 2 — ScarcityToast
// ───────────────────────────────────────────────────────────────────

function ScarcityToast({
  title = 'Almost gone',
  accentColor = '#EF4444',
  count = 2,
  unit = 'rooms',
  context = 'for your selected dates',
  position = 'bottom-left',
  onDismiss,
}) {
  const ref = useRef(null);
  useKeyframesInjected(ref);

  // 30%-alpha tinted shadow + 15%-alpha icon background, both derived
  // from the accent so a different brand stays cohesive.
  const accent30 = colorWithAlpha(accentColor, 0.30);
  const accent15 = colorWithAlpha(accentColor, 0.15);

  return (
    <div
      ref={ref}
      role="alert"
      className="stress-toast"
      style={{
        ...BASE_TOAST_STYLE,
        ...positionStyle(position),
        borderRadius: 6,
        borderLeft: `3px solid ${accentColor}`,
        padding: '14px 16px',
        boxShadow: `0 12px 32px ${accent30}, 0 1px 2px rgba(20,12,36,0.06)`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {onDismiss && <DismissButton onClick={onDismiss} />}

      {/* Icon tile */}
      <div
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          background: accent15,
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <BedIcon />
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingRight: 14 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: accentColor,
          }}
        >
          {title}
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#424242',
            lineHeight: 1.3,
            marginTop: 2,
          }}
        >
          Only{' '}
          <span style={{ fontSize: 16, color: accentColor, fontWeight: 700 }}>
            {count} {unit}
          </span>{' '}
          left
        </div>

        <div
          style={{
            fontSize: 11,
            color: '#666',
            marginTop: 2,
            lineHeight: 1.35,
          }}
        >
          {context}
        </div>
      </div>
    </div>
  );
}

function BedIcon() {
  // Simple bed/hotel pictogram — no library dep
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M2 6 L2 16 M18 16 L18 9 C18 7.5 17 7 15 7 L8 7 L8 11 L2 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="5.5" cy="9" r="1.4" fill="currentColor" />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────
// Variant 3 — SocialProofToast
// ───────────────────────────────────────────────────────────────────

function SocialProofToast({
  title = '12 travelers',
  subtitle = 'booked here today',
  caption = 'Trending up vs. last week',
  accentColor = '#432975',
  bars = [3, 6, 4, 8, 5, 9, 7, 11, 8, 12],
  position = 'bottom-left',
  onDismiss,
}) {
  const ref = useRef(null);
  useKeyframesInjected(ref);

  const safeBars = useMemo(() => {
    const arr = (bars || []).filter((n) => Number.isFinite(n) && n >= 0);
    return arr.length ? arr : [1];
  }, [bars]);
  const max = Math.max(...safeBars, 1);

  const accent20 = colorWithAlpha(accentColor, 0.20);
  const accent50 = colorWithAlpha(accentColor, 0.50);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className="stress-toast"
      style={{
        ...BASE_TOAST_STYLE,
        ...positionStyle(position),
        border: '1px solid #E7E5E4',
        borderRadius: 8,
        padding: '14px 16px',
        boxShadow: '0 12px 32px rgba(20,12,36,0.14)',
      }}
    >
      {onDismiss && <DismissButton onClick={onDismiss} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Icon tile */}
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: accent20,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SparkIcon />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingRight: 14 }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, color: '#424242' }}>
            <strong style={{ color: accentColor, fontSize: 15 }}>{title}</strong>{' '}
            {subtitle}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999' }}>
            {caption}
          </p>
        </div>
      </div>

      {/* Bar chart row */}
      <div
        aria-hidden="true"
        style={{
          marginTop: 10,
          paddingLeft: 48,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          height: 26,
        }}
      >
        {safeBars.map((value, i) => {
          const isToday = i === safeBars.length - 1;
          return (
            <span
              key={i}
              style={{
                flex: 1,
                height: `${Math.max(8, (value / max) * 100)}%`,
                background: isToday ? accentColor : accent50,
                borderRadius: 2,
                transformOrigin: 'bottom',
                animation: `stress-bar-rise 600ms cubic-bezier(.2,.7,.3,1) ${
                  i * 50
                }ms both`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M9 1 L10.4 6.6 L16 8 L10.4 9.4 L9 15 L7.6 9.4 L2 8 L7.6 6.6 Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────

// Produce an rgba() string from a hex colour. Used so the accent
// drives both the box-shadow tint and the icon-tile background
// without forcing the operator to also configure those derived hues.
function colorWithAlpha(hex, alpha) {
  const m = String(hex || '').replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
