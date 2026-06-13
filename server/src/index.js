require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const ngoRoutes = require('./routes/ngo');
const offersRoutes = require('./routes/offers');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.json());

app.use('/api/auth', authRoutes);
app.use('/api/ngos', ngoRoutes);
app.use('/api/offers', offersRoutes);

io.on('connection', (socket) => {
  console.log('socket connected', socket.id);
  socket.on('joinRoom', (room) => socket.join(room));
  socket.on('message', (msg) => {
    const { room, payload } = msg;
    io.to(room).emit('message', payload);
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await sequelize.sync();
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

start();
