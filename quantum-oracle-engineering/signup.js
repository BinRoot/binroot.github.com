/* signup.js -- "notify me" capture on the lesson cards.
 *
 * Progressive enhancement: with JavaScript off, every card is exactly what it
 * was, a status chip saying when the lesson lands.  With it on, the chip gains
 * a button that swaps itself for an email field, and the address goes to an
 * Apps Script web app that appends a row to a sheet.
 *
 * The request must stay a "simple" one: a string body and no Content-Type
 * header, so the browser skips the CORS preflight.  Setting the header to
 * application/json makes the browser send OPTIONS first, which Apps Script
 * does not answer, and the whole thing fails looking like a permissions bug.
 */
(() => {
  'use strict';

  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbxr2yhqaUXG8XAyJwCDnCvGAdkFMxskuEkavIIYyUj5VRSMLpk_2IkcqNAEXn5OKn0DPQ/exec';
  const CONTACT = 'nishant@shukla.io';

  document.querySelectorAll('.lesson').forEach(card => {
    const lesson = card.dataset.lesson;
    const chip = card.querySelector('button');
    if (!lesson || !chip) return;

    // The card is a flex column, so two loose buttons would stack.  Give them
    // a row of their own, and let that row take over the auto top margin that
    // pins this block to the bottom of the card.
    const row = document.createElement('div');
    row.className = 'act';
    chip.replaceWith(row);
    row.append(chip, notifyButton(row, chip, lesson));
  });

  function notifyButton(row, chip, lesson) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'notify';
    button.textContent = 'Notify me';
    button.addEventListener('click', () => openForm(row, chip, lesson));
    return button;
  }

  function openForm(row, chip, lesson) {
    const form = document.createElement('form');
    form.className = 'signup';

    const email = document.createElement('input');
    email.type = 'email';
    email.required = true;
    email.autocomplete = 'email';
    email.placeholder = 'you@example.com';
    email.setAttribute('aria-label', 'Email address, to hear when this lesson is published');

    // Honeypot.  Off-screen rather than display:none, which more bots skip.
    const trap = document.createElement('input');
    trap.type = 'text';
    trap.className = 'trap';
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');

    const send = document.createElement('button');
    send.type = 'submit';
    send.textContent = 'Send';

    const note = document.createElement('p');
    note.className = 'note';
    note.setAttribute('role', 'status');

    form.append(email, trap, send, note);
    row.replaceChildren(form);
    email.focus();

    email.addEventListener('keydown', e => {
      if (e.key === 'Escape') restore(row, chip, lesson);
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (send.disabled) return;
      send.disabled = true;
      note.textContent = 'sending';

      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          // The sheet has no lesson column; the card that was clicked rides
          // along as the note, which is the only free-form field there is.
          body: JSON.stringify({ email: email.value, note: lesson, company: trap.value })
        });
        const data = await res.json();
        if (data.ok) {
          row.replaceChildren(chip, done(data.message));
        } else {
          note.textContent = data.message;
          send.disabled = false;
        }
      } catch (err) {
        // Blocked, offline, or the deployment moved.  Never swallow it: hand
        // over an address that always works.
        note.replaceChildren(
          document.createTextNode('could not reach the list. '),
          mailtoLink(lesson)
        );
        send.disabled = false;
      }
    });
  }

  function restore(row, chip, lesson) {
    row.replaceChildren(chip, notifyButton(row, chip, lesson));
  }

  function done(message) {
    const span = document.createElement('span');
    span.className = 'done';
    span.setAttribute('role', 'status');
    span.textContent = message;
    return span;
  }

  function mailtoLink(lesson) {
    const link = document.createElement('a');
    link.href = 'mailto:' + CONTACT + '?subject=' +
      encodeURIComponent('Notify me: ' + lesson);
    link.textContent = 'email me instead';
    return link;
  }
})();
