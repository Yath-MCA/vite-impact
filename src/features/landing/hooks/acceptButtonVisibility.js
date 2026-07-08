export const ACCEPT_BUTTON_TTL_MS = 5 * 60 * 1000;

/**
 * Compute whether accept button should show from timer + visibility flags.
 */
export function computeAcceptButtonVisible({
  landingActive = false,
  timerExpired = false,
  tabHidden = false
} = {}) {
  if (!landingActive) return false;
  if (tabHidden) return false;
  if (timerExpired) return false;
  return true;
}
