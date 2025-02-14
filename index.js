import express from 'express';
import http from 'http';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import { Client } from "ssh2";
import retry from "async-retry";
import { exec } from "child_process"; // Corrigida a ordem da importação

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express(); 
const server = http.createServer(app);

const connSettings = {
    host: process.env.IP_SSH,
    port: 22,
    username: process.env.USER_SSH,
    password: process.env.PASS_SSH,
    readyTimeout: 30000,
};

// Função para executar comandos SSH
async function executeSSHCommand(command) {
    return retry(async (bail) => {
        return new Promise((resolve, reject) => {
            let dataReceived = "";

            const process = exec(command, (err, stdout, stderr) => {
                if (err) {
                    console.error("Erro ao executar comando:", err);
                    return reject(err);
                }
                if (stderr) {
                    console.error("STDERR:", stderr);
                }
                resolve(stdout.trim());
            });

            process.stdout.on("data", (data) => {
                dataReceived += data;
            });

            process.stderr.on("data", (data) => {
                console.error("STDERR:", data);
            });
        });
    }, {
        retries: 3,
        minTimeout: 2000,
    });
}

// Função para verificar se o login existe
async function checkLoginExists(loginName) {
    let comando = `chage -l ${loginName} | grep -E 'Account expires' | cut -d ' ' -f3-`;

    try {
        const dataReceived = await executeSSHCommand(comando);
        return {
            exists: !!dataReceived, 
            data: dataReceived || null
        };
    } catch (error) {
        console.error("Erro ao verificar login:", error);
        return { exists: false, data: null };
    }
}

// Endpoint para verificar o usuário
app.get("/checkuser", async (req, res) => {
    const login = req.query?.login;
    if (!login) {
        return res.status(400).send({ error: "Parâmetro 'login' ausente" });
    }

    try {
        const { data, exists } = await checkLoginExists(login);
        if (!exists) {
            return res.status(404).send({ error: "Usuário não encontrado" });
        }
        res.json({ login, data });
    } catch (error) {
        console.error("Erro na API:", error);
        res.status(500).send({ error: "Erro interno do servidor" });
    }
});

// Iniciar o servidor
server.listen(8000, () => {
    console.log("Server is running on http://localhost:8000");
});
