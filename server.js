const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

// Serve web interface
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// ==========================================
// COLORS FOR NODE CONSOLE
// ==========================================

const C = {
    reset: "\x1b[0m",

    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",
    brightMagenta: "\x1b[95m"
};

function log(color, message) {
    console.log(
        color + message + C.reset
    );
}

// ==========================================
// CONNECTIONS
// ==========================================

io.on("connection", (socket) => {

    log(
        C.brightGreen,
        `[+] Connection: ${socket.id}`
    );

    // ======================================
    // DATA FROM JAVA CLIENT
    // ======================================

    socket.on("androidData", (data) => {

        console.log("");

        log(
            C.brightCyan,
            "╔══════════════════════════════════════╗"
        );

        log(
            C.brightCyan,
            "║          DATA FROM CLIENT            ║"
        );

        log(
            C.brightCyan,
            "╚══════════════════════════════════════╝"
        );

        console.log(
            JSON.stringify(data, null, 2)
        );

        console.log("");

        // Send received data to browser
        io.emit("clientData", data);

        log(
            C.brightGreen,
            "[✓] Data forwarded to web interface"
        );
    });

    // ======================================
    // MESSAGE FROM WEB BROWSER
    // ======================================

    socket.on("webMessage", (data) => {

        const message =
            data.message || "";

        console.log("");

        log(
            C.brightMagenta,
            `[WEB → CLIENTS] ${message}`
        );

        // Send to all Java clients
        socket.broadcast.emit(
            "serverMessage",
            {
                message: message,
                time: new Date().toISOString()
            }
        );

        // Also update browser interfaces
        io.emit(
            "serverChat",
            {
                message: message,
                time: new Date().toISOString()
            }
        );
    });

    // ======================================
    // DISCONNECT
    // ======================================

    socket.on("disconnect", () => {

        log(
            C.brightRed,
            `[-] Disconnected: ${socket.id}`
        );

        io.emit(
            "clientStatus",
            {
                type: "disconnect",
                id: socket.id
            }
        );
    });
});

// ==========================================
// START
// ==========================================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        log(
            C.brightCyan,
            "╔══════════════════════════════════════╗"
        );

        log(
            C.brightCyan,
            "║          JAVA CHAT SERVER            ║"
        );

        log(
            C.brightCyan,
            "╚══════════════════════════════════════╝"
        );

        console.log("");

        log(
            C.brightGreen,
            `SERVER : ONLINE`
        );

        log(
            C.brightYellow,
            `PORT   : ${PORT}`
        );

        log(
            C.brightCyan,
            `WEB    : http://localhost:${PORT}`
        );

        console.log("");

        log(
            C.brightGreen,
            "Waiting for clients..."
        );

        console.log("");
    }
);
