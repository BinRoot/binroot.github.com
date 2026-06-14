// Hydrate every `:::kanban` block (rendered by pandoc as <div class="kanban">)
// into an interactive, Trello-style board.
//
// Markdown source shape (nested lists). The roster of assignable people is
// declared once on the board via the fenced-div `team` attribute, which
// pandoc emits as `data-team`:
//
//   ::: {.kanban team="alice bob carol dana"}
//   - Todo
//     - Card title [label] {assignee}
//   - In Progress
//     - ...
//   - Done
//     - ...
//   :::
//
// A card line may carry any number of `[label]` tags and an optional
// `{assignee}`. The assignee renders as a colored avatar; tapping/clicking it
// (works the same on desktop and mobile) opens a picker listing the roster +
// "Unassigned". Selecting routes through the same assign() API an external
// driver -- the WebSocket LLM agent this post is about -- uses.
//
// Programmatic API, on `el.board` (and the first board on `window.kanban`):
//
//   board.getState()                       -> [{title, cards:[{id,text,labels,assignee}]}]
//   board.team                             -> ['alice','bob',...]
//   board.addCard(colName, text)           -> card id
//   board.moveCard(cardId, colName)
//   board.assign(cardId, person|null)
//   board.assignWhere(pred, person)        -> number of cards reassigned
//   board.removeCard(cardId)
//
// Every mutation dispatches a bubbling `kanban:change` CustomEvent on the
// board element, with `{detail: {state}}`, so the agent can sync back.
(() => {
  let _seq = 0;
  const nextId = () => `c${++_seq}`;

  function parseCard(raw) {
    const labels = [];
    let assignee = null;
    let text = raw
      .replace(/\[([^\]]+)\]/g, (_, l) => { labels.push(l.trim()); return ''; })
      .replace(/\{([^}]+)\}/g, (_, a) => { assignee = a.trim(); return ''; });
    text = text.replace(/\s+/g, ' ').trim();
    return { text, labels, assignee };
  }

  // Deterministic color per label, so "backend" is always the same hue.
  const LABEL_COLORS = [
    ['#dbeafe', '#1e40af'], ['#dcfce7', '#166534'], ['#fef3c7', '#92400e'],
    ['#fae8ff', '#86198f'], ['#ffe4e6', '#9f1239'], ['#e0e7ff', '#3730a3'],
    ['#ccfbf1', '#115e59'],
  ];
  // Distinct, more saturated palette for person avatars.
  const AVATAR_COLORS = [
    '#4a6da7', '#b4673b', '#3f8a6e', '#8a5bb0', '#b03b6a', '#5b78b0', '#6f8a3b',
  ];
  const hash = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const labelColor = (n) => LABEL_COLORS[hash(n) % LABEL_COLORS.length];
  const avatarColor = (n) => AVATAR_COLORS[hash(n) % AVATAR_COLORS.length];
  const initials = (name) =>
    name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join('');

  // ---- Shared picker popover (one per page, position:fixed so the scrolling
  //      board never clips it; clamped to the viewport for mobile). ----
  let picker = null;
  let pickerCleanup = null;

  function closePicker() {
    if (pickerCleanup) pickerCleanup();
    pickerCleanup = null;
    if (picker) picker.remove();
    picker = null;
  }

  function openPicker(anchor, team, current, onPick) {
    closePicker();
    picker = document.createElement('div');
    picker.className = 'kb-picker';

    const opt = (person) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'kb-picker-opt';
      if ((person || null) === (current || null)) b.classList.add('kb-picker-cur');
      if (person) {
        const av = document.createElement('span');
        av.className = 'kb-avatar';
        av.textContent = initials(person);
        av.style.background = avatarColor(person);
        const nm = document.createElement('span');
        nm.textContent = person;
        b.append(av, nm);
      } else {
        const av = document.createElement('span');
        av.className = 'kb-avatar kb-avatar-none';
        const nm = document.createElement('span');
        nm.textContent = 'Unassigned';
        b.append(av, nm);
      }
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        onPick(person);
        closePicker();
      });
      return b;
    };

    picker.appendChild(opt(null));
    team.forEach((p) => picker.appendChild(opt(p)));
    document.body.appendChild(picker);

    // Position below the anchor, right-aligned, clamped to the viewport.
    const r = anchor.getBoundingClientRect();
    const pw = picker.offsetWidth;
    const ph = picker.offsetHeight;
    const margin = 8;
    let left = Math.min(r.right - pw, window.innerWidth - pw - margin);
    left = Math.max(margin, left);
    let top = r.bottom + 6;
    if (top + ph > window.innerHeight - margin) top = Math.max(margin, r.top - ph - 6);
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;

    // Dismissal: outside tap/click, Escape, scroll, resize.
    const onDocPointer = (e) => { if (!picker.contains(e.target) && e.target !== anchor) closePicker(); };
    const onKey = (e) => { if (e.key === 'Escape') closePicker(); };
    // defer so the opening click doesn't immediately close it
    setTimeout(() => {
      document.addEventListener('pointerdown', onDocPointer, true);
      document.addEventListener('keydown', onKey, true);
      window.addEventListener('scroll', closePicker, true);
      window.addEventListener('resize', closePicker, true);
    }, 0);
    pickerCleanup = () => {
      document.removeEventListener('pointerdown', onDocPointer, true);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('scroll', closePicker, true);
      window.removeEventListener('resize', closePicker, true);
    };
  }

  function buildBoard(root) {
    const topList = root.querySelector(':scope > ul');
    if (!topList) return;

    // Roster: explicit `data-team`, else the union of assignees on the cards.
    let team = (root.dataset.team || '').split(/[\s,]+/).filter(Boolean);

    const columns = [];
    topList.querySelectorAll(':scope > li').forEach((colLi) => {
      const nested = colLi.querySelector(':scope > ul');
      let title = '';
      for (const node of colLi.childNodes) {
        if (node === nested) break;
        title += node.textContent;
      }
      title = title.trim();

      const cards = [];
      if (nested) {
        nested.querySelectorAll(':scope > li').forEach((cardLi) => {
          const txt = cardLi.textContent.trim();
          if (!txt) return;
          cards.push({ id: nextId(), ...parseCard(txt) });
        });
      }
      columns.push({ title, cards });
    });

    if (!team.length) {
      const seen = new Set();
      columns.forEach((c) => c.cards.forEach((card) => { if (card.assignee) seen.add(card.assignee); }));
      team = [...seen];
    }

    // --- render ---
    root.innerHTML = '';
    const colByName = new Map();

    function renderCard(card) {
      const el = document.createElement('div');
      el.className = 'kb-card';
      el.draggable = true;
      el.dataset.id = card.id;

      const title = document.createElement('div');
      title.className = 'kb-card-text';
      title.textContent = card.text;
      el.appendChild(title);

      // Meta row is always present so the (un)assign control is reachable.
      const meta = document.createElement('div');
      meta.className = 'kb-card-meta';
      card.labels.forEach((l) => {
        const [bg, fg] = labelColor(l);
        const chip = document.createElement('span');
        chip.className = 'kb-label';
        chip.textContent = l;
        chip.style.background = bg;
        chip.style.color = fg;
        meta.appendChild(chip);
      });

      // Editable assignee control.
      const assignBtn = document.createElement('button');
      assignBtn.type = 'button';
      assignBtn.className = 'kb-assign';
      assignBtn.draggable = false; // don't start a card drag from the button
      const paint = () => {
        assignBtn.innerHTML = '';
        if (card.assignee) {
          assignBtn.classList.remove('kb-assign-empty');
          assignBtn.title = `Assigned to ${card.assignee} -- tap to change`;
          assignBtn.setAttribute('aria-label', assignBtn.title);
          const av = document.createElement('span');
          av.className = 'kb-avatar';
          av.textContent = initials(card.assignee);
          av.style.background = avatarColor(card.assignee);
          assignBtn.appendChild(av);
        } else {
          assignBtn.classList.add('kb-assign-empty');
          assignBtn.title = 'Unassigned -- tap to assign';
          assignBtn.setAttribute('aria-label', assignBtn.title);
          assignBtn.textContent = '+ assign';
        }
      };
      paint();
      assignBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openPicker(assignBtn, team, card.assignee, (person) => api.assign(card.id, person));
      });
      // Pointer down on the control shouldn't begin a drag.
      assignBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
      meta.appendChild(assignBtn);

      el.appendChild(meta);

      el.addEventListener('dragstart', (e) => {
        el.classList.add('kb-dragging');
        e.dataTransfer.setData('text/plain', card.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragend', () => el.classList.remove('kb-dragging'));
      return el;
    }

    function renderColumn(col) {
      const colEl = document.createElement('div');
      colEl.className = 'kb-col';
      colEl.dataset.title = col.title;

      const head = document.createElement('div');
      head.className = 'kb-col-head';
      const h = document.createElement('span');
      h.className = 'kb-col-title';
      h.textContent = col.title;
      const count = document.createElement('span');
      count.className = 'kb-col-count';
      head.append(h, count);
      colEl.appendChild(head);

      const list = document.createElement('div');
      list.className = 'kb-list';
      colEl.appendChild(list);
      col.cards.forEach((c) => list.appendChild(renderCard(c)));

      colEl.addEventListener('dragover', (e) => { e.preventDefault(); colEl.classList.add('kb-col-over'); });
      colEl.addEventListener('dragleave', (e) => { if (!colEl.contains(e.relatedTarget)) colEl.classList.remove('kb-col-over'); });
      colEl.addEventListener('drop', (e) => {
        e.preventDefault();
        colEl.classList.remove('kb-col-over');
        api.moveCard(e.dataTransfer.getData('text/plain'), col.title);
      });

      colByName.set(col.title, { data: col, listEl: list, countEl: count });
      return colEl;
    }

    const wrap = document.createElement('div');
    wrap.className = 'kb-board';
    columns.forEach((c) => wrap.appendChild(renderColumn(c)));
    root.appendChild(wrap);

    function refreshCounts() {
      colByName.forEach(({ data, countEl }) => { countEl.textContent = data.cards.length; });
    }
    refreshCounts();

    function findCard(id) {
      for (const col of columns) {
        const idx = col.cards.findIndex((c) => c.id === id);
        if (idx !== -1) return { col, idx, card: col.cards[idx] };
      }
      return null;
    }
    function replaceCardEl(card) {
      const old = root.querySelector(`.kb-card[data-id="${card.id}"]`);
      if (old) old.replaceWith(renderCard(card));
    }
    function emit() {
      refreshCounts();
      root.dispatchEvent(new CustomEvent('kanban:change', { bubbles: true, detail: { state: api.getState() } }));
    }

    const api = {
      get team() { return [...team]; },
      getState() {
        return columns.map((col) => ({
          title: col.title,
          cards: col.cards.map((c) => ({ ...c, labels: [...c.labels] })),
        }));
      },
      addCard(colName, text) {
        const target = colByName.get(colName);
        if (!target) return null;
        const card = { id: nextId(), ...parseCard(text) };
        target.data.cards.push(card);
        target.listEl.appendChild(renderCard(card));
        emit();
        return card.id;
      },
      moveCard(id, colName) {
        const found = findCard(id);
        const target = colByName.get(colName);
        if (!found || !target || found.col.title === colName) return;
        found.col.cards.splice(found.idx, 1);
        target.data.cards.push(found.card);
        const cardEl = root.querySelector(`.kb-card[data-id="${id}"]`);
        if (cardEl) target.listEl.appendChild(cardEl);
        emit();
      },
      assign(id, person) {
        const found = findCard(id);
        if (!found) return;
        found.card.assignee = person || null;
        if (person && !team.includes(person)) team.push(person);
        replaceCardEl(found.card);
        emit();
      },
      // Reassign every card matching `pred(card)` to `person`. `pred` can be a
      // function or a string matched (case-insensitive) against labels/text --
      // e.g. assignWhere('backend', 'alice') for "assign all backend tickets".
      assignWhere(pred, person) {
        const test = typeof pred === 'function'
          ? pred
          : (c) => c.labels.some((l) => l.toLowerCase() === String(pred).toLowerCase())
                || c.text.toLowerCase().includes(String(pred).toLowerCase());
        if (person && !team.includes(person)) team.push(person);
        let n = 0;
        for (const col of columns) {
          for (const card of col.cards) {
            if (test(card)) { card.assignee = person || null; replaceCardEl(card); n++; }
          }
        }
        if (n) emit();
        return n;
      },
      removeCard(id) {
        const found = findCard(id);
        if (!found) return;
        found.col.cards.splice(found.idx, 1);
        const cardEl = root.querySelector(`.kb-card[data-id="${id}"]`);
        if (cardEl) cardEl.remove();
        emit();
      },
    };

    root.board = api;
    return api;
  }

  const apis = Array.from(document.querySelectorAll('div.kanban')).map(buildBoard).filter(Boolean);
  if (apis.length) window.kanban = apis[0];
})();
