import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import amqp from 'amqplib';
import { startWorker } from './worker';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

const RABBIT_URL = process.env.RABBIT_URL || 'rabbitmq';

async function startServer() {
  startWorker();

  const connection = await amqp.connect(RABBIT_URL);
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