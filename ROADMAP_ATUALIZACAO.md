# Roadmap & Auditoria Técnica — Evolução Devana

> Documento vivo de acompanhamento incremental do projeto **Devana**. Cada fase será executada em PRs pequenos, focados e validados com `lint` + `typecheck` + testes + `build` antes de avançar para a etapa seguinte.

---

## Status Geral das Fases

| Fase | Escopo | Status | Critério de Saída |
| :--- | :--- | :---: | :--- |
| **Fase 1** | Auditoria técnica, riscos, gargalos, design system proposto e roadmap | ✅ Concluída e Aprovada | Auditoria real documentada + aprovação do Design System e Roadmap |
| **P0** | Lockfile `package-lock.json`, Auth/AuthZ no WebSocket `/ws`, fechamento de leitura cross-user no `firestore.rules` | ✅ Concluído | Build Docker destravado, `/ws` autenticado, `firestore.rules` implantado |
| **Fase 2** | Design System (`tokens.css` + `src/components/ui/`) & UI/UX Premium | ✅ Concluída (PR-2.1 a PR-2.5) | Tokens, biblioteca `ui/`, App Shell responsivo, WCAG 2.2 AA |
| **Fase 3** | Refatoração arquitetural (Frontend modular + Backend em camadas) | ✅ Concluída (PR-3.1 a PR-3.4) | `App.tsx` < 250 linhas, `server.ts` modular, HTTP client centralizado |
| **Fase 4** | Hardening de Segurança (Helmet/CSP, CORS, Pino, Ledger Escrow, Rules Unit Tests) | ✅ Concluída (PR-4.1 a PR-4.5) | Helmet/CORS/Pino ativos, `escrow_ledger` append-only, Rules validadas e implantadas |
| **Fase 5** | Performance, Bundle Budget (< 200 KB gzip), Vitest + Playwright + CI | ✅ Concluída (PR-5.1 a PR-5.5) | Entry `22.81 KB gzip` (`142.28 KB gzip` núcleo), imagens `-89%`, strict TS + CI |
| **Fase 6** | Entregáveis contínuos (PRs descritivos, CHANGELOG e documentação) | ✅ Concluída | Todos os PRs documentados e `README.md` / `CHANGELOG.md` sincronizados |

---

# FASE 1 — AUDITORIA COMPLETA, DESIGN SYSTEM PROPOSTO & ROADMAP

## 1. Mapeamento da Estrutura Atual

### 1.1 Árvore de Arquivos do Repositório

```text
.
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── bun.lock
├── docker-compose.yml
├── eslint.config.mjs
├── firebase-applet-config.json
├── firebase-blueprint.json
├── firestore.rules
├── firestore.rules.test.ts
├── index.html
├── metadata.json
├── package.json
├── security_spec.md
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx
    ├── firebase.ts
    ├── index.css
    ├── main.tsx
    ├── assets/images/
    │   ├── avatar_client_1_1794833038783.jpg
    │   ├── avatar_engineer_1_1794833036312.jpg
    │   ├── avatar_engineer_2_1794833038277.jpg
    │   └── hero_workspace_visual_1794833040014.jpg
    ├── components/
    │   ├── AuthGatePanel.tsx
    │   ├── LandingPage.tsx
    │   ├── ProjectCardSkeleton.tsx
    │   └── UserDashboardPanel.tsx
    ├── types/
    │   └── domain.ts
    └── utils/
        ├── exportReports.ts
        ├── offlineVault.ts
        └── securityCrypto.ts
```

### 1.2 Arquivos Acima de 300 Linhas (Dívida de Modularização)

| Arquivo | Linhas | Tamanho | Diagnóstico |
| :--- | ---: | ---: | :--- |
| `src/App.tsx` | **4.711** | **204 KB** | Monólito crítico: concentra estado global, listeners Firestore, WebSocket, modais, formulários, regras de negócio e 6 telas completas. |
| `src/components/LandingPage.tsx` | **870** | **39 KB** | Seções da landing page acopladas em um único arquivo sem subcomponentes de seção. |
| `server.ts` | **764** | **24 KB** | Mistura configuração, middlewares de segurança, validação Zod, persistência em arquivo, rotas REST e servidor WebSocket. |
| `src/components/UserDashboardPanel.tsx` | **757** | **34 KB** | Combina layout do painel, editor de perfil, pré-visualização ao vivo, listagens de projetos/bids e alertas de verificação. |
| `src/components/AuthGatePanel.tsx` | **523** | **19 KB** | Fluxos de login, cadastro, recuperação de senha, verificação de e-mail e UI acoplados sem camada `features/auth`. |
| `firestore.rules` | **480** | **23 KB** | Bem estruturado pelos 8 pilares, mas com lacunas de escopo em subcoleções e ausência de coleção `escrow_ledger`. |

### 1.3 Auditoria de Dependências (`package.json`)

- **Redundantes / Não utilizadas em código**:
  - `autoprefixer` (`^10.4.21`) em `devDependencies`: redundante com `@tailwindcss/vite` v4 (Lightning CSS já aplica vendor prefixes nativamente).
  - `@google/genai` (`^2.4.0`) em `dependencies`: **0 importações** encontradas em `src/` e `server.ts` (pesa no bundle/instalação sem uso real — avaliar remoção ou manter apenas se feature de IA server-side for planejada).
- **Classificação incorreta (`dependencies` vs `devDependencies`)**:
  - `eslint`, `@firebase/eslint-plugin-security-rules`, `@types/ws`, `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite` estão em `dependencies` em vez de `devDependencies`. Movê-las enxuga significativamente `npm ci --omit=dev` na imagem Docker final.
- **Inconsistência de Lockfile (Risco de Build Docker)**:
  - O repositório possui `bun.lock`, mas **não possui `package-lock.json`**. O `Dockerfile` atual copia `package-lock.json` e executa `npm ci`, o que falhará em build limpo fora do sandbox enquanto `package-lock.json` não for gerado e versionado.
- **Pacotes ausentes necessários nas próximas fases**:
  - Fase 3/4: `helmet`, `cors`, `@types/cors`, `pino`, `pino-http`.
  - Fase 5: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `supertest`, `@types/supertest`, `@playwright/test`, `@firebase/rules-unit-testing`, `prettier`, `husky`, `lint-staged`.
  - *Nota*: `motion`, `lucide-react`, `jspdf`, `zod`, `express`, `ws` já estão instalados e serão reaproveitados sem inflar dependências desnecessárias.

---

## 2. Auditoria de Riscos de Segurança

| Área | Severidade | Achado Atual no Código | Ação Recomendada (Fase 4) |
| :--- | :---: | :--- | :--- |
| **WebSocket `/ws`** | **CRÍTICA** | Handshake aceita qualquer conexão sem token; qualquer cliente pode enviar `room:join` com qualquer `userId`/`userName`, emitir `notification:emit` ou `chat:typing` para qualquer `roomId`, sem verificação de participação no projeto, sem timeout de inatividade e sem rate limit por conexão. | Exigir Firebase ID Token na query/subprotocol do handshake, validar assinatura no boot da conexão, autorizar entrada na sala consultando vínculo com o projeto, aplicar heartbeat + timeout de inatividade (ex.: 5 min) e rate limit por socket. |
| **Firestore Rules (Subcoleções)** | **ALTA** | Em `firestore.rules` (linhas 381–464), `bids`, `worklogs`, `messages` e `reviews` permitem `get`/`list` para **qualquer `isSignedIn()`** que informe `projectId`, expondo propostas privadas, mensagens de chat e worklogs a usuários externos ao projeto. | Restringir `bids` (dono do projeto ou autor da proposta), `worklogs` e `messages` (apenas `ownerId` ou `assignedFreelancerId` do projeto). Manter `reviews` legível publicamente apenas para reputação se desejado. |
| **Testes de Firestore Rules** | **ALTA** | `firestore.rules.test.ts` contém apenas um array TypeScript estático (`DIRTY_DOZEN_SCENARIOS`) — **nenhum teste executável** roda contra o emulador Firebase. | Reescrever `firestore.rules.test.ts` com `@firebase/rules-unit-testing` + Vitest cobrindo casos positivos e negativos em todas as coleções e subcoleções. |
| **Escrow Sem Ledger Auditável** | **ALTA** | O estado de custódia (`unfunded → funded → released`) é atualizado diretamente pelo cliente no documento `/projects/{id}`, sem trilha append-only imutável, sem estado `refunded` e sem chave de idempotência. | Criar subcoleção/coleção `escrow_ledger` append-only (imutável nas Rules), mover transições críticas para endpoints server-side idempotentes (`pending → in_escrow → released → refunded`). |
| **Headers HTTP & CORS** | **MÉDIA** | `server.ts` define headers manuais sem `Content-Security-Policy` (CSP), sem `X-Frame-Options` / `frame-ancestors`, sem `Cross-Origin-Opener-Policy` e sem middleware `cors` com whitelist explícita. | Adotar `helmet` com CSP compatível com Google Fonts/Firebase Auth (`COOP: same-origin-allow-popups` para `signInWithPopup` + política de frame configurável via env para preview/produção) e `cors` com whitelist estrita por `ALLOWED_ORIGINS`. |
| **Rate Limit & Escalabilidade** | **MÉDIA** | `ipRateLimits` e `authRateLimits` usam `Map` em memória sem TTL de limpeza (risco de crescimento de memória sob flood de IPs) e não compartilham estado entre múltiplas instâncias. | Adicionar limpeza periódica / TTL + suporte plugável a store Redis (`REDIS_URL` opcional com fallback seguro em memória com LRU/teto máximo). |
| **Secrets & `.gitignore`** | **MÉDIA** | `.gitignore` não bloqueia `*serviceAccount*`, `*-adminsdk-*.json`, `data/` nem `firebase-applet-config.json` (caso o repositório passe a usar envs no build em vez de JSON fixo). | Atualizar `.gitignore` bloqueando credenciais de serviço, `data/`, `.env*` e documentar estratégia segura para config Firebase. |
| **Logs & Observabilidade** | **BAIXA/MÉDIA** | `server.ts` usa `console.log`/`warn`/`error` sem estrutura JSON nem `requestId`. | Substituir por `pino` + `pino-http` com `redact` explícito para headers `authorization`, tokens e PII, além de `X-Request-Id`. |
| **Validação de Outputs & Upload** | **BAIXA** | Chat usa texto puro em JSX (React escapa por padrão, bom) e CSV previne formula injection; upload atual valida apenas magic bytes via JSON sem storage externo real. | Garantir sanitização estrita caso algum campo suporte Markdown no futuro; isolar uploads reais para bucket externo (Firebase Storage / S3) com URL assinada. |

---

## 3. Auditoria de Gargalos de Performance

Medições coletadas diretamente do build atual (`dist/assets/`):

| Artefato / Área | Medição Atual | Orçamento Alvo | Causa Raiz Identificada |
| :--- | :--- | :--- | :--- |
| **JS Inicial (`index-*.js`)** | **3.28 MB raw / 714.18 KB gzip** | **< 200 KB gzip** | `App.tsx` importa sincronamente todas as 6 views, modais, `firebase/firestore`, `motion`, `lucide-react` e utilitários de relatório sem `React.lazy` nem `manualChunks`. |
| **Chunks de Exportação (`html2canvas`, `index.es`, `purify.es`)** | **733 KB raw / 155.3 KB gzip** somados | **0 KB no boot** (on-demand) | `exportReports.ts` importa `jsPDF` no topo e é importado estaticamente por `App.tsx`, puxando dependências de PDF/DOM purification já no bundle inicial. |
| **Imagens (`src/assets/images/`)** | **2.61 MB** (4 `.jpg` de 568 KB a 747 KB) | **< 250 KB total** | Avatares renderizados em `40px–96px` usam JPEGs gigantes sem redimensionamento, WebP/AVIF, `srcset` ou `loading="lazy"`. |
| **Re-renders Globais** | Todo o `App.tsx` (4.711 linhas) re-renderiza | Isolado por feature | Timer do Workroom (`setInterval` de 1s), filtros, formulários e 4 listeners `onSnapshot` vivem todos no componente raiz. |
| **CSS (`index-*.css`)** | **75.2 KB raw / 11.07 KB gzip** | < 20 KB gzip | Tamanho saudável graças ao Tailwind v4, porém sem camada semântica de tokens centralizada. |
| **Tipografia (`index.html`)** | 3 famílias Google Fonts | Máx. 2 + 1 mono com `display=swap` | Sem `<link rel="preload">` para fontes críticas e sem subsetting otimizado. |
| **Cache HTTP & Compressão** | `express.static(distPath)` padrão | Cache imutável em `/assets` | Assets com hash do Vite (`dist/assets/*`) são servidos sem `Cache-Control: public, max-age=31536000, immutable`. |

---

## 4. Design System Mínimo Viável Proposto (Pré-visualização para Aprovação)

### 4.1 Direção Visual
Inspiração estrutural em **Linear, Stripe e Vercel**: superfícies limpas com contraste nítido por borda de `1px`, hierarquia tipográfica clara, numerais tabulares obrigatórios em valores financeiros (`R$`) e métricas de tempo/commits, eliminação de "cartões dentro de cartões" e de pílulas decorativas em metadados estáticos.

- **Decisão para sua aprovação (Tipografia)**:
  - **Opção A (Conforme pedido explícito da Fase 2)**: `Inter Variable` (ou `Geist`) para UI + display + `JetBrains Mono` para valores monetários, hashes Git e métricas, com fallback `system-ui, -apple-system, sans-serif`.
  - **Opção B (Evolução da base atual)**: Manter `Plus Jakarta Sans` (corpo/UI) + `Bricolage Grotesque` (títulos display) + `JetBrains Mono` (dados), ajustando a escala modular `1.125`.
  *(Recomendação: **Opção A com `Inter Variable`** se você quer estética fiel ao Linear/Vercel, ou **Opção B** se quiser manter a personalidade editorial atual da marca Devana.)*

### 4.2 Tokens Propostos (`src/styles/tokens.css`)

- **Escala Tipográfica Modular (`1.125` — Major Second, base `16px`)**:
  - `--text-xs`: `0.75rem` (12px) · `--leading-xs`: `1.125rem` (metadados, labels auxiliares)
  - `--text-sm`: `0.875rem` (14px) · `--leading-sm`: `1.25rem` (controles, tabelas, sidebar)
  - `--text-base`: `1rem` (16px) · `--leading-base`: `1.5rem` (corpo padrão)
  - `--text-lg`: `1.125rem` (18px) · `--leading-lg`: `1.625rem` (subtítulos de card)
  - `--text-xl`: `1.266rem` (~20px) · `--leading-xl`: `1.75rem` (títulos de seção)
  - `--text-2xl`: `1.602rem` (~26px) · `--leading-2xl`: `2rem` (títulos de página)
  - `--text-3xl`: `2.027rem` (~32px) · `--leading-3xl`: `2.375rem` (títulos secundários hero)
  - `--text-4xl`: `clamp(2.25rem, 3.6vw, 3rem)` (hero display com `text-wrap: balance`)
- **Paleta Semântica (Light Mode & Dark Mode via `.dark`)**:
  - **Light**: `--bg-canvas: #F8FAFC` · `--surface: #FFFFFF` · `--surface-elevated: #FFFFFF` · `--surface-subtle: #F1F5F9` · `--border: #E2E8F0` · `--border-strong: #CBD5E1` · `--text-primary: #0F172A` · `--text-secondary: #334155` · `--text-muted: #64748B`
  - **Dark**: `--bg-canvas: #090D16` · `--surface: #111827` · `--surface-elevated: #172033` · `--surface-subtle: #1E293B` · `--border: #1F2937` · `--border-strong: #334155` · `--text-primary: #F8FAFC` · `--text-secondary: #CBD5E1` · `--text-muted: #94A3B8`
  - **Ação & Estados (60-30-10)**:
    - `--primary`: `#4F46E5` (hover `#4338CA` / dark `#6366F1`)
    - `--success`: `#16A34A` / `--warning`: `#D97706` / `--danger`: `#DC2626` / `--info`: `#0284C7` *(sempre acompanhados de rótulo textual/ícone — nunca cor isolada)*
- **Espaçamento, Radii, Sombras, Z-Index e Foco**:
  - **Spacing**: `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`, `--space-12: 48px`, `--space-16: 64px`
  - **Radii**: `--radius-sm: 6px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--radius-xl: 16px`, `--radius-full: 9999px`
  - **Shadows**: `--shadow-subtle`, `--shadow-elevated`, `--shadow-overlay`
  - **Z-Index**: `--z-base: 0`, `--z-sticky: 20`, `--z-drawer: 30`, `--z-popover: 40`, `--z-modal: 50`, `--z-toast: 60`
  - **Foco Acessível Global**: `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }`
  - **Motion**: `--duration-fast: 150ms`, `--duration-normal: 220ms`, `--duration-slow: 280ms`, `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` + respeito estrito a `prefers-reduced-motion: reduce`.

### 4.3 Inventário de Componentes Base (`src/components/ui/`)

1. **Ações & Formulários**: `Button` (`primary`, `secondary`, `ghost`, `danger`; `sm/md/lg`; `loading`), `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch` (todos com label associada, helper/error text e `aria-invalid` / `aria-describedby`).
2. **Estrutura & Dados**: `Card` (com subcomponentes `Header/Content/Footer`, elevação única), `Badge` (apenas para status funcionais com texto+ícone), `Tag` (interativa para filtros), `Avatar` (fallback com iniciais + zero broken image).
3. **Overlays & Feedback**: `Tooltip`, `Popover`, `Dropdown`, `Modal` / `Dialog` (focus trap, ESC, restauração de foco, `aria-modal`), `Toast` / `ToastProvider`, `Skeleton`, `EmptyState`, `ErrorState`, `LoadingState`.

### 4.4 Novo App Shell & Navegação
- **Desktop (`lg+`)**: Sidebar colapsável (`240px` expandida / `72px` colapsada) + Header enxuto (`56px–64px`) com busca global, centro de notificações e menu do usuário + breadcrumbs contextuais.
- **Mobile (`< md`)**: Header compacto + Bottom Navigation fixa (respeitando altura total fixa ≤ 15% da viewport) para acesso direto a Início, Explorar, Workspace, Painel e Perfil.

---

## 5. Roadmap Priorizado (Impacto × Esforço)

| Prioridade | Fase / PR | Impacto | Esforço | Justificativa |
| :---: | :--- | :---: | :---: | :--- |
| **P0** | **PR-01 (Fase 4 parcial)**: Lockfile `package-lock.json` + hardening WebSocket `/ws` + correção leitura privada `firestore.rules` | Altíssimo | Baixo/Médio | Corrige falha real de build Docker e fecha brecha crítica de impersonação/leitura no WS e Firestore. |
| **P0** | **PR-02 (Fase 2A + 2B)**: `src/styles/tokens.css` + Biblioteca `src/components/ui/` | Alto | Médio | Base visual obrigatória para substituir estilos ad-hoc e garantir WCAG 2.2 AA consistente. |
| **P1** | **PR-03 (Fase 2C + 2D + 2E)**: Novo App Shell (Sidebar + Bottom Nav + Header) e redesign das páginas-chave | Altíssimo | Alto | Transforma a percepção visual e usabilidade do produto para nível 2025. |
| **P1** | **PR-04 (Fase 3 Frontend)**: Quebrar `src/App.tsx` (4.711 linhas) em `src/routes/`, `src/features/*`, `src/hooks/`, `src/lib/apiClient.ts` | Altíssimo | Alto | Elimina gargalo de manutenção, isola re-renders do timer/chat e viabiliza lazy loading real. |
| **P1** | **PR-05 (Fase 3 Backend)**: Modularizar `server.ts` em `src/server/{config,app,routes,middlewares,services,repositories,ws}` | Alto | Médio | Separa responsabilidades, impõe `validate(schema)` e padroniza `{ error: { code, message, details } }`. |
| **P1** | **PR-06 (Fase 4 Segurança)**: Helmet + CSP + CORS + Pino logger (`requestId`) + Ledger Escrow append-only (`refunded` + idempotência) | Altíssimo | Médio | Fecha blindagem HTTP, observabilidade sem PII e trilha financeira auditável. |
| **P2** | **PR-07 (Fase 5 Performance)**: Route code splitting, lazy load `jsPDF`/`chat`/gráficos, otimização das 4 imagens (2.6 MB → WebP), `tsconfig` `strict: true` | Alto | Médio | Derruba bundle inicial de **714 KB gzip** para **< 200 KB gzip** e acelera LCP. |
| **P2** | **PR-08 (Fase 4/5 Testes & CI)**: `@firebase/rules-unit-testing` real, Vitest + Testing Library, Supertest, Playwright E2E + GitHub Actions + limpeza `package.json` | Altíssimo | Alto | Garante regressão zero e proteção contínua em cada PR. |

---

## Checklist Detalhado por Fase (Acompanhamento Contínuo)

### FASE 1 — Auditoria e Plano
- [x] Mapear estrutura completa de pastas, arquivos > 300 linhas e dependências
- [x] Levantar riscos reais de segurança (WebSocket, Rules, CORS/CSP, Escrow ledger, logs, secrets)
- [x] Medir gargalos reais de performance (bundle `714 KB gzip`, chunks PDF, `2.6 MB` de imagens, re-renders)
- [x] Especificar Design System mínimo viável (`tokens.css` + inventário `ui/` + App Shell)
- [x] Definir Roadmap priorizado (Impacto × Esforço)
- [x] **Aprovação do usuário** (Identidade tipográfica definida: `Plus Jakarta Sans` + `Bricolage Grotesque` + `JetBrains Mono`)

### P0 — Correções Críticas Imediatas
- [x] **PR-01A**: Gerar `package-lock.json` e ajustar flags `--legacy-peer-deps` no `Dockerfile`
- [x] **PR-01B**: Autenticar handshake do WebSocket `/ws` com Firebase ID Token, validar acesso à sala do projeto via Firestore REST, adicionar rate limit por socket e heartbeat/timeout de inatividade
- [x] **PR-01C**: Endurecer `firestore.rules` (restringir `bids` a dono/autor e `worklogs`/`messages` privados a participantes), ajustar queries em `src/App.tsx`, validar com `eslint` e implantar regras (`DeployRules`)

### FASE 2 — Design System & UI/UX Premium
- [x] **PR-2.1**: Criar `src/styles/tokens.css` (escala modular `1.125`, semântica light/dark, foco 2px, espaçamentos `4/8/12/16/24/32/48/64`, radii, z-index, motion) e integrar ao `src/index.css`
- [x] **PR-2.2**: Implementar componentes base tipados em `src/components/ui/` (`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Card`, `Badge`, `Tag`, `Avatar`, `Tooltip`, `Popover`, `Dropdown`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `LoadingState`) e padronizar `ProjectCardSkeleton.tsx`
- [x] **PR-2.3**: Construir App Shell responsivo (`src/components/layout/AppShell.tsx` com Sidebar colapsável desktop + Bottom Nav mobile <= 64px + Header com busca global, notificações via `Popover`, menu de usuário via `Avatar`/`Dropdown` + Breadcrumbs) e restringir uso de Bento Grid exclusivamente ao Dashboard autenticado (`UserDashboardPanel.tsx`), adotando layouts simétricos e limpos na `LandingPage` e demais visões
- [x] **PR-2.4**: Refinar páginas-chave (`LandingPage`, Listagem com filtros/ordenadores/skeletons, Detalhe de Projeto com timeline de Escrow, Dashboard com métricas/gráficos leves, Perfil Público do Freelancer, Onboarding curto e guiado)
- [x] **PR-2.5**: Auditoria WCAG 2.2 AA (contraste, navegação completa por teclado, focus trap, `aria-*`, `prefers-reduced-motion`, microcopy orientada a próximo passo)

### FASE 3 — Refatoração de Arquitetura
- [x] **PR-3.1**: Criar `src/lib/` (`apiClient.ts` com interceptors/retries/erro padronizado, `formatters.ts`, `validators.ts`, `constants.ts`) e `src/hooks/` (`useAuth`, `useProjects`, `useEscrow`, `useRealtime`, `useToast`)
- [x] **PR-3.2**: Modularizar `src/features/` (`auth`, `projects`, `proposals`, `escrow`, `chat`, `profile`, `reports`, `security`) com `components/`, `hooks/`, `api/`, `types.ts`, `index.ts`
- [x] **PR-3.3**: Configurar roteamento em `src/routes/` com code splitting (`React.lazy` + `Suspense`) e reduzir `src/App.tsx` a orquestrador enxuto (< 250 linhas)
- [x] **PR-3.4**: Quebrar `server.ts` em `src/server/` (`config.ts`, `app.ts`, `routes/`, `middlewares/`, `services/`, `repositories/`, `ws/`) com middleware `validate(schema)` e erros `{ error: { code, message, details? } }`

### FASE 4 — Segurança Forte
- [x] **PR-4.1**: Autenticar handshake WebSocket `/ws` via Firebase ID Token, validar origem e autorização na sala, aplicar timeout de inatividade e rate limit por conexão
- [x] **PR-4.2**: Instalar e configurar `helmet` (CSP estrita, HSTS, `X-Frame-Options` / `frame-ancestors`, `COOP`), `cors` com whitelist explícita e `pino`/`pino-http` com `X-Request-Id` e redaction de PII/tokens
- [x] **PR-4.3**: Revisar `firestore.rules` (restringir leitura de `bids`, `worklogs`, `messages` a participantes; adicionar subcoleção `/projects/{projectId}/escrow_ledger` append-only e endpoints `/api/escrow/ledger` com estados `pending → in_escrow → released → refunded` e idempotência)
- [x] **PR-4.4**: Implementar suíte executável em `firestore.rules.test.ts` usando `@firebase/rules-unit-testing` + `Vitest` e suíte de segurança HTTP/Escrow (`src/server/__tests__/security.test.ts`)
- [x] **PR-4.5**: Atualizar `.gitignore`, `.env.example`, regenerar `package-lock.json` para o `Dockerfile`, rodar `npm audit` e remover dependências redundantes (`autoprefixer`, `@google/genai`)

### FASE 5 — Performance & Qualidade de Código
- [x] **PR-5.1**: Lazy load em rotas e módulos pesados (`exportReports` / `jsPDF` carregado dinamicamente só no clique de exportar PDF) + `manualChunks` (`react-vendor`, `firestore-vendor`, `firebase-vendor`, `motion-vendor`, `icons-vendor`) + meta de bundle inicial **< 200 KB gzip** (`714.18 KB gzip → 22.81 KB gzip` no entry chunk e `142.28 KB gzip` somando `react-vendor`, validado via `scripts/check-bundle-budget.mjs`)
- [x] **PR-5.2**: Otimizar imagens (`src/assets/images/` de **2.61 MB** para **~277 KB** em variantes WebP responsivas `128/256/640/1200px` + fallback JPEG progressivo com `<picture>`, `srcSet` e dimensões explícitas) + `<link rel="preload">` e `display=swap` nas fontes + `Cache-Control: public, max-age=31536000, immutable` em `/assets`
- [x] **PR-5.3**: Ativar `"strict": true` em `tsconfig.json` (zero `any` implícito, 0 erros) + padronizar `eslint.config.mjs`, `.prettierrc`, `.husky/pre-commit` e `lint-staged`
- [x] **PR-5.4**: Suíte de testes automatizados (`Vitest` + `Testing Library` em `src/features/__tests__/ui-and-hooks.test.tsx`, `Supertest` em `src/server/__tests__/routes.test.ts` e `security.test.ts`, `@firebase/rules-unit-testing` em `firestore.rules.test.ts`, e `Playwright` para os 5 fluxos críticos em `e2e/devana.spec.ts`)
- [x] **PR-5.5**: Workflow GitHub Actions (`.github/workflows/ci.yml`) rodando `format:check`, `lint:code`, `lint:rules`, `lint`, `test` e `build:budget`

### FASE 6 — Entregáveis Contínuos
- [x] Criado `CHANGELOG.md` cronológico e sincronizado `README.md` com arquitetura modular, segurança, testes, scripts e pipeline CI
- [x] Registrados os resumos, checklists e métricas verificadas de todas as Fases 1–6 neste documento (`ROADMAP_ATUALIZACAO.md`)
- [x] Atualizado `security_spec.md` com invariantes da subcoleção imutável `escrow_ledger`, leitura restrita de subcoleções e autenticação `/ws`

---

## Registro Consolidado de PRs — Checklist de Teste & Riscos Mitigados

| PR / Fase | Escopo Entregue | Checklist de Teste Executado | Riscos Mitigados |
| :--- | :--- | :--- | :--- |
| **PR-01 (P0)** | `package-lock.json`, `Dockerfile` `--legacy-peer-deps`, handshake `/ws` autenticado, fechamento de leitura em `firestore.rules` | `eslint firestore.rules`, `DeployRules`, `tsc --noEmit`, `vite build` | Build Docker quebrado sem lockfile; spoofing de sala no `/ws`; leitura cruzada de propostas/worklogs/chat no Firestore |
| **PR-2.1 – PR-2.5 (Fase 2)** | `tokens.css`, biblioteca `src/components/ui/`, `AppShell` responsivo, Bento Grid restrito ao Dashboard autenticado (`UserDashboardPanel`), auditoria WCAG 2.2 AA | `tsc --noEmit`, `vite build`, verificação de contraste/teclado/focus trap/reduced motion | UI ad-hoc inconsistente; poluição visual na Landing Page; falhas de acessibilidade por teclado e contraste |
| **PR-3.1 – PR-3.4 (Fase 3)** | `src/lib/` (`apiClient`, `validators`, `formatters`, `constants`), `src/hooks/`, `src/features/*`, `src/routes/*` com `React.lazy`, backend modular `src/server/*` com Zod `validate(schema)` | `tsc --noEmit`, `vite build`, verificação de saúde e rotas Express | Monólito de 4.711 linhas em `App.tsx`; re-renders globais do timer/chat; respostas de erro HTTP inconsistentes |
| **PR-4.1 – PR-4.5 (Fase 4)** | `helmet` (CSP/HSTS/COOP), `cors` whitelist, `pino`/`pino-http` (`X-Request-Id`, redact PII/tokens), `/api/escrow/ledger` idempotente + `escrow_ledger` append-only nas Rules, `firestore.rules.test.ts` + `security.test.ts`, limpeza de deps | `npm test` (Vitest + Supertest + Rules), `eslint firestore.rules`, `DeployRules`, `npm audit` | Headers ausentes/CSP permissiva; vazamento de Authorization/PII em logs; mutação retroativa de custódia; dependências obsoletas (`autoprefixer`, `@google/genai`) |
| **PR-5.1 – PR-5.5 (Fase 5)** | `jsPDF` dinâmico, `manualChunks` + `check-bundle-budget.mjs` (`22.83 KB gzip` entrada / `142.3 KB gzip` núcleo), imagens WebP responsivas (`2.61 MB → ~277 KB`), preload fontes + `Cache-Control`, `"strict": true`, ESLint/Prettier/Husky, testes UI/Hooks/Supertest/E2E e `.github/workflows/ci.yml` | `npm run lint`, `npm run lint:code -- --max-warnings=0`, `npm run lint:rules`, `npm run format:check`, `npm test` (`20/20`), `npm run build:budget`, verificação live HTTP `200 OK` | Regressão silenciosa de bundle (> 200 KB gzip); imagens pesadas no LCP; erros implícitos de tipagem (`any`); PRs sem validação automatizada |
| **Fase 6 (Documentação)** | `CHANGELOG.md`, `README.md`, `ROADMAP_ATUALIZACAO.md` e `security_spec.md` sincronizados com o estado final | Revisão cruzada de rotas, scripts, arquitetura de pastas e métricas pós-build | Deriva entre documentação e código em produção |

