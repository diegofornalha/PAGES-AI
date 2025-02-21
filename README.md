# PAGES AI

Este é um projeto composto por duas aplicações:

## 1. Cursor Composer (Svelte)
Interface de controle para execução de comandos do Composer através do Cursor IDE.

### Tecnologias
- SvelteKit
- Socket.IO
- TailwindCSS
- DaisyUI

### Porta
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Comandos
```bash
# Instalar dependências
pnpm install

# Iniciar em modo desenvolvimento
pnpm run dev

# Construir para produção
pnpm run build
```

## 2. Landing Page (React/Next.js)
Landing page gerenciada através do Cursor Composer.

### Tecnologias
- Next.js
- React
- TailwindCSS

### Porta
- http://localhost:3000

### Comandos
```bash
# Instalar dependências
npm install
# ou
yarn install
# ou
pnpm install

# Iniciar em modo desenvolvimento
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

## Estrutura do Projeto
```
/
├── src/                    # Código fonte do Cursor Composer (Svelte)
│   ├── routes/            # Rotas do SvelteKit
│   ├── server/            # Servidor Socket.IO
│   └── app.css           # Estilos globais
│
└── landingpage/           # Código fonte da Landing Page (React)
    ├── app/              # Rotas e componentes Next.js
    ├── components/       # Componentes React
    └── public/          # Arquivos estáticos
```

## Como Usar

1. Certifique-se que o Cursor IDE está aberto e em foco antes de iniciar.

2. Inicie todo o ambiente de desenvolvimento com um único comando:
```bash
pnpm run start
```
Este comando irá:
- Iniciar o frontend Svelte na porta 5173
- Iniciar o servidor Socket.IO na porta 3000
- Executar ambos em paralelo

3. Acesse o Cursor Composer em http://localhost:5173

### Solução de Problemas

Se você ver a mensagem "O Cursor não está disponível":

1. Verifique se o Cursor IDE está:
   - Instalado corretamente
   - Aberto e em foco
   - Rodando sem erros

2. Tente as seguintes soluções:
   - Atualize a página do Composer IDE (http://localhost:5173)
   - Reinicie o servidor com `pnpm run start`
   - Verifique se não há outros processos usando as portas 3000 ou 5173

3. Para verificar se os serviços estão rodando corretamente:
```bash
# Verificar portas em uso
lsof -i :5173,3000
```

### Testando a Instalação

Para verificar se tudo está funcionando:
1. Abra o Cursor Composer (http://localhost:5173)
2. Digite um comando simples como "criar um arquivo teste.txt"
3. O sistema deve reconhecer o Cursor e executar o comando

## Requisitos
- Node.js 20.x ou superior
- pnpm (recomendado) ou npm
- Cursor IDE instalado e configurado
