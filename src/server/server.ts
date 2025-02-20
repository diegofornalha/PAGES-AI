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

delay 1

tell application "System Events"
  tell process "Cursor"
    -- Garante que o Cursor está em primeiro plano
    set frontmost to true
    delay 0.5
    
    -- Abre o Composer usando Command+/
    keystroke "/" using command down
    delay 1
  end tell
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
  tell process "Cursor"
    delay 0.5
    -- Envia o comando
    keystroke "${command}"
    delay 0.5
    key code 36 -- Enter key
    delay 0.5
  end tell
end tell
      `;

      const commandSent = await runAppleScript(sendCommandScript);
      if (!commandSent) {
        throw new Error('Não foi possível enviar o comando');
      }

      socket.emit('command-output', 'Comando enviado para o Composer');
      
      // Aguarda a resposta do Composer
      let checkInterval = setInterval(async () => {
        const composerStatus = await checkComposerAvailability();
        if (!composerStatus) {
          clearInterval(checkInterval);
          socket.emit('command-complete', 0);
        }
      }, 1000);

      // Timeout após 30 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        socket.emit('command-complete', 0);
      }, 30000);

    } catch (error: any) {
      console.error('Erro ao executar comando:', error);
      socket.emit('command-error', error.message);
      socket.emit('command-complete', 1);
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