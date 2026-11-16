<div align="center">

# Devana

**Marketplace de Tecnologia & Workspace com Custódia em Garantia (Escrow), Rastreamento de Commits Git e Criptografia Ponta a Ponta**

[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=0B0F17)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=0B0F17)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[Visão Geral](#-visão-geral) •
[Funcionalidades](#-funcionalidades-principais) •
[Arquitetura](#-arquitetura--stack) •
[Segurança](#-segurança--criptografia) •
[Sustentabilidade](#-sustentabilidade--modelo-100-gratuito-no-core) •
[Executar com Docker](#-execução-em-produção-com-docker) •
[Desenvolvimento Local](#-desenvolvimento-local) •
[API REST & WebSocket](#-api-rest--websocket)

</div>

---

## 🎯 Visão Geral

O **Devana** é uma plataforma open source e full-stack para contratação de especialistas em engenharia de software, produto, dados e DevOps com **0% de comissão**, **fluxo de custódia financeira (Escrow)**, **workspace colaborativo em tempo real** e **arquitetura orientada à segurança desde o primeiro commit**.

> **Compromisso Open Core:** o núcleo do Devana é e sempre será gratuito — sem mensalidades obrigatórias, sem comissão sobre transações e sem features essenciais atrás de paywall. Login, publicação de projetos, propostas, workspace, escrow e avaliações funcionam integralmente sem custo.

Projetado para operar em produção sem dados simulados, todo o ciclo de vida — do cadastro real com verificação de e-mail à contratação atômica de propostas e registro auditável de horas vinculadas a commits Git — é persistido no **Cloud Firestore** com validação estrita por **Security Rules**, **WebSockets** e servidor **Express + Node 22** conteinerizado via **Docker**.

---

## ✨ Funcionalidades Principais

### 1. Landing Page & Marketplace em Tempo Real
- **Landing Page institucional e funcional**: busca direta de projetos e talentos, vitrine dinâmica de especialistas disponíveis, categorias técnicas e fluxo comparativo para **Clientes** e **Freelancers**.
- **Marketplace de Projetos & Talentos**: filtros em tempo real por categoria (`Backend & APIs`, `Frontend & UI`, `Cloud & DevOps`, `Dados & IA`, `Mobile`, `Segurança & Auditoria`), faixa de orçamento, status e busca textual.
- **Skeletons de Carregamento**: micro-interações com shimmer suaves durante a sincronização inicial com o Firestore.

### 2. Autenticação Real & Painel de Perfil Dual
- **Login & Cadastro Reais via Firebase Authentication**:
  - **Google OAuth 2.0** (`signInWithPopup`).
  - **E-mail & Senha** com validação de força mínima, confirmação de verificação por e-mail (`sendEmailVerification`) e redefinição de senha (`sendPasswordResetEmail`).
- **Perfil Dual (`client` | `freelancer`)**: cada usuário escolhe seu papel no cadastro ou atualiza no **Meu Painel & Perfil** (`UserDashboardPanel`), configurando bio, especialidade, valor/hora, handle do GitHub e disponibilidade para contratação.

### 3. Propostas Atômicas & Custódia Financeira (Escrow)
- **Publicação & Propostas (Bidding)**: clientes publicam escopos com orçamento fixo e prazo; profissionais autenticados enviam propostas detalhadas.
- **Contratação Atômica via `writeBatch`**: ao aceitar uma proposta, o projeto é atribuído ao profissional, a garantia (`funded`) é ativada e as demais propostas pendentes são encerradas atomicamente no Firestore.
- **Liberação & Avaliação Mútua**: fluxo em 3 etapas (*Contratação → Garantia Retida → 100% Liberado*) seguido de avaliação verificada (Nota Geral, Qualidade de Código e Comunicação).

### 4. Workspace Técnico & Diário de Trabalho
- **Cronômetro Integrado & Worklogs Auditáveis**: registro de horas trabalhadas associadas a branch e commit hash.
- **Integração com API do GitHub**: importação sanitizada dos últimos commits públicos do repositório vinculado ao projeto (`GET /api/github/commits`).
- **Chat em Tempo Real & Presença Online**: mensagens persistidas no Firestore combinadas com presença ao vivo, indicador de digitação e alertas via servidor **WebSocket (`/ws`)**.

### 5. Relatórios Auditáveis, Backup Criptografado & Cofre PII
- **Exportação PDF & CSV**: geração local de relatórios com **jsPDF** e planilhas CSV incluindo checksum **SHA-256**.
- **Backup Criptografado AES-256-GCM (`.devana.enc`)**: derivação de chave PBKDF2 + cifra autenticada AES-256-GCM no navegador antes da sincronização com o servidor Express, que calcula assinatura **HMAC-SHA256** e persiste em volume Docker (`DATA_DIR`).
- **Cofre de PII Isolado & Magic Bytes**: dados pessoais sensíveis cifrados no cliente e armazenados em subcoleção privada (`/users/{uid}/private/settings`), além de inspeção binária de cabeçalhos de upload (`PDF`, `PNG`, `JPEG`, `CSV`) contra arquivos executáveis renomeados.

---

## 🏗 Arquitetura & Stack

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         Frontend (React 19 + Vite)                       │
│  Tailwind CSS v4 · Motion · Lucide Icons · Web Crypto API · jsPDF        │
└───────────────────────────────┬──────────────────────┬───────────────────┘
                                │                      │
               Firebase SDK     │                      │ HTTP + Bearer ID Token
          (Auth + OnSnapshot)   │                      │ WebSocket (/ws)
                                ▼                      ▼
┌────────────────────────────────────┐   ┌─────────────────────────────────┐
│        Google Cloud Firebase       │   │   Express + Node 22 Server      │
│  • Firebase Auth (Google / Email)  │   │  • Validação JWT Firebase REST  │
│  • Cloud Firestore (Rules + Batch) │   │  • Zod .strict() + Rate Limit   │
└────────────────────────────────────┘   │  • GitHub Proxy & Magic Bytes   │
                                         │  • Cofre em Disco (DATA_DIR)    │
                                         └─────────────────────────────────┘
```

### Estrutura do Repositório

```text
devana/
├── .github/workflows/ci.yml         # Pipeline CI (Lint, Rules, Typecheck, Testes, Bundle Budget)
├── e2e/devana.spec.ts               # Testes End-to-End (Playwright) dos 5 fluxos críticos
├── scripts/check-bundle-budget.mjs  # Validação automática de orçamento JS inicial (< 200 KB gzip)
├── src/
│   ├── assets/images/               # Ativos WebP responsivos (128/256/640/1200px) + fallback JPG
│   ├── components/
│   │   ├── layout/AppShell.tsx      # App Shell responsivo (Sidebar colapsável + Bottom Nav)
│   │   ├── ui/                      # Biblioteca de design system acessível WCAG 2.2 AA
│   │   ├── AuthGatePanel.tsx        # Login, registro, verificação de e-mail e reset
│   │   ├── LandingPage.tsx          # Página inicial institucional com busca direta
│   │   ├── ProjectCardSkeleton.tsx  # Micro-interações de carregamento (shimmer)
│   │   └── UserDashboardPanel.tsx   # Painel autenticado (Bento Grid) e editor de perfil dual
│   ├── features/                    # Domínios modulares (auth, projects, proposals, escrow, chat, profile, reports, security)
│   ├── hooks/                       # Hooks globais (useAuth, useProjects, useEscrow, useRealtime, useToast)
│   ├── lib/                         # apiClient centralizado, formatters, validators e constantes
│   ├── routes/                      # Roteamento SPA com React.lazy, Suspense e ErrorBoundary
│   ├── server/                      # Backend Express em camadas (config, app, logger, middlewares, repositories, routes, services, ws)
│   ├── styles/tokens.css            # Design tokens semânticos (light/dark, escala 1.125, motion)
│   ├── types/domain.ts              # Tipos de domínio + resolução de imagens WebP responsivas
│   ├── utils/                       # Exportação PDF (jsPDF lazy) / CSV, cofre offline e Web Crypto
│   └── App.tsx                      # Orquestrador SPA enxuto
├── server.ts                        # Entrypoint Express + WebSockets (/ws) + Vite/SPA com Cache-Control
├── firestore.rules                  # Regras RBAC + subcoleção append-only escrow_ledger
├── firestore.rules.test.ts          # Testes executáveis das regras com @firebase/rules-unit-testing
├── vitest.config.ts                 # Configuração Vitest (jsdom + API + Security Rules)
├── playwright.config.ts             # Configuração Playwright E2E
├── Dockerfile                       # Build multi-stage otimizado (node:22-alpine)
└── docker-compose.yml               # Orquestração com volume persistente e healthcheck
```

---

## 🔒 Segurança & Criptografia

O Devana segue uma postura defensiva rigorosa tanto no cliente quanto no servidor:

- **Firestore Security Rules (`firestore.rules`)**:
  - Exige `request.auth != null && request.auth.token.email_verified == true` para qualquer operação de escrita e restringe leitura privada de `bids`, `worklogs` e `messages` aos participantes do projeto.
  - Inclui subcoleção imutável `escrow_ledger` (append-only) com comissão travada em `0` e estados auditáveis (`pending`, `in_escrow`, `released`, `refunded`).
  - Valida estritamente tipos, limites de tamanho e campos permitidos via `hasOnly()` e é auditada com `@firebase/eslint-plugin-security-rules` + suíte executável em `firestore.rules.test.ts`.
- **Autenticação & WebSocket no Backend (`src/server/`)**:
  - Rotas protegidas e handshake `/ws` exigem Firebase ID Token (`emailVerified === true`), validação de origem (`Origin`) e autorização na sala via Firestore REST.
  - Logging estruturado com **Pino** (`X-Request-Id` e redaction de `authorization`, tokens e PII).
- **Proteção HTTP & Abuso**:
  - **Helmet** (CSP estrita compatível com Firebase Auth/Google Fonts, HSTS, `COOP: same-origin-allow-popups`) e **CORS** com whitelist explícita por `ALLOWED_ORIGINS`.
  - Rate limiting global por IP (`90 req/min`), estrito em rotas sensíveis (`12 req/min`) e por conexão WebSocket com heartbeat e timeout de inatividade.
  - Schemas **Zod `.strict()`** em todas as entradas JSON com respostas de erro padronizadas `{ error: { code, message, nextStep?, details? } }`.

---

## 🐳 Execução em Produção com Docker

O projeto está preparado com build multi-stage em `node:22-alpine` (usuário não-root `node`, compilação de assets estáticos pelo Vite, execução nativa de TypeScript no Node 22, healthcheck automático e persistência em volume).

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose v2+

### Subindo com Docker Compose (Recomendado)

1. Crie um arquivo `.env` a partir do modelo:
   ```bash
   cp .env.example .env
   ```
   Opcionalmente, defina uma chave forte para `BACKUP_HMAC_KEY`:
   ```bash
   openssl rand -hex 32
   ```

2. Construa e inicie o contêiner em segundo plano:
   ```bash
   docker compose up -d --build
   ```

3. Verifique o status e o healthcheck:
   ```bash
   docker compose ps
   curl http://localhost:3000/api/health
   ```

4. Acesse a aplicação em **[http://localhost:3000](http://localhost:3000)**.

> **Persistência**: backups sincronizados e webhooks registrados no backend são gravados em `/app/data` dentro do contêiner, mapeado para o volume nomeado `devana_data`.

### Build Manual com `docker build`

```bash
docker build -t devana-web:latest .

docker run -d \
  --name devana-web \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e BACKUP_HMAC_KEY="$(openssl rand -hex 32)" \
  -v devana_data:/app/data \
  devana-web:latest
```

---

## 💻 Desenvolvimento Local

### Pré-requisitos
- **Node.js 22+** (`node -v`)
- Projeto Firebase próprio configurado localmente via `.env` (`VITE_FIREBASE_*` / `FIREBASE_*`) ou cópia local de `firebase-applet-config.example.json` (ignorado pelo Git)

### Instalação e Execução

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente (e opcionalmente o arquivo local do Firebase):
   ```bash
   cp .env.example .env
   cp firebase-applet-config.example.json firebase-applet-config.json
   ```
   > **Segurança:** nunca versione `firebase-applet-config.json` nem `.env` em repositórios públicos (ambos estão no `.gitignore`). Em produção, restrinja sua Web API Key por **HTTP referrers** no Google Cloud Console.

3. Inicie o servidor unificado (Express + Vite HMR middleware + WebSocket) na porta `3000`:
   ```bash
   npm run dev
   ```

4. Scripts úteis:
   ```bash
   npm run lint              # Verificação TypeScript estrita (strict: true, tsc --noEmit)
   npm run lint:code         # ESLint (TypeScript + React Hooks, zero warnings no lint-staged)
   npm run lint:rules        # Auditoria estática das regras do Firestore
   npm run format:check      # Verificação de formatação (Prettier)
   npm test                  # Suíte Vitest (UI, Hooks, Supertest API e Security Rules)
   npx playwright install chromium # (1ª vez) instala navegador para os testes E2E
   npm run test:e2e          # Testes E2E com Playwright (5 fluxos críticos)
   npm run build:budget      # Build Vite + validação de orçamento JS (< 200 KB gzip)
   npm start                 # Inicia servidor em modo produção (node server.ts)
   ```

### Configuração do Firebase Authentication
Para habilitar todos os fluxos de autenticação no seu projeto Firebase:
1. Acesse **Firebase Console → Authentication → Sign-in method**.
2. Certifique-se de que os provedores **Google** e **E-mail/Senha** (`Email/Password`) estejam ativados.
3. Adicione o domínio da sua hospedagem (ex.: `localhost` ou domínio customizado) em **Authorized domains**.

---

## 📡 API REST & WebSocket

| Método | Rota | Autenticação | Descrição |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | Pública | Healthcheck de prontidão e uptime (usado pelo Docker) |
| `GET` | `/api/security/posture` | Pública | Metadados públicos da postura de segurança e taxa `0%` |
| `GET` | `/api/github/commits?repo=owner/repo` | Pública | Proxy sanitizado dos últimos 5 commits públicos no GitHub |
| `POST` | `/api/escrow/ledger` | Bearer (Participante) | Registra transição idempotente de custódia (`pending`, `in_escrow`, `released`, `refunded`) |
| `GET` | `/api/escrow/ledger/:projectId` | Bearer (Participante) | Consulta histórico append-only de transações Escrow do projeto |
| `POST` | `/api/reports/share-email` | Bearer (Verificado) | Despacho de relatório com validação de checksum SHA-256 |
| `POST` | `/api/backups/cloud-sync` | Bearer (Verificado) | Persistência de pacote cifrado AES-256-GCM com HMAC-SHA256 |
| `GET` | `/api/backups/cloud-sync/:ownerUid` | Bearer (Dono) | Lista metadados dos backups armazenados pelo usuário |
| `POST` | `/api/security/verify-upload` | Bearer (Verificado) | Verificação binária (Magic Numbers) de arquivos PDF/PNG/JPEG/CSV |
| `GET` / `POST` | `/api/integrations/webhooks` | Bearer (Verificado) | Consulta e registro de webhooks por usuário autenticado |
| `WS` | `/ws` | Firebase ID Token | Presença em tempo real, indicador de digitação e alertas por sala |

---

## 💚 Sustentabilidade & Modelo 100% Gratuito no Core

Para manter infraestrutura, moderação e evolução contínua **sem nunca cobrar comissão ou bloquear o acesso**, o Devana adota um modelo de monetização transparente focado em **visibilidade opcional, conveniência e eficiência** (detalhado no [Roadmap de Monetização Sustentável](./roadmap-devana-future-upgrades.md)).

### Guardrails Invioláveis

- **Acesso gratuito permanente:** cadastro, publicação de projetos, envio de propostas, chat/workspace, escrow e avaliações nunca exigirão pagamento.
- **Zero comissão:** `100%` do valor acordado entre cliente e freelancer pertence integralmente às partes.
- **Sem assinatura obrigatória nem dark patterns:** nada de "plano pro" para liberar o básico, contadores falsos ou bloqueios artificiais.
- **Privacidade preservada:** dados pessoais de usuários nunca são vendidos e não há rastreamento comportamental invasivo entre sites.

### Pilares Planejados de Receita

1. **Destaques & Impulsos (com cota gratuita mensal):** toda conta verificada recebe **2 impulsos gratuitos por mês** para destacar projetos, perfis ou propostas; pacotes pontuais opcionais atendem quem desejar visibilidade adicional sem recorrência.
2. **Publicidade Contextual & Patrocínios:** patrocínios de categoria e recomendações curadas de ferramentas, sempre claramente sinalizados (*Patrocinado* / *Parceiro*), limitados a no máximo 1 espaço por viewport e sem pop-ups.
3. **Serviços de Valor Agregado (opcionais):** ferramentas de produtividade via créditos pontuais (ex.: apoio de IA para redação de propostas, relatórios analíticos avançados e integrações externas opt-in).
4. **Float do Escrow *(etapa futura com compliance bancário)*:** rendimento financeiro sobre saldo mantido em custódia segregada durante a execução do contrato, mantendo **0% de desconto** no repasse ao profissional.
5. **Afiliados & Parcerias:** indicações transparentes de ferramentas técnicas, hospedagem e educação alinhadas ao ecossistema dev.

> **Transparência Pública:** todas as fontes de receita e percentuais serão listados publicamente na página `/transparencia` e mantidos abertos neste repositório.

---

## 🤝 Contribuição (Open Source)

O Devana é um projeto aberto à comunidade. Contribuições são muito bem-vindas tanto no código quanto na evolução sustentável da plataforma:

1. Faça um fork do repositório e crie sua branch a partir da `main`.
2. Valide suas alterações localmente antes de abrir o Pull Request:
   ```bash
   npm run format:check && npm run lint:code && npm run lint:rules && npm run lint && npm test && npm run build:budget
   ```
3. Abra uma **Issue** ou **Pull Request** com melhorias de código, segurança, acessibilidade ou sugestões para o [Roadmap de Monetização Sustentável](./roadmap-devana-future-upgrades.md).

---

<div align="center">

Construído com foco em engenharia limpa, segurança verificável, transparência e experiência minimalista.

</div>
