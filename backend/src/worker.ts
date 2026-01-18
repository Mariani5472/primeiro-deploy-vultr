import dotenv from 'dotenv';
import amqp from 'amqplib';
import axios from 'axios';
dotenv.config();

const RABBIT_HOST = process.env.RABBIT_HOST || 'rabbitmq';
const RABBIT_PORT = Number(process.env.RABBIT_PORT) || 5672;
const RABBIT_USERNAME = process.env.RABBIT_USERNAME || 'guest';
const RABBIT_PASSWORD = process.env.RABBIT_PASSWORD || 'guest';

const startWorker = async () => {
    try {
        const connectionUrl = `amqp://${RABBIT_USERNAME}:${RABBIT_PASSWORD}@${RABBIT_HOST}:${RABBIT_PORT}`;
        const connection = await amqp.connect(connectionUrl);

        const channel = await connection.createChannel();
        const queue = 'brazil_flights';

        await channel.assertQueue(queue, { durable: false });

        setInterval(async () => {
            const planes = await fetchPlanes();
            if (planes.length > 0) {
                channel.sendToQueue(queue, Buffer.from(JSON.stringify(planes)));
                console.log(`${planes.length} voos enviados a fila.`);
            }
        }, 15000);
    } catch (error) {
        console.error("Erro ao iniciar Worker:", error);
    }
};

const fetchPlanes = async () => {
    // Coordenadas aproximadas do retângulo do Brasil
    const LAMIN = -33.75; // Sul
    const LOMIN = -73.98; // Oeste
    const LAMAX = 5.27;   // Norte
    const LOMAX = -34.79; // Este

    try {
        const response: Record<string, any> = await axios.get(`https://opensky-network.org/api/states/all?lamin=${LAMIN}&lomin=${LOMIN}&lamax=${LAMAX}&lomax=${LOMAX}`);
        const states = response.data.states || [];

        const planes = states.map((s: any) => ({
            icao24: s[0],
            callsign: s[1]?.trim() || 'N/A',
            origin_country: s[2],
            longitude: s[5],
            latitude: s[6],
            altitude: s[7],
            velocity: s[9],
            heading: s[10],
            timestamp: Date.now()
        }));

        return planes;

    } catch (error) {
        console.error('Erro ao buscar OpenSky:', error);
        return [];
    }
}

export { startWorker };