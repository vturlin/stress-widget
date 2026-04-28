import { createRoot } from 'react-dom/client';
import StressWidget from './Widget.jsx';
import { loadConfig } from './loader.js';

/**
 * Auto-mount on DOM ready. Finds #stress-widget (documented target) or
 * data-stress-widget (advanced users); auto-creates one otherwise so
 * the widget is embeddable via tag managers (GTM/Wix) where injecting
 * markup is not always possible.
 *
 * Style isolation: mounted into Shadow DOM so host-page CSS resets
 * cannot reach the toast. The component styles itself inline and
 * injects its own keyframes <style> on mount, so there is no sibling
 * stylesheet to fetch.
 */

function findMountNode() {
  let node =
    document.getElementById('stress-widget') ||
    document.querySelector('[data-stress-widget]');
  if (node) return node;
  node = document.createElement('div');
  node.id = 'stress-widget';
  document.body.appendChild(node);
  return node;
}

async function mount() {
  const host = findMountNode();
  if (!host) return;
  if (host.shadowRoot) return; // already mounted

  let config;
  try {
    config = await loadConfig();
  } catch (err) {
    console.error('[stress-widget]', err.message);
    return;
  }

  const shadow = host.attachShadow({ mode: 'open' });
  const container = document.createElement('div');
  container.className = 'stress-widget-root';
  shadow.appendChild(container);

  const root = createRoot(container);

  function handleDismiss() {
    root.unmount();
    host.remove();
  }

  root.render(
    <StressWidget
      variant={config.variant}
      title={config.title}
      accentColor={config.accentColor}
      // LiveBookingToast
      guestName={config.guestName}
      roomName={config.roomName}
      initials={config.initials}
      avatarBg={config.avatarBg}
      avatarFg={config.avatarFg}
      timeAgo={config.timeAgo}
      // ScarcityToast
      count={config.count}
      unit={config.unit}
      context={config.context}
      // SocialProofToast
      subtitle={config.subtitle}
      caption={config.caption}
      bars={config.bars}
      onDismiss={handleDismiss}
    />
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
