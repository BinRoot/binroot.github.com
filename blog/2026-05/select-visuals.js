(() => {
  // ============================================================
  // Simulators — each yields step events
  // step = { line, mem: {regions...}, active: [...] }
  // ============================================================
  function simulateV1(valid, n) {
    const steps = [];
    let count = '?', i = '?', ret = '?';
    const snap = (line, active = [], note = '', activeBit) =>
      steps.push({ line, mem: { stack: { count, i, ret } }, active, note, activeBit });

    snap(1, [], `valid=[${valid.map(b => b ? 1 : 0).join(',')}], n=${n}`);
    count = 0; snap(2, ['count'], 'count = 0');
    for (let it = 0; it < valid.length; it++) {
      i = it; snap(3, ['i'], `i = ${it}`, it);
      snap(4, ['i'], `valid[${it}] = ${valid[it] ? 1 : 0}`, it);
      if (valid[it]) {
        snap(5, ['count'], `count = ${count}, n = ${n}`, it);
        if (count === n) {
          ret = it;
          snap(5, ['ret'], `return ${it}`, it);
          return steps;
        }
        count++;
        snap(6, ['count'], `count = ${count}`, it);
      }
    }
    ret = -1;
    snap(9, ['ret'], 'return -1');
    return steps;
  }

  function simulateV2(valid, n) {
    const steps = [];
    let countPtr = '∅', heapCount = null;
    let result = '?', i = '?', ret = '?';
    const snap = (line, active = [], note = '', activeBit) => {
      const mem = { stack: { count_ptr: countPtr, result, i, ret } };
      if (heapCount !== null) mem.heap = { '*count': heapCount };
      steps.push({ line, mem, active, note, activeBit });
    };

    snap(1, [], `valid=[${valid.map(b => b ? 1 : 0).join(',')}], n=${n}`);
    heapCount = '?'; countPtr = '→heap';
    snap(2, ['count_ptr', '*count'], 'malloc → heap slot');
    heapCount = 0; snap(3, ['*count'], '*count = 0');
    result = -1; snap(4, ['result'], 'result = -1');

    for (let it = 0; it < valid.length; it++) {
      i = it; snap(5, ['i'], `i = ${it}`, it);
      snap(6, ['i'], `valid[${it}] = ${valid[it] ? 1 : 0}`, it);
      if (valid[it]) {
        snap(7, ['*count'], `*count = ${heapCount}, n = ${n}`, it);
        if (heapCount === n) {
          result = it; snap(7, ['result'], `result = ${it}, break`, it);
          break;
        }
        heapCount++;
        snap(8, ['*count'], `*count = ${heapCount}`, it);
      }
    }
    heapCount = null; countPtr = '∅';
    snap(11, ['count_ptr'], 'free → heap slot gone');
    ret = result;
    snap(12, ['ret'], `return ${result}`);
    return steps;
  }

  function simulateV3(valid, n) {
    const steps = [];
    let scratch = 0;        // caller-owned
    let scratchPtr = '→caller';
    let result = '?', i = '?', ret = '?';
    const snap = (line, active = [], note = '', activeBit) =>
      steps.push({
        line,
        mem: {
          stack: { scratch_ptr: scratchPtr, result, i, ret },
          caller: { scratch },
        },
        active,
        note,
        activeBit,
      });

    snap(1, [], `valid=[${valid.map(b => b ? 1 : 0).join(',')}], n=${n}`);
    scratch = 0; snap(2, ['scratch'], '*scratch = 0');
    result = -1; snap(3, ['result'], 'result = -1');

    for (let it = 0; it < valid.length; it++) {
      i = it; snap(4, ['i'], `i = ${it}`, it);
      snap(5, ['i'], `valid[${it}] = ${valid[it] ? 1 : 0}`, it);
      if (valid[it]) {
        snap(6, ['scratch'], `*scratch = ${scratch}, n = ${n}`, it);
        if (scratch === n) {
          result = it; snap(6, ['result'], `result = ${it}, break`, it);
          break;
        }
        scratch++;
        snap(7, ['scratch'], `*scratch = ${scratch}`, it);
      }
    }
    ret = result;
    snap(10, ['ret'], `return ${result} — scratch left dirty`);
    return steps;
  }

  function simulateV4(valid, n) {
    // V4: reversible output only (no uncompute). Scratch is left dirty.
    // Line numbering accounts for the `// caller: ...` comment as line 1.
    const steps = [];
    const sentinel = valid.length;
    let scratch = 0;            // caller, init 0
    let out = sentinel;         // caller, init to sentinel N
    let i = '?';
    const fmtOut = (v) => v === sentinel ? `N(${sentinel})` : v;
    const snap = (line, active = [], note = '', activeBit) =>
      steps.push({
        line,
        mem: {
          stack: { i },
          caller: { scratch, out: fmtOut(out) },
        },
        active,
        note,
        activeBit,
      });

    snap(2, [], `valid=[${valid.map(b => b ? 1 : 0).join(',')}], n=${n}`);
    snap(4, [], `sentinel = ${sentinel}`);
    for (let it = 0; it < valid.length; it++) {
      i = it; snap(6, ['i'], `i = ${it}`, it);
      snap(7, ['i'], `valid[${it}] = ${valid[it] ? 1 : 0}`, it);
      if (valid[it]) {
        snap(8, ['scratch'], `*scratch = ${scratch}, n = ${n}`, it);
        if (scratch === n) {
          out ^= (it ^ sentinel);
          snap(8, ['out'], `*out ^= ${it}^${sentinel} → ${fmtOut(out)}`, it);
        }
        scratch++;
        snap(9, ['scratch'], `*scratch = ${scratch}`, it);
      }
    }
    snap(12, [], `*scratch = ${scratch} (left dirty), *out = ${fmtOut(out)}`);
    return steps;
  }

  function simulateV5(valid, n) {
    // V5: V4 + uncompute pass to restore *scratch to 0.
    const steps = [];
    const sentinel = valid.length;
    let scratch = 0;
    let out = sentinel;
    let i = '?';
    const fmtOut = (v) => v === sentinel ? `N(${sentinel})` : v;
    const snap = (line, active = [], note = '', activeBit) =>
      steps.push({
        line,
        mem: {
          stack: { i },
          caller: { scratch, out: fmtOut(out) },
        },
        active,
        note,
        activeBit,
      });

    snap(2, [], `valid=[${valid.map(b => b ? 1 : 0).join(',')}], n=${n}`);
    snap(4, [], `sentinel = ${sentinel}`);
    // Forward pass
    for (let it = 0; it < valid.length; it++) {
      i = it; snap(6, ['i'], `i = ${it}`, it);
      snap(7, ['i'], `valid[${it}] = ${valid[it] ? 1 : 0}`, it);
      if (valid[it]) {
        snap(8, ['scratch'], `*scratch = ${scratch}, n = ${n}`, it);
        if (scratch === n) {
          out ^= (it ^ sentinel);
          snap(8, ['out'], `*out ^= ${it}^${sentinel} → ${fmtOut(out)}`, it);
        }
        scratch++;
        snap(9, ['scratch'], `*scratch = ${scratch}`, it);
      }
    }
    // Uncompute pass
    for (let it = 0; it < valid.length; it++) {
      i = it; snap(13, ['i'], `i = ${it} (uncompute)`, it);
      snap(14, ['i'], `valid[${it}] = ${valid[it] ? 1 : 0}`, it);
      if (valid[it]) {
        scratch--;
        snap(14, ['scratch'], `*scratch = ${scratch}`, it);
      }
    }
    snap(16, [], `*scratch = ${scratch}, *out = ${fmtOut(out)}`);
    return steps;
  }

  // ============================================================
  // Renderer — builds the widget for one version inside a host div
  // ============================================================
  function findCodeBlock(host) {
    // Code now lives inside the fig host.
    const inside = host.querySelector('.sourceCode');
    if (inside) return inside;
    // Legacy fallback: preceding sibling.
    let el = host.previousElementSibling;
    while (el) {
      if (el.classList && el.classList.contains('sourceCode')) return el;
      el = el.previousElementSibling;
    }
    return null;
  }

  function buildVisual(host, config) {
    const codeBlock = findCodeBlock(host);
    if (!codeBlock) {
      console.warn('select-visuals: no code block found for', host);
      return;
    }
    const lineSpans = codeBlock.querySelectorAll('code > span[id]');

    host.style.cssText = `
      display: block;
      border: 1px solid #d8dce2;
      border-radius: 6px;
      padding: 12px;
      margin: 0.6em 0 1em;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12.5px;
      background: #ffffff;
    `;

    const validBits = [false, true, false, true, true];

    // ---- Inputs row ----
    const inputs = document.createElement('div');
    inputs.style.cssText = 'display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 10px;';

    const validLabel = document.createElement('span');
    validLabel.textContent = 'valid';
    validLabel.style.cssText = 'color: #888; font-size: 11px;';
    inputs.appendChild(validLabel);

    const validBtns = [];
    validBits.forEach((v, idx) => {
      const btn = document.createElement('button');
      btn.style.cssText = `width: 26px; height: 26px; cursor: pointer; border: 1px solid #bdc1c8; background: transparent; font-family: inherit; font-size: 12px; padding: 0;`;
      const refresh = () => {
        btn.textContent = validBits[idx] ? '1' : '0';
        btn.style.background = validBits[idx] ? '#dff0e2' : '#f6f7fa';
        btn.style.color = validBits[idx] ? '#1d6a36' : '#888';
      };
      refresh();
      btn.addEventListener('click', () => {
        validBits[idx] = !validBits[idx];
        refresh();
      });
      validBtns.push({ btn, refresh });
      inputs.appendChild(btn);
    });

    const nLabel = document.createElement('span');
    nLabel.textContent = 'n';
    nLabel.style.cssText = 'color: #888; font-size: 11px; margin-left: 4px;';
    inputs.appendChild(nLabel);

    const nInput = document.createElement('input');
    nInput.type = 'number';
    nInput.min = '0';
    nInput.max = String(validBits.length - 1);
    nInput.value = '1';
    nInput.style.cssText = 'width: 42px; padding: 3px 5px; border: 1px solid #bdc1c8; font-family: inherit; font-size: 12px;';
    inputs.appendChild(nInput);

    const btnStyle = 'padding: 4px 10px; cursor: pointer; border: 1px solid #bdc1c8; background: #f0f1f5; font-family: inherit; font-size: 12px;';
    const iconBtnStyle = btnStyle + ' min-width: 28px; padding: 4px 8px;';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.title = 'step back';
    prevBtn.style.cssText = iconBtnStyle + ' margin-left: 8px;';
    inputs.appendChild(prevBtn);

    const playBtn = document.createElement('button');
    playBtn.textContent = '▶ run';
    playBtn.title = 'auto-run / pause';
    playBtn.style.cssText = btnStyle;
    inputs.appendChild(playBtn);

    const stepBtn = document.createElement('button');
    stepBtn.textContent = '▶';
    stepBtn.title = 'step forward';
    stepBtn.style.cssText = iconBtnStyle;
    inputs.appendChild(stepBtn);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'reset';
    resetBtn.style.cssText = btnStyle;
    inputs.appendChild(resetBtn);

    host.appendChild(inputs);

    // ---- Memory regions panel ----
    const memWrap = document.createElement('div');
    memWrap.style.cssText = 'display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap; min-height: 90px;';
    host.appendChild(memWrap);

    const REGION_STYLE = {
      stack:  { color: '#5b8def', label: 'stack frame' },
      heap:   { color: '#e08040', label: 'heap' },
      caller: { color: '#3aa655', label: 'caller memory' },
    };

    function highlightLine(num) {
      lineSpans.forEach((span, i) => {
        if (i + 1 === num) span.classList.add('vs-active-line');
        else span.classList.remove('vs-active-line');
      });
    }

    function clearLine() {
      lineSpans.forEach(span => span.classList.remove('vs-active-line'));
    }

    function applyNotes(upToCursor) {
      const notes = {};
      for (let i = 0; i <= upToCursor && i < steps.length; i++) {
        const s = steps[i];
        if (s.note) notes[s.line] = s.note;
      }
      lineSpans.forEach((span, idx) => {
        let noteEl = span.querySelector('.vs-note');
        const note = notes[idx + 1];
        if (note) {
          if (!noteEl) {
            noteEl = document.createElement('span');
            noteEl.className = 'vs-note';
            span.appendChild(noteEl);
          }
          noteEl.textContent = `   // ${note}`;
        } else if (noteEl) {
          noteEl.remove();
        }
      });
    }

    function clearNotes() {
      lineSpans.forEach(span => {
        const noteEl = span.querySelector('.vs-note');
        if (noteEl) noteEl.remove();
      });
    }

    function highlightBit(idx) {
      validBtns.forEach(({ btn }, i) => {
        btn.style.boxShadow = (i === idx) ? '0 0 0 2px #d4ad00' : 'none';
      });
    }
    function clearBitHighlight() {
      validBtns.forEach(({ btn }) => { btn.style.boxShadow = 'none'; });
    }

    function renderMem(mem, active) {
      memWrap.innerHTML = '';
      ['stack', 'heap', 'caller'].forEach(key => {
        if (!mem[key]) return;
        const style = REGION_STYLE[key];
        const region = document.createElement('div');
        region.style.cssText = `
          border: 1px dashed ${style.color};
          border-radius: 4px;
          padding: 6px 10px;
          min-width: 110px;
          background: ${style.color}0d;
        `;
        const title = document.createElement('div');
        title.textContent = style.label;
        title.style.cssText = `font-size: 10px; color: ${style.color}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;`;
        region.appendChild(title);

        Object.entries(mem[key]).forEach(([name, val]) => {
          const row = document.createElement('div');
          const isActive = active.includes(name) || active.includes(`*${name.replace('_ptr','')}`);
          row.style.cssText = `
            font-size: 12px;
            padding: 2px 4px;
            border-radius: 2px;
            background: ${isActive ? '#fff3a8' : 'transparent'};
            font-weight: ${isActive ? '600' : '400'};
          `;
          row.textContent = `${name} = ${val}`;
          region.appendChild(row);
        });

        memWrap.appendChild(region);
      });
    }

    let steps = [];
    let cursor = -1;            // -1 = before any step (initial frame)
    let playing = false;
    let timer = null;

    const indicator = document.createElement('span');
    indicator.style.cssText = 'color: #888; font-size: 11px; margin-left: auto;';
    inputs.appendChild(indicator);

    function setIndicator() {
      const total = steps.length;
      const at = cursor < 0 ? 0 : cursor + 1;
      indicator.textContent = total ? `${at} / ${total}` : '';
      prevBtn.disabled = cursor < 0;
      stepBtn.disabled = cursor >= total - 1;
    }

    function showFrame(idx) {
      if (idx < 0) {
        clearLine();
        clearNotes();
        clearBitHighlight();
        if (steps.length) renderMem(steps[0].mem, []);
        cursor = -1;
      } else {
        const s = steps[Math.min(idx, steps.length - 1)];
        highlightLine(s.line);
        renderMem(s.mem, s.active || []);
        cursor = idx;
        applyNotes(cursor);
        if (s.activeBit !== undefined) highlightBit(s.activeBit);
        else clearBitHighlight();
      }
      setIndicator();
    }

    function regenerate() {
      stopAuto();
      clearNotes();
      clearBitHighlight();
      const n = Math.max(0, Math.min(validBits.length - 1, parseInt(nInput.value, 10) || 0));
      steps = config.simulate(validBits, n);
      showFrame(-1);
    }

    function stopAuto() {
      if (timer) { clearTimeout(timer); timer = null; }
      playing = false;
      playBtn.textContent = '▶ run';
    }

    function startAuto() {
      if (cursor >= steps.length - 1) showFrame(-1);
      playing = true;
      playBtn.textContent = '❚❚ pause';
      const tick = () => {
        if (!playing) return;
        if (cursor >= steps.length - 1) { stopAuto(); return; }
        showFrame(cursor + 1);
        timer = setTimeout(tick, 550);
      };
      tick();
    }

    prevBtn.addEventListener('click', () => { stopAuto(); if (cursor > -1) showFrame(cursor - 1); });
    stepBtn.addEventListener('click', () => { stopAuto(); if (cursor < steps.length - 1) showFrame(cursor + 1); });
    playBtn.addEventListener('click', () => { playing ? stopAuto() : startAuto(); });
    resetBtn.addEventListener('click', () => { stopAuto(); showFrame(-1); });

    // re-cache steps when inputs change
    validBtns.forEach(({ btn }, idx) => {
      btn.addEventListener('click', regenerate);
    });
    nInput.addEventListener('input', regenerate);

    regenerate();
  }

  // ============================================================
  // Mount each fenced div
  // ============================================================
  const FIGURES = [
    { cls: 'fig-v1', simulate: simulateV1 },
    { cls: 'fig-v2', simulate: simulateV2 },
    { cls: 'fig-v3', simulate: simulateV3 },
    { cls: 'fig-v4', simulate: simulateV4 },
    { cls: 'fig-v5', simulate: simulateV5 },
  ];

  FIGURES.forEach(f => {
    document.querySelectorAll(`.${f.cls}`).forEach(host => buildVisual(host, f));
  });
})();
