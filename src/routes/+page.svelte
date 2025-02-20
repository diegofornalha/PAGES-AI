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

<div class="min-h-screen bg-base-100">
  <!-- Elementos para leitores de tela -->
  <div class="sr-only" role="status" aria-live="polite" id="status-announcer"></div>
  <div class="sr-only" role="status" aria-live="polite" id="output-announcer"></div>
  <div class="sr-only" role="alert" id="error-announcer"></div>

  <header class="navbar bg-base-200 p-2 md:p-4" role="banner">
    <div class="flex-1">
      <a href="/" class="btn btn-ghost text-lg md:text-xl">Cursor Composer</a>
    </div>
    <div class="flex flex-col sm:flex-row gap-1 sm:gap-2">
      <div class="tooltip tooltip-bottom" data-tip="Status do Cursor">
        <span class={`badge badge-sm md:badge-md ${cursorAvailable ? 'badge-success' : 'badge-error'}`} role="status" aria-label="Status do Cursor">
          Cursor: {cursorAvailable ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="Status do Composer">
        <span class={`badge badge-sm md:badge-md ${composerAvailable ? 'badge-success' : 'badge-error'}`} role="status" aria-label="Status do Composer">
          Composer: {composerAvailable ? 'Disponível' : 'Indisponível'}
        </span>
      </div>
      <div class="tooltip tooltip-bottom" data-tip="Status da Conexão">
        <span class={`badge badge-sm md:badge-md ${isConnected ? 'badge-success' : 'badge-error'}`} role="status" aria-label="Status da Conexão">
          {isConnected ? 'Conectado' : 'Desconectado'}
        </span>
      </div>
    </div>
  </header>

  <main class="container mx-auto px-2 sm:px-4 py-2 sm:py-4" role="main">
    <div class="form-control w-full max-w-4xl mx-auto mb-2 sm:mb-4">
      <label for="command-input" class="sr-only">Digite um comando do Composer</label>
      <div class="flex gap-2">
        <input
          id="command-input"
          type="text"
          bind:value={command}
          placeholder="Digite um comando do Composer..."
          class="input input-bordered flex-1 text-sm sm:text-base min-w-0"
          on:keydown={(e) => e.key === 'Enter' && executeCommand()}
          aria-label="Campo de comando do Composer"
          aria-describedby="command-help"
        />
        <button 
          class="btn btn-success btn-sm sm:btn-md min-w-[100px] sm:min-w-[120px] font-semibold" 
          on:click={executeCommand}
          disabled={isLoading || !isConnected || !cursorAvailable || !composerAvailable}
          aria-busy={isLoading}
        >
          {#if isLoading}
            <span class="loading loading-spinner loading-sm sm:loading-md" aria-hidden="true"></span>
            <span class="hidden sm:inline">Executando...</span>
            <span class="sm:hidden">...</span>
          {:else}
            <span class="hidden sm:inline">Executar</span>
            <span class="sm:hidden">▶</span>
          {/if}
        </button>
      </div>
      <div id="command-help" class="sr-only">
        Pressione Enter para executar o comando
      </div>
    </div>

    <div class="card bg-base-200 shadow-xl max-w-4xl mx-auto">
      <div class="card-body p-2 sm:p-4">
        <h2 class="card-title text-lg sm:text-xl mb-2">Output</h2>
        <pre 
          class="bg-base-300 p-2 sm:p-4 rounded-lg whitespace-pre-wrap font-mono text-xs sm:text-sm overflow-auto max-h-[50vh] sm:max-h-[60vh]"
          role="log"
          aria-label="Saída do comando"
          aria-live="polite"
        >{output}</pre>
      </div>
    </div>
  </main>
</div>
