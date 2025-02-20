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

1. Inicie o Cursor Composer:
```bash
cd /
pnpm run dev
```

2. Em outro terminal, inicie a Landing Page:
```bash
cd landingpage
pnpm run dev
```

3. Abra o Cursor IDE e use o Cursor Composer em http://localhost:5173 para gerenciar sua Landing Page.

## Requisitos
- Node.js 20.x ou superior
- pnpm (recomendado) ou npm
- Cursor IDE instalado e configurado
