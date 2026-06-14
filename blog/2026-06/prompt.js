// Add a one-click copy button to every `:::prompt` callout so a reader can
// drop the demo prompt straight into their own coding agent.
(() => {
  const ICON_COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const ICON_DONE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  document.querySelectorAll('div.prompt').forEach((el) => {
    const text = el.textContent.trim();

    // Open any links in the prompt in a new tab.
    el.querySelectorAll('a').forEach((a) => {
      a.target = '_blank';
      a.rel = 'noopener';
    });
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prompt-copy';
    btn.setAttribute('aria-label', 'Copy prompt');
    btn.title = 'Copy';
    btn.innerHTML = ICON_COPY;

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        // Fallback for non-secure contexts / older browsers.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (__) {}
        ta.remove();
      }
      btn.innerHTML = ICON_DONE;
      btn.classList.add('kb-copied');
      btn.title = 'Copied';
      clearTimeout(btn._t);
      btn._t = setTimeout(() => {
        btn.innerHTML = ICON_COPY;
        btn.classList.remove('kb-copied');
        btn.title = 'Copy';
      }, 1600);
    });

    el.appendChild(btn);
  });
})();
