import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuração do ícone do avião
const planeIcon = (heading: number) => new L.DivIcon({
  html: `<div style="transform: rotate(${heading}deg); font-size: 24px;">✈️</div>`,
  className: 'custom-plane-icon',
  iconSize: [24, 24],
});

interface Plane {
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  velocity: number;
  heading: number;
  origin_country: string;
}

const SOCKET_URL = 'https://api.vinimariani.dev.br';

function App() {
  const [planes, setPlanes] = useState<Plane[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'], 
      secure: true
    });

    socket.on('connect', () => setConnected(true));
    
    socket.on('planes_update', (data: Plane[]) => {
      setPlanes(data);
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, background: 'white', padding: '10px', borderRadius: '5px', boxShadow: '0 0 10px rgba(0,0,0,0.2)' }}>
        <strong>Status:</strong> {connected ? '🟢 Online' : '🔴 Desconectado'}<br/>
        <strong>Aviões no radar:</strong> {planes.length}
      </div>

      <MapContainer 
        center={[-15.78, -47.92]} // Centro do Brasil
        zoom={4} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {planes.map((plane) => (
          <Marker 
            key={plane.icao24} 
            position={[plane.latitude, plane.longitude]}
            icon={planeIcon(plane.heading)}
          >
            <Popup>
              <strong>Voo: {plane.callsign}</strong><br/>
              Origem: {plane.origin_country}<br/>
              Velocidade: {Math.round(plane.velocity * 3.6)} km/h
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;