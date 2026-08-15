function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  const jsSafe = String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return escapeHtml(jsSafe);
}

(function initUxGuard() {
  if (typeof SECURITY_UX_GUARD === 'undefined' || !SECURITY_UX_GUARD) return;

  document.addEventListener('contextmenu', e => e.preventDefault());

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    const blocked =
      k === 'f12' ||
      (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
      (e.ctrlKey && k === 'u');
    if (blocked) e.preventDefault();
  });
})();
