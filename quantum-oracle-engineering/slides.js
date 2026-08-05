/* slides.js -- keyboard navigation for the lesson decks.
   Slides are stacked by CSS; this moves the `current` class, reveals steps,
   and draws the chrome. */
(function () {
  'use strict';

  var deck, slides, index = 0, timerStart = 0, timerHandle = 0, wheelLock = 0;

  var KEYS = [
    ['→ ↓ space', 'next step or slide'],
    ['← ↑', 'back'],
    ['wheel', 'one step per gesture'],
    ['home / end', 'first / last slide'],
    ['o', 'outline, jump to any slide'],
    ['n', 'speaker notes'],
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
    buildChrome();
    slides[0].classList.add('current');

    /* Capture phase on window, so nothing further down the tree can swallow a
       navigation key before it arrives.  Paired with a deck that takes focus
       back after any click, this cannot end up in a state where the keys look
       dead until you click. */
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', refocus);
    deck.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('hashchange', fromHash);

    deck.tabIndex = -1;
    refocus();
    fromHash();
    render();
  }

  function refocus() {
    if (document.activeElement !== deck) deck.focus({ preventScroll: true });
  }

  /* One slide per gesture, with a cooldown so trackpad momentum does not run
     through the deck.  Discrete, so there is nothing to animate. */
  function onWheel(event) {
    event.preventDefault();
    var now = Date.now();
    if (Math.abs(event.deltaY) < 10 || now - wheelLock < 350) return;
    wheelLock = now;
    if (event.deltaY > 0) next(); else prev();
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
  }

  function onKey(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    switch (event.key) {
      case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': case 'j':
        next(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'k':
        prev(); break;
      case 'Home': go(0, false); break;
      case 'End': go(slides.length - 1, true); break;
      case 'o': overlay('outline-on'); break;
      case 'n': document.body.classList.toggle('notes-on'); break;
      case 't': toggleTimer(); break;
      case 'f': fullscreen(); break;
      case '?': overlay('help-on'); break;
      case 'Escape': closeOverlays(); break;
      default: return;
    }
    event.preventDefault();
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

  function render() {
    document.getElementById('progress').style.width =
      ((index + 1) / slides.length * 100) + '%';
    document.getElementById('counter').textContent =
      (index + 1) + ' / ' + slides.length;
    if (slides[index].id) {
      history.replaceState(null, '', '#' + slides[index].id);
    }
    if (document.body.classList.contains('outline-on')) paintOutline();
  }

  function buildChrome() {
    ['progress', 'counter', 'timer'].forEach(function (id) {
      var el = document.createElement('div');
      el.id = id;
      el.className = 'chrome';
      document.body.appendChild(el);
    });

    var outline = document.createElement('nav');
    outline.id = 'outline';
    outline.innerHTML = '<h2>Outline</h2><ol></ol>';
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

  function paintOutline() {
    var list = document.querySelector('#outline ol');
    list.textContent = '';
    slides.forEach(function (slide, i) {
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
      list.appendChild(item);
    });
  }
})();
