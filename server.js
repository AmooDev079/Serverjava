const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

// ========================================
// TERMINAL COLORS (no external deps)
// ========================================

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  brightGreen: "\x1b[92m",
  blue: "\x1b[34m",
  brightBlue: "\x1b[94m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function timestamp() {
  return c.gray + new Date().toLocaleTimeString() + c.reset;
}

function log(tag, color, message) {
  console.log(`${timestamp()} ${color}${c.bold}[${tag}]${c.reset} ${message}`);
}

const logHttp = (msg) => log("HTTP", c.cyan, msg);
const logWs = (msg) => log("WS", c.brightGreen, msg);
const logWarn = (msg) => log("WARN", c.yellow, msg);
const logError = (msg) => log("ERROR", c.red, msg);
const logInfo = (msg) => log("SERVER", c.magenta, msg);

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  // Default to index.html for the root request
  let requestedPath = req.url === "/" ? "/index.html" : req.url;

  // Strip query string, e.g. /index.html?foo=bar
  requestedPath = requestedPath.split("?")[0];

  // Resolve against the server's own directory
  const filePath = path.join(__dirname, decodeURIComponent(requestedPath));

  // Prevent path traversal outside __dirname (e.g. /../secret.js)
  if (!filePath.startsWith(__dirname)) {
    logWarn(`Blocked path traversal attempt: ${c.reset}${requestedPath}`);
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      logError(`404 ${c.reset}${requestedPath}`);
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
    });
    res.end(data);

    logHttp(`200 ${c.reset}${requestedPath}`);
  });
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (socket) => {
  logWs("Client connected");

  socket.send("Connected to server");

  socket.on("message", (message) => {
    logWs(`Received: ${c.reset}${message.toString()}`);

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  socket.on("close", () => {
    logWs("Client disconnected");
  });

  socket.on("error", (err) => {
    logError(`Socket error: ${err.message}`);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log("");
  console.log(`${c.bold}${c.brightGreen}╔═══════════════════════════════════════╗${c.reset}`);
  console.log(`${c.bold}${c.brightGreen}║      Static + WebSocket Server       ║${c.reset}`);
  console.log(`${c.bold}${c.brightGreen}╚═══════════════════════════════════════╝${c.reset}`);
  logInfo(`Listening on port ${c.bold}${PORT}${c.reset}`);
  console.log("");
});
