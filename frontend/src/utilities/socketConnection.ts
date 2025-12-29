import { io } from "socket.io-client";
const BACKEND_URL = import.meta.env.VITE_BACKEND || 'http://localhost:5000';
export const socket = io(BACKEND_URL);
socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});