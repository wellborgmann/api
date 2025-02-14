import express from 'express';
import http from 'http';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express(); // Corrigindo a falta da inicialização do Express
const server = http.createServer(app);

app.get("/", (req, res) => {
    res.send("OOOOOOI");
});

server.listen(8000, () => {
    console.log("Server is running on http://localhost:8000");
});
