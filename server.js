const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { exec } = require("child_process");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const SECRET = "super_secret_key";

// Base de datos simulada en memoria
let usuarios = [];


// Registro
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  const existe = usuarios.find(u => u.username === username);
  if (existe) return res.status(400).json({ error: "Usuario ya existe" });

  const hash = await bcrypt.hash(password, 10);

  usuarios.push({ username, password: hash });

  res.json({ message: "Usuario registrado" });
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = usuarios.find(u => u.username === username);
  if (!user) return res.status(400).json({ error: "Usuario no encontrado" });

  const valido = await bcrypt.compare(password, user.password);
  if (!valido) return res.status(401).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign({ username }, SECRET, { expiresIn: "2h" });

  res.json({ token });
});


io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No autorizado"));

  try {
    const decoded = jwt.verify(token, SECRET);
    socket.username = decoded.username;
    next();
  } catch (err) {
    next(new Error("Token inválido"));
  }
});

io.on("connection", (socket) => {
  console.log("Usuario conectado:", socket.username);

  // Unirse a sala
  socket.on("joinRoom", (room) => {
    socket.join(room);
  });

  // Enviar mensaje
  socket.on("mensaje", ({ room, mensaje }) => {
    io.to(room).emit("mensaje", {
      usuario: socket.username,
      mensaje
    });
  });

  // Gestión de procesos
  socket.on("obtenerProcesos", () => {
    const comando = process.platform === "win32" ? "tasklist" : "ps aux";

    exec(comando, (error, stdout) => {
      if (error) {
        socket.emit("procesos", "Error al obtener procesos");
        return;
      }
      socket.emit("procesos", stdout);
    });
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.username);
  });
});


const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor corriendo en puerto", PORT);
});