import { speech } from '../services/speechService';

/**
 * Utility to announce messages to screen readers and via speech synthesis.
 */
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  // 1. Speech Synthesis
  speech.speak(message, priority);

  // 2. ARIA Live Region
  let liveRegion = document.getElementById('a11y-live-region');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'a11y-live-region';
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  } else {
    liveRegion.setAttribute('aria-live', priority);
  }

  // Clear and set to trigger announcement
  liveRegion.textContent = '';
  setTimeout(() => {
    if (liveRegion) liveRegion.textContent = message;
  }, 50);
};
