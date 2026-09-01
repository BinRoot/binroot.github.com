/* slides.js -- keyboard navigation for the lesson decks.
   Slides are stacked by CSS; this moves the `current` class, reveals steps,
   and draws the chrome. */
(function () {
  'use strict';

  var deck, slides, index = 0, timerStart = 0, timerHandle = 0, wheelLock = 0;
  var segments = [];
  var gridOpen = false, gridCols = 1, gridSpacer = null;

  var KEYS = [
    ['→ ↓ space', 'next step or slide'],
    ['← ↑', 'back'],
    ['wheel', 'one step per notch; keep scrolling for more'],
    ['tap / swipe', 'touch: swipe any direction, or tap right / left'],
    ['home / end', 'first / last slide'],
    ['o', 'outline, jump to any slide'],
    ['g', 'grid of every slide; click one to go'],
    ['n', 'speaker notes drawer'],
    ['t', 'elapsed timer'],
    ['f', 'fullscreen'],
    ['?', 'this list'],
    ['esc', 'close overlay']
  ];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    deck = document.getElementById('deck');
    if (!deck) return;
    slides = [].slice.call(deck.querySelectorAll('.slide'));
    if (!slides.length) return;

    slides.forEach(markSteps);
    scanSegments();
    buildChrome();
    buildArrows();
    slides[0].classList.add('current');

    /* Capture phase on window, so nothing further down the tree can swallow a
       navigation key before it arrives.  Paired with a deck that takes focus
       back after any click, this cannot end up in a state where the keys look
       dead until you click. */
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerCancel);
    deck.addEventListener('wheel', onWheel, { passive: false });
    deck.addEventListener('click', onGridClick);
    window.addEventListener('resize', function () {
      if (gridOpen) { layoutGrid(); scrollTileIntoView(true); }
      aimArrow();
    });
    /* The deck's font is loaded from disk, and the tab is as wide as the word
       it sets, so the first measurement can predate the metrics it needs. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(aimArrow);
    }
    window.addEventListener('hashchange', fromHash);

    document.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'mouse') wakeArrows();
    });

    deck.tabIndex = -1;
    refocus();
    fromHash();
    if (/[?&]notes(=|&|$)/.test(window.location.search) || drawerWasOpen()) {
      toggleDrawer();
    }
    render();
    wakeArrows();  /* one fade-in on load, so visitors learn the arrows exist */
  }

  /* Edge arrows are the mouse's click affordance.  They live only while the
     mouse is moving (or resting on them) and vanish two seconds after it
     stops, so the canvas stays clean while presenting.  Touch devices never
     show them; tap zones and swipe own navigation there. */
  var arrowTimer = 0;

  function buildArrows() {
    [['nav-prev', '‹', prev, 'previous slide'],
     ['nav-next', '›', next, 'next slide']].forEach(function (spec) {
      var b = document.createElement('button');
      b.type = 'button';
      b.id = spec[0];
      b.className = 'chrome arrow';
      b.textContent = spec[1];
      b.setAttribute('aria-label', spec[3]);
      b.addEventListener('click', function () { spec[2](); });
      document.body.appendChild(b);
    });
  }

  function wakeArrows() {
    document.body.classList.add('arrows-on');
    window.clearTimeout(arrowTimer);
    arrowTimer = window.setTimeout(function tick() {
      if (document.querySelector('.arrow:hover')) {
        arrowTimer = window.setTimeout(tick, 2000);
        return;
      }
      document.body.classList.remove('arrows-on');
    }, 2000);
  }

  function refocus() {
    if (document.activeElement !== deck) deck.focus({ preventScroll: true });
  }

  /* Segments come from the markdown's level-1 headers; slides.lua stamps each
     slide with its segment's title and id.  Contiguous runs become chapters. */
  function scanSegments() {
    segments = [];
    slides.forEach(function (slide, i) {
      if (!slide.dataset.segment) return;
      var last = segments[segments.length - 1];
      if (last && last.id === slide.dataset.segmentId) {
        last.count++;
      } else {
        segments.push({
          title: slide.dataset.segment,
          id: slide.dataset.segmentId,
          start: i,
          count: 1
        });
      }
    });
  }

  /* Touch navigation: tap the right two-thirds for next, the left third for
     back, or swipe on either axis.  Both swipes carry the content with the
     finger, which is the direction every phone carousel already teaches:
     drag left or up and the next slide follows in behind.  Up-for-next also
     keeps faith with the wheel, where scrolling down (deltaY > 0) advances.
     Whichever axis dominates owns the gesture, so a flick that drifts a
     little diagonal still reads as the swipe it obviously was.

     Mouse clicks never navigate (desktop has keys, and clicks select text or
     drive embedded components).  Taps that start on interactive content are
     the component's business, not the deck's; a component needing raw taps on
     anything else can opt out with a `.no-nav` container. */
  var SWIPE = 60;   /* px before a drag counts as a swipe, either axis */
  var TAP = 8;      /* px of slop still allowed to count as a tap */
  var NO_NAV = 'a, button, input, select, textarea, label, canvas, ' +
    'video, audio, iframe, [contenteditable], .no-nav';
  var touch = null;

  function onPointerDown(event) {
    refocus();
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    touch = {
      x: event.clientX, y: event.clientY, t: Date.now(), id: event.pointerId,
      skip: !!(event.target.closest && event.target.closest(NO_NAV))
    };
  }

  function onPointerCancel() { touch = null; }

  function onPointerUp(event) {
    /* Taps in the grid pick a slide, which the click handler does. */
    if (gridOpen) { touch = null; return; }
    if (!touch || event.pointerId !== touch.id) return;
    var start = touch;
    touch = null;
    if (start.skip) return;
    /* An open overlay owns the screen: any tap outside its controls closes
       it, because a phone has no Escape key. */
    if (document.body.classList.contains('outline-on') ||
        document.body.classList.contains('help-on')) {
      closeOverlays();
      return;
    }
    var dx = event.clientX - start.x;
    var dy = event.clientY - start.y;
    var ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax > SWIPE && ax > 1.5 * ay) {
      if (dx < 0) next(); else prev();
    } else if (ay > SWIPE && ay > 1.5 * ax) {
      if (dy < 0) next(); else prev();
    } else if (ax < TAP && ay < TAP && Date.now() - start.t < 350) {
      if (event.clientX > window.innerWidth / 3) next(); else prev();
    }
  }

  /* Wheel: every ~notch of accumulated scroll steps once, with a short
     cooldown between steps, so a flick moves one slide and a sustained
     scroll runs through several.  The tally resets on a direction change and
     after a pause, which is what keeps leftover trackpad momentum from
     coasting through the deck on its own. */
  var WHEEL_STEP = 100;  /* accumulated delta per step */
  var WHEEL_GAP = 130;   /* ms between steps */
  var wheelSum = 0, wheelSeen = 0;

  function onWheel(event) {
    /* The grid is a real scroll container; let the browser scroll it. */
    if (gridOpen) return;
    event.preventDefault();
    var dy = event.deltaY;
    if (event.deltaMode === 1) dy *= 24;                    /* lines to px */
    else if (event.deltaMode === 2) dy *= window.innerHeight;
    var now = Date.now();
    if (now - wheelSeen > 300 ||
        (wheelSum !== 0 && (dy > 0) !== (wheelSum > 0))) {
      wheelSum = 0;
    }
    wheelSeen = now;
    wheelSum += dy;
    if (Math.abs(wheelSum) < WHEEL_STEP || now - wheelLock < WHEEL_GAP) return;
    wheelLock = now;
    wheelSum = 0;
    if (dy > 0) next(); else prev();
  }

  /* A slide's top-level list steps one item at a time, which is what the
     lesson content already looks like.  Explicit `.step` markup wins, and
     `{.all}` on the heading opts out. */
  function markSteps(slide) {
    if (slide.classList.contains('all')) return;
    if (slide.querySelector('.step')) return;
    var list = slide.querySelector(':scope > ul, :scope > ol');
    if (!list) return;
    [].forEach.call(list.children, function (item) {
      item.classList.add('step');
    });
  }

  function stepsOf(slide) {
    return [].slice.call(slide.querySelectorAll('.step'));
  }

  function shownCount(steps) {
    return steps.filter(function (el) {
      return el.classList.contains('shown');
    }).length;
  }

  function next() {
    var steps = stepsOf(slides[index]);
    var shown = shownCount(steps);
    if (shown < steps.length) {
      steps[shown].classList.add('shown');
      return;
    }
    if (index < slides.length - 1) go(index + 1);
  }

  function prev() {
    var steps = stepsOf(slides[index]);
    var shown = shownCount(steps);
    if (shown > 0) {
      steps[shown - 1].classList.remove('shown');
      return;
    }
    if (index > 0) go(index - 1, true);
  }

  /* Entering a slide from behind shows the steps already spent on it; entering
     it forward starts them hidden. */
  function go(target, backward) {
    slides[index].classList.remove('current');
    index = Math.max(0, Math.min(slides.length - 1, target));
    var slide = slides[index];
    stepsOf(slide).forEach(function (el) {
      el.classList.toggle('shown', !!backward);
    });
    slide.classList.add('current');
    slide.scrollTop = 0;
    render();
  }

  function fromHash() {
    var id = window.location.hash.slice(1);
    if (!id) return;
    for (var i = 0; i < slides.length; i++) {
      if (slides[i].id === id) { go(i); return; }
    }
    for (var k = 0; k < segments.length; k++) {
      if (segments[k].id === id) { go(segments[k].start); return; }
    }
  }

  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    /* In grid mode the arrows walk the grid rather than the deck: left and
       right by one, up and down by a row, which is what the layout implies. */
    if (gridOpen) {
      switch (event.key) {
        case 'ArrowRight': case 'j': pickGrid(index + 1); break;
        case 'ArrowLeft': case 'k': pickGrid(index - 1); break;
        case 'ArrowDown': pickGrid(index + gridCols); break;
        case 'ArrowUp': pickGrid(index - gridCols); break;
        case 'Home': pickGrid(0); break;
        case 'End': pickGrid(slides.length - 1); break;
        case 'Enter': case ' ': closeGrid(); break;
        case 'g': case 'Escape': closeGrid(); break;
        default: return;
      }
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': case 'j':
        next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'k':
        prev(); break;
      case 'Home': go(0, false); break;
      case 'End': go(slides.length - 1, true); break;
      case 'o': overlay('outline-on'); break;
      case 'g': toggleGrid(); break;
      case 'n': toggleDrawer(); break;
      case 't': toggleTimer(); break;
      case 'f': fullscreen(); break;
      case '?': overlay('help-on'); break;
      case 'Escape': closeOverlays(); break;
      default: return;
    }
    event.preventDefault();
  }

  /* The notes drawer remembers whether it was open, so a refresh does not
     shut it on a reader mid-lesson.  The key is shared by every deck: someone
     reading lesson 1 with the notes out wants them out in lesson 2 as well.
     Storage can throw outright rather than return nothing (a private window,
     a browser set to block site data), so each touch is guarded and a failure
     just means the drawer behaves as it used to, closed on load.
     While open it shows the current slide's note and tracks navigation. */
  var DRAWER_KEY = 'qoe:notes-open';

  function drawerWasOpen() {
    try { return localStorage.getItem(DRAWER_KEY) === '1'; } catch (e) { return false; }
  }

  function rememberDrawer(on) {
    try { localStorage.setItem(DRAWER_KEY, on ? '1' : '0'); } catch (e) {}
  }

  function toggleDrawer() {
    var on = document.body.classList.toggle('drawer-on');
    if (on) paintDrawer();
    rememberDrawer(on);
  }

  /* The drawer names the slide it belongs to, so a reader scrolling the column
     never loses track of which picture the words go with. */
  function paintDrawer() {
    var body = document.querySelector('#notes-drawer .drawer-body');
    if (!body) return;
    var note = slides[index].querySelector('.notes');
    var title = slides[index].querySelector('h1, h2');
    var head = '<p class="drawer-title">' + (index + 1) + ' / ' + slides.length +
      (title ? ' &middot; <b>' + title.textContent + '</b>' : '') + '</p>';
    body.innerHTML = head + (note ? note.innerHTML : '<p>No notes for this slide.</p>');
  }

  function overlay(name) {
    var on = document.body.classList.contains(name);
    closeOverlays();
    if (!on) {
      document.body.classList.add(name);
      if (name === 'outline-on') paintOutline();
    }
  }

  function closeOverlays() {
    document.body.classList.remove('outline-on', 'help-on');
    closeGrid();
  }

  /* ── Grid: every slide at once ──────────────────────────────────────
     The slides are already in the DOM and already laid out at viewport size,
     so a thumbnail is the real slide under a transform rather than a picture
     of it: live, always current, and nothing to regenerate.  Scaling beats
     re-laying out at tile size, whose vh/vw-based type would reflow into
     something that is not what the slide looks like. */
  function onGridClick(event) {
    if (!gridOpen) return;
    var tile = event.target.closest && event.target.closest('.slide');
    if (!tile) return;
    var i = slides.indexOf(tile);
    if (i < 0) return;
    event.preventDefault();
    event.stopPropagation();
    go(i, true);
    closeGrid();
  }

  function toggleGrid() {
    if (gridOpen) { closeGrid(); return; }
    closeOverlays();
    document.body.classList.remove('drawer-on');
    gridOpen = true;
    document.body.classList.add('grid-on');
    layoutGrid();
    scrollTileIntoView(true);
  }

  function closeGrid() {
    if (!gridOpen) return;
    gridOpen = false;
    document.body.classList.remove('grid-on');
    slides.forEach(function (s) {
      s.style.transform = '';
      s.style.width = '';
      s.style.height = '';
      s.style.outlineWidth = '';
      s.classList.remove('tile-current');
    });
    if (gridSpacer) gridSpacer.style.height = '';
    deck.scrollTop = 0;
    refocus();
  }

  function layoutGrid() {
    var W = window.innerWidth, H = window.innerHeight;
    var avail = deck.clientWidth;
    var gap = Math.max(10, Math.round(avail * 0.012));
    gridCols = Math.max(2, Math.min(6, Math.round(avail / 300)));
    var tw = (avail - gap * (gridCols + 1)) / gridCols;
    var k = tw / W;
    var th = H * k;
    slides.forEach(function (s, i) {
      var x = gap + (i % gridCols) * (tw + gap);
      var y = gap + Math.floor(i / gridCols) * (th + gap);
      s.style.width = W + 'px';
      s.style.height = H + 'px';
      s.style.transform =
        'translate(' + x + 'px,' + y + 'px) scale(' + k + ')';
      /* Outlines scale with the element, so undo the scale to keep the
         hairline a hairline. */
      s.style.outlineWidth = Math.max(1, Math.round(1 / k)) + 'px';
      s.dataset.gridY = y;
      s.dataset.gridH = th;
      s.classList.toggle('tile-current', i === index);
    });
    var rows = Math.ceil(slides.length / gridCols);
    gridSpacer.style.height = (gap + rows * (th + gap)) + 'px';
  }

  function pickGrid(target) {
    var i = Math.max(0, Math.min(slides.length - 1, target));
    if (i === index) return;
    go(i, true);
    scrollTileIntoView(false);
  }

  function scrollTileIntoView(centre) {
    var s = slides[index];
    var y = parseFloat(s.dataset.gridY) || 0;
    var h = parseFloat(s.dataset.gridH) || 0;
    var view = deck.clientHeight;
    if (centre) {
      deck.scrollTop = Math.max(0, y - (view - h) / 2);
      return;
    }
    if (y < deck.scrollTop) deck.scrollTop = Math.max(0, y - 16);
    else if (y + h > deck.scrollTop + view) {
      deck.scrollTop = y + h - view + 16;
    }
  }

  function toggleTimer() {
    var on = document.body.classList.toggle('timer-on');
    if (on) {
      timerStart = Date.now();
      timerHandle = window.setInterval(paintTimer, 1000);
      paintTimer();
    } else {
      window.clearInterval(timerHandle);
    }
  }

  function paintTimer() {
    var total = Math.floor((Date.now() - timerStart) / 1000);
    var mins = Math.floor(total / 60), secs = total % 60;
    document.getElementById('timer').textContent =
      pad(mins) + ':' + pad(secs);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  /* The arrow's tip is at 88,58 of a 120x96 viewBox and arrives travelling
     straight down, and its head is symmetric about that.  So aiming it at the
     tab is placing that one point: directly over the tab's centre, a small
     gap above its top edge.  It has to be measured, because the tab is as
     wide as the word in it, which no offset written in rem can know. */
  var TIP_X = 88 / 120, TIP_Y = 58 / 96, TIP_GAP = 12;

  function aimArrow() {
    var arrow = document.getElementById('notes-arrow');
    var tab = document.getElementById('notes-tab');
    if (!arrow || !tab) return;
    var t = tab.getBoundingClientRect();
    var box = arrow.getBoundingClientRect();
    /* Either being hidden measures 0x0, and aiming at that would park the
       arrow somewhere wrong with nothing to correct it later. */
    if (!t.width || !box.width) return;
    arrow.style.left = (t.left + t.width / 2 - TIP_X * box.width) + 'px';
    arrow.style.top = (t.top - TIP_GAP - TIP_Y * box.height) + 'px';
  }

  function render() {
    if (gridOpen) {
      slides.forEach(function (s, i) {
        s.classList.toggle('tile-current', i === index);
      });
    }
    if (segments.length) {
      var fills = document.querySelectorAll('#chapters .fill');
      segments.forEach(function (seg, k) {
        var done = (index - seg.start + 1) / seg.count;
        fills[k].style.width = (Math.max(0, Math.min(1, done)) * 100) + '%';
      });
      var current = null;
      segments.forEach(function (seg) {
        if (index >= seg.start) current = seg;
      });
      document.getElementById('seglabel').textContent =
        current ? current.title : '';
    } else {
      document.getElementById('progress').style.width =
        ((index + 1) / slides.length * 100) + '%';
    }
    document.getElementById('counter').textContent =
      (index + 1) + ' / ' + slides.length;
    /* The notes arrow rides on this: it points at the tab from the opening
       slide, and past that a reader has either found the notes or does not
       want them. */
    document.body.classList.toggle('at-start', index === 0);
    if (index === 0) aimArrow();
    var back = document.getElementById('nav-prev');
    var fwd = document.getElementById('nav-next');
    if (back) {
      back.disabled = index === 0;
      fwd.disabled = index === slides.length - 1;
    }
    if (slides[index].id) {
      history.replaceState(null, '', '#' + slides[index].id);
    }
    if (document.body.classList.contains('outline-on')) paintOutline();
    if (document.body.classList.contains('drawer-on')) paintDrawer();
  }

  function buildChrome() {
    /* With segments, the plain progress bar gives way to the chaptered one. */
    var bits = segments.length
      ? ['seglabel', 'counter', 'timer']
      : ['progress', 'counter', 'timer'];
    bits.forEach(function (id) {
      var el = document.createElement('div');
      el.id = id;
      el.className = 'chrome';
      document.body.appendChild(el);
    });

    if (segments.length) {
      var chapters = document.createElement('div');
      chapters.id = 'chapters';
      chapters.className = 'chrome';
      segments.forEach(function (seg) {
        var zone = document.createElement('button');
        zone.type = 'button';
        zone.className = 'zone';
        zone.style.flexGrow = seg.count;
        zone.title = seg.title;
        zone.setAttribute('aria-label', seg.title);
        var fill = document.createElement('span');
        fill.className = 'fill';
        zone.appendChild(fill);
        zone.addEventListener('click', function () {
          closeOverlays();
          go(seg.start, false);
        });
        chapters.appendChild(zone);
      });
      document.body.appendChild(chapters);
    }

    /* The notes affordance for readers: a quiet tab beside the counter
       (hidden while fullscreen, so the projector never shows it) and the
       drawer it opens.  no-nav keeps taps inside from flipping slides. */
    var tab = document.createElement('button');
    tab.id = 'notes-tab';
    tab.type = 'button';
    tab.className = 'chrome';
    tab.textContent = 'notes';
    tab.addEventListener('click', toggleDrawer);
    document.body.appendChild(tab);

    /* A drawn arrow pointing at that tab, in place of a line of small print
       telling readers the notes are there.  It is built here rather than
       written into a deck because the tab it points at is built here too:
       with scripting off there is no tab, and so there is no arrow either.
       Decorative, and hidden from assistive tech, which reads the tab. */
    var arrow = document.createElement('div');
    arrow.id = 'notes-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML =
      '<svg viewBox="0 0 120 96" fill="none" stroke="currentColor" ' +
      'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path class="shaft" pathLength="100" d="M 10 24 C 34 8, 88 14, 88 58"/>' +
      '<path class="head" pathLength="100" d="M 95 45 L 88 58 L 81 45"/>' +
      '</svg>';
    document.body.appendChild(arrow);

    /* The same quiet tab, one step further in: zoom out to every slide at
       once.  Hidden in fullscreen with the rest of the reader chrome. */
    var gridTab = document.createElement('button');
    gridTab.id = 'grid-tab';
    gridTab.type = 'button';
    gridTab.className = 'chrome';
    gridTab.textContent = 'grid';
    gridTab.setAttribute('aria-label', 'show every slide at once');
    gridTab.addEventListener('click', toggleGrid);
    document.body.appendChild(gridTab);

    /* Slides are absolutely positioned, so they contribute no height of their
       own; this gives the deck something to scroll in grid mode. */
    gridSpacer = document.createElement('div');
    gridSpacer.id = 'grid-spacer';
    deck.appendChild(gridSpacer);

    var drawer = document.createElement('aside');
    drawer.id = 'notes-drawer';
    drawer.className = 'no-nav';
    drawer.innerHTML = '<button id="notes-close" type="button" ' +
      'aria-label="close notes">×</button><div class="drawer-body"></div>';
    drawer.querySelector('#notes-close')
      .addEventListener('click', toggleDrawer);
    document.body.appendChild(drawer);

    document.addEventListener('fullscreenchange', function () {
      document.body.classList.toggle('is-fullscreen',
        !!document.fullscreenElement);
    });

    var outline = document.createElement('nav');
    outline.id = 'outline';
    outline.innerHTML = '<h2>Outline</h2><div class="lists"></div>';
    document.body.appendChild(outline);

    var help = document.createElement('div');
    help.id = 'help';
    help.appendChild(heading('Keys'));
    var dl = document.createElement('dl');
    KEYS.forEach(function (pair) {
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      dl.appendChild(dt);
      dl.appendChild(dd);
    });
    help.appendChild(dl);
    document.body.appendChild(help);
  }

  function heading(text) {
    var h = document.createElement('h2');
    h.textContent = text;
    return h;
  }

  /* Slides group under their segment titles.  Each group is its own <ol>
     with a `start`, so slide numbering runs 1..N straight through. */
  function paintOutline() {
    var box = document.querySelector('#outline .lists');
    box.textContent = '';
    var group = null;
    slides.forEach(function (slide, i) {
      var segTitle = slide.dataset.segment || '';
      if (!group || group.seg !== segTitle) {
        if (segTitle) {
          var head = document.createElement('p');
          head.className = 'seg';
          head.textContent = segTitle;
          box.appendChild(head);
        }
        var ol = document.createElement('ol');
        ol.start = i + 1;
        box.appendChild(ol);
        group = { seg: segTitle, ol: ol };
      }
      var title = slide.querySelector('h1, h2');
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = title ? title.textContent : 'Slide ' + (i + 1);
      button.addEventListener('click', function () {
        closeOverlays();
        go(i, false);
      });
      var item = document.createElement('li');
      if (i === index) item.className = 'current';
      item.appendChild(button);
      group.ol.appendChild(item);
    });
  }
})();
