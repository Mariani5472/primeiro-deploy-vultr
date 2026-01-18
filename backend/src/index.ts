import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import amqp from 'amqplib';
import { startWorker } from './worker';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://vinimariani.dev.br", 
      "https://www.vinimariani.dev.br"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});


const RABBIT_HOST = process.env.RABBIT_HOST?.trim() || 'localhost';
const RABBIT_PORT = Number(process.env.RABBIT_PORT?.trim()) || 5672;
const RABBIT_USERNAME = process.env.RABBIT_USERNAME?.trim() || 'guest';
const RABBIT_PASSWORD = process.env.RABBIT_PASSWORD?.trim() || 'guest';

async function startServer() {
  startWorker();

  const connection = await amqp.connect({
      hostname: RABBIT_HOST,
      port: RABBIT_PORT,
      username: RABBIT_USERNAME,
      password: RABBIT_PASSWORD
  });
  const channel = await connection.createChannel();
  const queue = 'brazil_flights';

  await channel.assertQueue(queue, { durable: false });

  console.log('Aguardando mensagens na fila...');

  channel.consume(queue, (msg) => {
    if (msg !== null) {
      const planes = JSON.parse(msg.content.toString());
      
      io.emit('planes_update', planes);
      
      channel.ack(msg);
    }
  });

  httpServer.listen(3000, () => {
    console.log('API e WebSocket rodando na porta 3000');
  });
}

startServer();