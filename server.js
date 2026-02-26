const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// 1) Servir estáticos
app.use(express.static(path.join(__dirname, "public")));

// 2) Ruta raíz explícita (para evitar Not Found)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// (opcional) healthcheck para probar que vive
app.get("/health", (req, res) => res.send("ok"));

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});