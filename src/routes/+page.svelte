<script lang="ts">
  import { onMount } from 'svelte';
  import { io } from 'socket.io-client';
  import '../app.css';

  let socket: any;
  let command = '';
  let output = '';
  let messages: Array<{type: 'info' | 'command' | 'output' | 'error' | 'success'; text: string}> = [];
  let isConnected = false;
  let isLoading = false;
  let cursorAvailable = false;
  let composerAvailable = false;

  onMount(() => {
    socket = io('http://localhost:3000');

    socket.on('connect', () => {
      isConnected = true;
      console.log('Conectado ao servidor');
      addMessage('info', 'Conectado ao servidor Composer');
      announceStatus('Conectado ao servidor');
    });

    socket.on('disconnect', () => {
      isConnected = false;
      console.log('Desconectado do servidor');
      addMessage('error', 'Desconectado do servidor');
      announceStatus('Desconectado do servidor');
    });

    socket.on('status-update', (status: { cursor: boolean; composer: boolean }) => {
      cursorAvailable = status.cursor;
      composerAvailable = status.composer;
      
      const statusMessage = `Status: ${cursorAvailable ? 'Cursor disponível' : 'Cursor indisponível'}, ${composerAvailable ? 'Composer disponível' : 'Composer indisponível'}`;
      announceStatus(statusMessage);
    });

    socket.on('command-output', (data: string) => {
      const lines = data.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          addMessage('output', line);
          announceOutput(line);
        }
      }
    });

    socket.on('command-error', (data: string) => {
      addMessage('error', `Erro: ${data}`);
      announceError(data);
      isLoading = false;
    });

    socket.on('command-complete', (code: number) => {
      if (code === 0) {
        addMessage('success', 'Comando executado com sucesso');
      } else {
        addMessage('error', `Comando finalizado com erro (código ${code})`);
      }
      isLoading = false;
      announceStatus(`Comando finalizado com código ${code}`);
    });

    return () => {
      socket.disconnect();
    };
  });

  function addMessage(type: 'info' | 'command' | 'output' | 'error' | 'success', text: string) {
    if (type === 'command') {
      messages = [{type, text}, ...messages];
    } else {
      const commandIndex = messages.findIndex(m => m.type === 'command');
      if (commandIndex === -1) {
        messages = [{type, text}, ...messages];
      } else {
        messages = [
          ...messages.slice(0, commandIndex + 1),
          {type, text},
          ...messages.slice(commandIndex + 1)
        ];
      }
    }
  }

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
      addMessage('error', message);
      announceError(message);
      return;
    }

    if (!composerAvailable) {
      const message = 'O Composer não está disponível. Por favor, verifique a instalação.';
      addMessage('error', message);
      announceError(message);
      return;
    }
    
    isLoading = true;
    addMessage('command', `$ ${command}`);
    socket.emit('execute-command', command);
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
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-colors">
        <span class={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
        <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-neutral-900 rounded-box w-52 mt-2 border border-neutral-800">
        <li class="px-3 py-2">
          <div class="flex items-center justify-between">
            <span class="text-sm">Cursor</span>
            <span class={cursorAvailable ? 'text-green-400' : 'text-red-400'}>
              {cursorAvailable ? 'Disponível' : 'Indisponível'}
            </span>
          </div>
        </li>
        <li class="px-3 py-2">
          <div class="flex items-center justify-between">
            <span class="text-sm">Composer</span>
            <span class={composerAvailable ? 'text-green-400' : 'text-red-400'}>
              {composerAvailable ? 'Disponível' : 'Indisponível'}
            </span>
          </div>
        </li>
      </ul>
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
                  class="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/30"
                  on:keydown={(e) => e.key === 'Enter' && executeCommand()}
                />
                <button 
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-red-500/10 rounded-lg text-green-400 hover:bg-red-500/20 transition-colors"
                  on:click={executeCommand}
                  disabled={isLoading || !isConnected || !cursorAvailable || !composerAvailable}
                  title="Executar comando"
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
              <p class="mt-2 text-xs text-neutral-500">Se o comando não for executado, atualize a página ou verifique se o Cursor IDE está aberto</p>
            </div>
          </div>

          <!-- Output Section -->
          <div class="w-full md:w-1/2 p-6 flex flex-col">
            <h2 class="text-sm font-medium text-neutral-400 mb-4">Histórico Temporário</h2>
            <div 
              class="flex-1 bg-neutral-800 p-4 rounded-lg font-mono text-sm overflow-auto"
              role="log"
              aria-label="Histórico Temporário"
              aria-live="polite"
            >
              <div class="flex flex-col gap-2">
                {#each messages as message}
                  {#if message.type !== 'info' || message.text.indexOf('Status:') === -1}
                    <div class={`
                      py-1 px-2 rounded
                      ${message.type === 'info' ? 'text-red-400 bg-red-500/10' : ''}
                      ${message.type === 'command' ? 'text-yellow-400 bg-yellow-500/10 font-bold' : ''}
                      ${message.type === 'output' ? 'text-neutral-300' : ''}
                      ${message.type === 'error' ? 'text-red-400 bg-red-500/10' : ''}
                      ${message.type === 'success' ? 'text-red-400 bg-red-500/10' : ''}
                    `}>
                      {message.text}
                    </div>
                  {/if}
                {/each}
              </div>
            </div>
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
      rgba(239, 68, 68, 0.03),
      rgba(239, 68, 68, 0.06),
      rgba(239, 68, 68, 0.03),
      transparent
    );
    background-size: 200% 100%;
    animation: shimmer 8s ease-in-out infinite;
    pointer-events: none;
  }
</style>
