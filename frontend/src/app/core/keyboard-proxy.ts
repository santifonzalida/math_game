/**
 * Mobile browsers (iOS especially) only open the on-screen keyboard when focus() runs
 * inside a user tap. The game screen appears after an HTTP request and a navigation, so
 * its input can't open the keyboard by itself. Workaround: focus an invisible input during
 * the tap, then move focus to the real input; the keyboard stays open across the switch.
 */
let proxy: HTMLInputElement | null = null;

/** Call synchronously from the tap/click handler, before any await. */
export function openKeyboardEarly(): void {
  releaseKeyboardProxy();
  proxy = document.createElement('input');
  proxy.type = 'text';
  proxy.inputMode = 'numeric';
  proxy.tabIndex = -1;
  proxy.setAttribute('aria-hidden', 'true');
  // Visible to the browser (so it is focusable) but not to the player. 16px avoids iOS zoom.
  Object.assign(proxy.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    fontSize: '16px',
    pointerEvents: 'none',
  });
  document.body.appendChild(proxy);
  proxy.focus();
}

/** Call once the real input has focus, or when the game couldn't start. */
export function releaseKeyboardProxy(): void {
  proxy?.remove();
  proxy = null;
}
