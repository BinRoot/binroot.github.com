// Minimal syntax highlighting for the speedrun blocks — one tiny rule set per
// guest language. Rules are tried in priority order and the first rule to
// claim a character wins, so e.g. arrows inside a Befunge string stay
// string-colored. Colors reuse the page's palette: orange for the tokens that
// carry the *spatial* control flow, pandoc's pygments-ish hues for the rest.
(() => {
  const PALETTE = {
    flow: 'color:#c65a11;font-weight:600',  // spatial control flow / operators
    num: 'color:#40a070',
    str: 'color:#4070a0',
    kw: 'color:#007020;font-weight:600',
    halt: 'color:#880000;font-weight:600',
    op: 'color:#687078',
    wire: 'color:#8a90a0',
    dim: 'color:#b6bcc6',
  };

  const LANGS = {
    befunge: [
      ['str', /"[^"]*"/g],
      ['flow', /[<>^v_|]/g],
      ['halt', /@/g],
      ['num', /\d/g],
      ['op', /[:,\\.]/g],
    ],
    orca: [
      ['flow', /[A-Z]/g],
      ['num', /\d/g],
      ['dim', /\./g],
    ],
    racket2d: [
      ['kw', /#lang|#2dcond/g],
      ['halt', /#[ft]/g],
      ['kw', /\b(require|define|and)\b/g],
      ['dim', /[═║╔╗╠╣╬╚╩╝]/g],
      ['op', /[()]/g],
    ],
    hexagony: [
      ['halt', /@/g],
      ['flow', /[<>\\\/]/g],
      ['num', /\d/g],
      ['op', /[;*]/g],
      ['dim', /\./g],
      ['str', /[A-Za-z]/g],
    ],
    ladder: [
      ['flow', /\[ \]|\[\\\]|\( \)/g],
      ['wire', /[-+|]/g],
    ],
  };

  const highlight = (code, rules) => {
    const text = code.textContent;
    const claim = new Array(text.length).fill(null);
    rules.forEach(([name, re]) => {
      for (const m of text.matchAll(re)) {
        let free = true;
        for (let j = 0; j < m[0].length; j++) if (claim[m.index + j]) free = false;
        if (!free) continue;
        for (let j = 0; j < m[0].length; j++) claim[m.index + j] = name;
      }
    });

    code.textContent = '';
    let i = 0;
    while (i < text.length) {
      let j = i;
      while (j < text.length && claim[j] === claim[i]) j++;
      const chunk = text.slice(i, j);
      if (claim[i]) {
        const span = document.createElement('span');
        span.style.cssText = PALETTE[claim[i]];
        span.textContent = chunk;
        code.appendChild(span);
      } else {
        code.appendChild(document.createTextNode(chunk));
      }
      i = j;
    }
  };

  Object.entries(LANGS).forEach(([lang, rules]) => {
    document.querySelectorAll(`pre.${lang} code`).forEach((c) => highlight(c, rules));
  });
})();
