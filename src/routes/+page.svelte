<script lang="ts">
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  import '../app.css';

  let socket: any;
  let command = '';
  let output = '';
  let isConnected = false;
  let isLoading = false;
  let cursorAvailable = false;
  let composerAvailable = false;

  onMount(() => {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
      isConnected = true;
      console.log('Conectado ao servidor');
      output = 'Conectado ao servidor Composer\n';
      announceStatus('Conectado ao servidor');
    });

    socket.on('disconnect', () => {
      isConnected = false;
      console.log('Desconectado do servidor');
      output += 'Desconectado do servidor\n';
      announceStatus('Desconectado do servidor');
    });

    socket.on('status-update', (status: { cursor: boolean; composer: boolean }) => {
      cursorAvailable = status.cursor;
      composerAvailable = status.composer;
      
      const statusMessage = `Status: ${cursorAvailable ? 'Cursor disponível' : 'Cursor indisponível'}, ${composerAvailable ? 'Composer disponível' : 'Composer indisponível'}`;
      announceStatus(statusMessage);
    });

    socket.on('command-output', (data: string) => {
      output += data;
      scrollToBottom();
      announceOutput(data);
    });

    socket.on('command-error', (data: string) => {
      output += `Erro: ${data}\n`;
      scrollToBottom();
      announceError(data);
    });

    socket.on('command-complete', (code: number) => {
      output += `\nComando finalizado com código ${code}\n`;
      isLoading = false;
      scrollToBottom();
      announceStatus(`Comando finalizado com código ${code}`);
    });

    return () => {
      socket.disconnect();
    };
  });

  function announceStatus(message: string) {
    const statusElement = document.getElementById('status-announcer');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function announceOutput(message: string) {
    const outputElement = document.getElementById('output-announcer');
    if (outputElement) {
      outputElement.textContent = message;
    }
  }

  function announceError(message: string) {
    const errorElement = document.getElementById('error-announcer');
    if (errorElement) {
      errorElement.textContent = message;
    }
  }

  function scrollToBottom() {
    const pre = document.querySelector('pre');
    if (pre) {
      pre.scrollTop = pre.scrollHeight;
    }
  }

  async function executeCommand() {
    if (!command.trim()) return;
    
    if (!cursorAvailable) {
      const message = 'O Cursor não está disponível. Por favor, abra o Cursor primeiro.';
      announceError(message);
      output += `Erro: ${message}\n`;
      return;
    }

    if (!composerAvailable) {
      const message = 'O Composer não está disponível. Por favor, verifique a instalação.';
      announceError(message);
      output += `Erro: ${message}\n`;
      return;
    }
    
    isLoading = true;
    output += `\n$ ${command}\n\n`;
    socket.emit('execute-command', command);
    scrollToBottom();
    announceStatus(`Executando comando: ${command}`);
  }
</script>

<div class="flex flex-col min-h-screen bg-black text-white">
  <!-- Elementos para leitores de tela -->
  <div class="sr-only" role="status" aria-live="polite" id="status-announcer"></div>
  <div class="sr-only" role="status" aria-live="polite" id="output-announcer"></div>
  <div class="sr-only" role="alert" id="error-announcer"></div>

  <!-- Header -->
  <header class="flex items-center justify-between py-4 px-6 border-b border-neutral-800/50">
    <a href="/" class="text-2xl md:text-3xl font-medium">
      composer web
    </a>
    <div class="flex items-center gap-2">
      <div class="tooltip tooltip-bottom" data-tip="Status do Cursor">
        <span class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${cursorAvailable ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          Cursor: {cursorAvailable ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="Status do Composer">
        <span class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${composerAvailable ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          Composer: {composerAvailable ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="Status da Conexão">
        <span class={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${isConnected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
    </div>
  </header>

  <!-- Main -->
  <main class="flex-1 container mx-auto px-6 py-8">
    <div class="max-w-[1200px] mx-auto">
      <div class="glimmer-card bg-neutral-900 rounded-xl border border-neutral-800/80">
        <div class="flex flex-col md:flex-row h-auto md:h-[600px]">
          <!-- Input Section -->
          <div class="w-full md:w-1/2 md:border-r border-neutral-800 p-6 flex flex-col">
            <div class="mb-6">
              <label class="block text-sm font-medium text-neutral-400 mb-2">O que o Cursor deve fazer?</label>
              <div class="relative">
                <input
                  type="text"
                  bind:value={command}
                  placeholder="Descreva o que você quer construir..."
                  class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/30"
                  on:keydown={(e) => e.key === 'Enter' && executeCommand()}
                />
                <button 
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-green-500/10 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                  on:click={executeCommand}
                  disabled={isLoading || !isConnected || !cursorAvailable || !composerAvailable}
                >
                  {#if isLoading}
                    <span class="loading loading-spinner loading-sm"></span>
                  {:else}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
          </div>

          <!-- Output Section -->
          <div class="w-full md:w-1/2 p-6 flex flex-col">
            <h2 class="text-sm font-medium text-neutral-400 mb-4">Output</h2>
            <pre 
              class="flex-1 bg-neutral-800 p-4 rounded-lg font-mono text-sm text-neutral-300 overflow-auto whitespace-pre-wrap"
              role="log"
              aria-label="Saída do comando"
              aria-live="polite"
            >{output}</pre>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>

<style>
  @keyframes shimmer {
    0% { background-position: 0% 0; }
    100% { background-position: 200% 0; }
  }

  .glimmer-card {
    position: relative;
    overflow: hidden;
  }
  
  .glimmer-card::before {
    content: '';
    position: absolute;
    inset: -1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(236, 72, 153, 0.03),
      rgba(236, 72, 153, 0.06),
      rgba(236, 72, 153, 0.03),
      transparent
    );
    background-size: 200% 100%;
    animation: shimmer 8s ease-in-out infinite;
    pointer-events: none;
  }
</style>
