const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// Historial simple en RAM (después lo cambiamos a BD)
const history = new Map(); // room -> array mensajes
const MAX = 50;

function pushHistory(room, msg){
  if(!history.has(room)) history.set(room, []);
  const arr = history.get(room);
  arr.push(msg);
  if(arr.length > MAX) arr.shift();
}

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.id);

  socket.on("joinRoom", ({ room, user }) => {
    socket.join(room);
    const items = history.get(room) || [];
    socket.emit("historial", items);
    console.log(`${user || "Invitado"} entró a ${room}`);
  });

  socket.on("mensaje", (msg) => {
    // msg: { room, user, text, ts }
    if(!msg?.room || !msg?.text) return;
    pushHistory(msg.room, msg);
    io.to(msg.room).emit("mensaje", msg);
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});