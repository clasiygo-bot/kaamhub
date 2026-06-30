// Cashfree JS SDK helper. The SDK script is included in public/index.html.
// Exposes window.Cashfree (a factory). We initialize once per mode.

let _cf = null;
let _mode = null;

export function loadCashfree(mode = "sandbox") {
  if (typeof window === "undefined") return null;
  if (!window.Cashfree) {
    console.warn("Cashfree SDK not loaded — make sure the script in index.html is reachable.");
    return null;
  }
  if (_cf && _mode === mode) return _cf;
  try {
    _cf = window.Cashfree({ mode });
    _mode = mode;
    return _cf;
  } catch (e) {
    console.error("Failed to initialize Cashfree SDK", e);
    return null;
  }
}

export async function openCashfreeCheckout({ paymentSessionId, mode = "sandbox", redirectTarget = "_self" }) {
  const cf = loadCashfree(mode);
  if (!cf) throw new Error("Cashfree SDK unavailable. Refresh the page and try again.");
  return cf.checkout({ paymentSessionId, redirectTarget });
}
