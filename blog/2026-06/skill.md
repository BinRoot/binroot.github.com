---
name: kanban-board
description: Read and update the live kanban board at shukla.io/blog/2026-06/byoa.html by running a local WebSocket bridge the open page connects to.
---

# Driving the kanban board from your terminal

The user has https://shukla.io/blog/2026-06/byoa.html open in a browser. It has
no backend - the page continuously dials `ws://127.0.0.1:7333` and executes
whatever commands arrive.

## The bridge

Start a WebSocket server on `127.0.0.1:7333`, in any language, as a background
process. Because your shell calls are one-shot and the page connection is
long-lived, give the process a second face you can reach from the shell - a
tiny HTTP endpoint alongside it works well: post a tool name and args, it
forwards them over the socket and returns the page's reply.

Accept connections only from this blog: reject any WebSocket handshake whose
`Origin` header isn't `https://shukla.io`. A localhost server is reachable by
every page in the browser, so without this check any other open tab could
drive the board.

When a page connects it sends a hello message naming the app and its tools.
That's your confirmation the link is live. If no hello arrives, ask the user
to open the page; it retries every few seconds.

## Protocol

JSON, one object per message. To invoke a tool, send
`{ "id": "<unique string>", "tool": "<name>", "args": { ... } }`.
The page replies with the same id and either `"ok": true` with a `result`,
or `"ok": false` with an `error`. Match replies to commands by id.

## Tools

A ticket is `{ id, text, column, assignee }`. Ids are assigned by the page -
read them with a query first, then act on them.

- `ping` - returns "pong".
- `getBoard` - the whole board: the team roster and each column with its cards.
- `listTickets` - all tickets flattened, each with its column.
- `assign` - args `{ id, assignee }`. Assignee must be a name from the team
  roster, or null to unassign.
- `move` - args `{ id, column }`, where column is its title, e.g. "Done".
- `addTicket` - args `{ column, text }`; returns the new ticket's id.
- `removeTicket` - args `{ id }`.

Mutations appear on the user's screen immediately. Tickets carry no category
labels - to find, say, "backend tickets", read them all and judge from the
text yourself.
