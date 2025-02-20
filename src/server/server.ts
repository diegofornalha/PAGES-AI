import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { watch } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

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

tell application "System Events"
  tell process "Cursor"
    set frontmost to true
    delay 0.1
    keystroke "/" using command down
    delay 0.1
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

// Monitora mudanças no diretório do Cursor
function watchCursorOutput(socket: any) {
  const cursorDir = join(homedir(), 'Library/Application Support/Cursor/Session Logs');
  
  try {
    const watcher = watch(cursorDir, { recursive: true }, async (eventType, filename) => {
      if (filename && filename.endsWith('.log')) {
        // Lê o conteúdo do arquivo de log em tempo real
        const logPath = join(cursorDir, filename);
        const tailProcess = spawn('tail', ['-f', logPath]);

        tailProcess.stdout.on('data', (data: Buffer) => {
          const lines = data.toString().split('\n');
          lines.forEach((line: string) => {
            if (line.trim()) {
              socket.emit('command-output', line);
            }
          });
        });

        socket.on('disconnect', () => {
          tailProcess.kill();
        });
      }
    });

    socket.on('disconnect', () => {
      watcher.close();
    });
  } catch (error) {
    console.error('Erro ao monitorar diretório do Cursor:', error);
  }
}

// Gerenciamento de conexões WebSocket
io.on('connection', async (socket) => {
  console.log('Cliente conectado');

  // Verifica status inicial
  const initialStatus = {
    cursor: await checkCursorAvailability(),
    composer: true
  };
  socket.emit('status-update', initialStatus);

  // Configura intervalo para verificar status
  const statusInterval = setInterval(async () => {
    const status = {
      cursor: await checkCursorAvailability(),
      composer: true
    };
    socket.emit('status-update', status);
  }, 5000);

  socket.on('execute-command', async (command: string) => {
    try {
      // Verifica se o Cursor está disponível
      const isCursorRunning = await checkCursorAvailability();
      if (!isCursorRunning) {
        throw new Error('O Cursor não está em execução. Por favor, abra o Cursor primeiro.');
      }

      console.log(`Executando comando: ${command}`);

      // Ativa o Cursor com retry
      let activated = false;
      for (let i = 0; i < 3; i++) {
        activated = await runAppleScript(activateScript);
        if (activated) break;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!activated) {
        throw new Error('Não foi possível ativar o Cursor. Por favor, tente novamente ou reinicie a aplicação.');
      }

      // Pequeno delay para garantir que o Cursor está pronto
      await new Promise(resolve => setTimeout(resolve, 300));

      // Envia o comando com escape characters
      const escapedCommand = command.replace(/["\\]/g, '\\$&');
      const sendCommandScript = `
tell application "System Events"
  tell process "Cursor"
    delay 0.1
    keystroke "${escapedCommand}"
    delay 0.1
    key code 36 -- Enter key
  end tell
end tell`;

      const commandSent = await runAppleScript(sendCommandScript);
      if (!commandSent) {
        throw new Error('Não foi possível enviar o comando. Por favor, verifique se o Cursor está respondendo.');
      }

      // Emite o output
      socket.emit('command-output', 'Comando enviado para o Composer');
      socket.emit('command-complete', 0);

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