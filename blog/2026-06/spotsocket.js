// spotsocket.js -- the "spotsocket" half of the kanban demo.
//
// A browser tab can't listen on a socket, so the page is the *client*: it
// continuously dials a local bridge that an agent (e.g. Claude Code) stands
// up at ws://127.0.0.1:7333. The agent drives the conversation -- it sends a
// command, the page executes it against the live board and replies. See
// skill.md in this directory for the agent side and the wire protocol.
(() => {
  const board = window.kanban;
  if (!board) return;                       // no board on this page -- nothing to serve
  if (window.__KB_AGENT_DISABLE) return;    // user opt-out

  const PORT = window.__KB_AGENT_PORT || 7333;
  const ENDPOINT = `ws://127.0.0.1:${PORT}`;

  // Tool catalog -- mirrors the board's programmatic API. Ticket ids are the
  // board's per-load ids (stable within a session); read them via getBoard /
  // listTickets, then act on them.
  const tools = {
    ping: () => 'pong',
    getBoard: () => ({ team: board.team, columns: board.getState() }),
    listTickets: () => board.getState().flatMap((col) =>
      col.cards.map((c) => ({ id: c.id, text: c.text, column: col.title, assignee: c.assignee }))),
    assign: ({ id, assignee = null }) => { board.assign(id, assignee); return { id, assignee }; },
    move: ({ id, column }) => { board.moveCard(id, column); return { id, column }; },
    addTicket: ({ column, text }) => ({ id: board.addCard(column, text) }),
    removeTicket: ({ id }) => { board.removeCard(id); return { ok: true }; },
  };

  let ws = null;
  let retry = null;
  const schedule = () => { clearTimeout(retry); retry = setTimeout(dial, 3000); };

  function dial() {
    try { ws = new WebSocket(ENDPOINT); }
    catch { schedule(); return; }

    ws.onopen = () => ws.send(JSON.stringify({
      type: 'hello', app: 'kanban', protocol: 1, tools: Object.keys(tools),
    }));

    ws.onmessage = (ev) => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch { return; }
      const { id, tool, args } = msg;
      const fn = tools[tool];
      if (!fn) { reply({ id, ok: false, error: `unknown tool: ${tool}` }); return; }
      try { reply({ id, ok: true, result: fn(args || {}) }); }
      catch (e) { reply({ id, ok: false, error: String((e && e.message) || e) }); }
    };

    // Connection refused (no bridge running) is the normal idle state -- retry
    // quietly rather than spamming the console.
    ws.onerror = () => { try { ws.close(); } catch (_) {} };
    ws.onclose = schedule;
  }

  function reply(obj) {
    if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj));
  }

  dial();
})();
