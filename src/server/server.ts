import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    methods: ["GET", "POST"]
  }
});

// Script para ativar o Cursor e garantir que está em primeiro plano
const activateScript = `
tell application "Cursor"
  activate
end tell

-- Espera até que o Cursor esteja em primeiro plano
repeat until application "Cursor" is frontmost
  delay 0.1
end repeat

-- Pressiona Command+I para abrir o Composer
tell application "System Events"
  keystroke "i" using command down
  delay 0.2
end tell
`;

// Verifica se o Cursor está disponível
async function checkCursorAvailability() {
  return new Promise((resolve) => {
    exec('ps aux | grep "[C]ursor"', (error, stdout) => {
      const isCursorRunning = stdout.trim().length > 0;
      resolve(isCursorRunning);
    });
  });
}

// Verifica se o Composer está instalado
async function checkComposerAvailability() {
  return new Promise((resolve) => {
    const script = `
tell application "System Events"
  tell process "Cursor"
    exists menu bar 1
  end tell
end tell`;
    
    exec(`osascript -e '${script}'`, (error, stdout) => {
      resolve(stdout.trim() === 'true');
    });
  });
}

// Função para executar AppleScript
async function runAppleScript(script: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`osascript -e '${script}'`, (error) => {
      resolve(!error);
    });
  });
}

// Gerenciamento de conexões WebSocket
io.on('connection', async (socket) => {
  console.log('Cliente conectado');

  // Verifica e envia status inicial
  const isCursorAvailable = await checkCursorAvailability();
  const isComposerAvailable = await checkComposerAvailability();
  
  socket.emit('status-update', {
    cursor: isCursorAvailable,
    composer: isComposerAvailable
  });

  // Verifica status periodicamente
  const statusInterval = setInterval(async () => {
    const cursorStatus = await checkCursorAvailability();
    const composerStatus = await checkComposerAvailability();
    
    socket.emit('status-update', {
      cursor: cursorStatus,
      composer: composerStatus
    });
  }, 5000);

  // Recebe comandos do cliente
  socket.on('execute-command', async (command: string) => {
    try {
      // Verifica se o Cursor está disponível
      const isCursorRunning = await checkCursorAvailability();
      if (!isCursorRunning) {
        throw new Error('O Cursor não está em execução. Por favor, abra o Cursor primeiro.');
      }

      console.log(`Executando comando: ${command}`);

      // Primeiro, ativa o Cursor e prepara o Composer
      const activated = await runAppleScript(activateScript);
      if (!activated) {
        throw new Error('Não foi possível ativar o Cursor ou o Composer');
      }

      // Agora envia o comando
      const sendCommandScript = `
tell application "System Events"
  keystroke "${command}"
  delay 0.1
  key code 36 -- Enter key
end tell
      `;

      const commandSent = await runAppleScript(sendCommandScript);
      if (!commandSent) {
        throw new Error('Não foi possível enviar o comando');
      }

      socket.emit('command-output', 'Comando enviado para o Composer');

    } catch (error: any) {
      console.error('Erro ao executar comando:', error);
      socket.emit('command-error', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
    clearInterval(statusInterval);
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 