import express from 'express';
import http from 'http';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import { Client } from "ssh2";
dotenv.config();
import retry from "async-retry";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express(); // Corrigindo a falta da inicialização do Express
const server = http.createServer(app);

app.get("/checkuser", async (req, res) => {
    const login = req.query?.login ? req.query.login : false;
    if(!login)res.send("ERRO");
    const {data, exists} = await checkLoginExists(login);
    res.send(data);
});


const connSettings = {
    host: process.env.IP_SSH,
    port: 22,
    username: process.env.USER_SSH,
    password: process.env.PASS_SSH,
    readyTimeout: 30000,
  };

  import { exec } from "child_process";


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


  async function checkLoginExists(loginName) {
    let comando = `chage -l ${loginName} | grep -E 'Account expires' | cut -d ' ' -f3-`;

    try {
        const dataReceived = await executeSSHCommand(comando);
        return {
            exists: !!dataReceived, // Se houver dados, o usuário existe
            data: dataReceived || null
        };
    } catch (error) {
        console.error("Erro ao verificar login:", error);
        return { exists: false };
    }
}



server.listen(8000, () => {
    console.log("Server is running on http://localhost:8000");
});
