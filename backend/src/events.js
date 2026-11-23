/**
 * Server-Sent Events hub — pushes live order updates to the kitchen board
 * and to customers tracking their order.
 */
export function createEventHub() {
  const clients = new Set();

  setInterval(() => {
    for (const c of clients) c.res.write(": ping\n\n");
  }, 25_000).unref();

  return {
    subscribe(req, res, filter) {
      res.writeHead(200, {
        "content-type": "text/event-stream",
        "cache-control": "no-cache, no-transform",
        connection: "keep-alive",
        "x-accel-buffering": "no",
      });
      res.write("retry: 3000\n\n");
      const client = { res, filter };
      clients.add(client);
      req.on("close", () => clients.delete(client));
    },
    publish(event, payload) {
      const msg = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
      for (const c of clients) if (c.filter(event, payload)) c.res.write(msg);
    },
    get size() {
      return clients.size;
    },
    closeAll() {
      for (const c of clients) c.res.end();
      clients.clear();
    },
  };
}
