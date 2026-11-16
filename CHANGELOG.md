# Changelog

Todas as evoluções técnicas e de segurança do projeto **Devana** são registradas neste arquivo em formato cronológico reverso.

---

## [1.5.0] — Fase 5: Performance, Tipagem Estrita, Testes & CI/CD

### Performance & Assets
- **Code Splitting & Dynamic Imports (`PR-5.1`)**:
  - Carregamento dinâmico sob demanda de `jspdf` em `src/utils/exportReports.ts` (removido do bundle inicial e do chunk de `ReportsView`).
  - Configuração de `manualChunks` em `vite.config.ts` (`react-vendor`, `firestore-vendor`, `firebase-vendor`, `motion-vendor`, `icons-vendor`).
  - Script de orçamento `scripts/check-bundle-budget.mjs` (`npm run build:budget`) validando limite de `< 200 KB gzip` no boot núcleo (`~22.8 KB gzip` no entry chunk e `~142.3 KB gzip` somando `react-vendor`, contra `714.18 KB gzip` iniciais).
- **Otimização de Imagens, Fontes & Cache (`PR-5.2`)**:
  - Conversão e redimensionamento responsivo dos ativos de `src/assets/images/` (**2,61 MB** originais → **~277 KB** totais em variantes WebP `128/256/640/1200px` + fallbacks JPEG progressivos).
  - Uso de `<picture>`, `<source type="image/webp" srcSet>`, `sizes`, `width`/`height` explícitos, `decoding="async"` e `fetchPriority="high"` no hero LCP (`SafeImage`, `Avatar`, `LandingPage`, `UserDashboardPanel`).
  - Preload não bloqueante das fontes (`Plus Jakarta Sans`, `Bricolage Grotesque`, `JetBrains Mono`) com `display=swap` em `index.html`.
  - Headers `Cache-Control: public, max-age=31536000, immutable` em `/assets` e `no-cache, no-store, must-revalidate` em `index.html` no `server.ts`.

### Qualidade, Testes & CI
- **TypeScript Strict & Ferramentas (`PR-5.3`)**:
  - Ativado `"strict": true` em `tsconfig.json` com 0 erros.
  - Padronizados `eslint.config.mjs` (zero `any` explícito, `react-hooks`), `.prettierrc`, `.prettierignore`, `.husky/pre-commit` e `lint-staged`.
- **Suíte de Testes Automatizados (`PR-5.4`)**:
  - **Vitest + React Testing Library (`jsdom`)**: testes de componentes UI (`Button`, `Modal`), hooks (`useProjectFilters`, `getEscrowTimelineSteps`) e view `EscrowView`.
  - **Supertest (`routes.test.ts` + `security.test.ts`)**: validação de rotas públicas, envelopes de erro padronizados, headers de segurança e bloqueio sem Firebase Bearer token.
  - **Firestore Security Rules (`firestore.rules.test.ts`)**: suíte executável com `@firebase/rules-unit-testing`.
  - **Playwright E2E (`e2e/devana.spec.ts`)**: cobertura dos 5 fluxos críticos (Landing/Cadastro, Marketplace, Detalhe/Propostas, Garantia Escrow e Workspace/Chat).
- **CI no GitHub Actions (`PR-5.5`)**:
  - Adicionado `.github/workflows/ci.yml` executando `format:check`, `lint:code`, `lint:rules`, `lint` (`tsc --noEmit`), `test` e `build:budget`.

---

## [1.4.0] — Fase 4: Hardening de Segurança & Ledger Imutável

- **WebSocket Autenticado (`PR-4.1`)**: handshake em `/ws` com verificação de Firebase ID Token, validação estrita de `Origin`, autorização na sala via Firestore REST, heartbeat (30s), timeout de inatividade (5 min) e rate limiting por socket.
- **HTTP Hardening & Logging Estruturado (`PR-4.2`)**: `helmet` (CSP estrita compatível com Firebase Auth/Google Fonts, HSTS, `COOP: same-origin-allow-popups`), `cors` com whitelist `ALLOWED_ORIGINS` e `pino` + `pino-http` com `X-Request-Id` e redaction de tokens/PII.
- **Ledger Escrow Append-Only & Rules (`PR-4.3`)**: subcoleção `/projects/{projectId}/escrow_ledger` imutável em `firestore.rules` e endpoints `/api/escrow/ledger` suportando estados `pending → in_escrow → released → refunded` com chave de idempotência (`idempotencyKey`).
- **Higiene de Projeto (`PR-4.5`)**: geração de `package-lock.json`, limpeza de dependências não utilizadas (`autoprefixer`, `@google/genai`) e proteção de credenciais em `.gitignore`.

---

## [1.3.0] — Fase 3: Refatoração Arquitetural (Frontend & Backend)

- **Camada Compartilhada & Hooks (`PR-3.1`)**: criação de `src/lib/` (`apiClient.ts`, `formatters.ts`, `validators.ts`, `constants.ts`) e `src/hooks/` (`useAuth`, `useProjects`, `useEscrow`, `useRealtime`, `useToast`).
- **Modularização por Features (`PR-3.2`)**: domínio organizado em `src/features/` (`auth`, `projects`, `proposals`, `escrow`, `chat`, `profile`, `reports`, `security`).
- **Code Splitting de Rotas (`PR-3.3`)**: rotas lazy-loaded em `src/routes/` com `RouteErrorBoundary`, reduzindo `src/App.tsx` de **4.711 linhas** para orquestrador enxuto.
- **Backend em Camadas (`PR-3.4`)**: divisão de `server.ts` em `src/server/{config,app,logger,middlewares,repositories,routes,services,ws}` com middleware `validate(schema)` via Zod e respostas de erro padronizadas.

---

## [1.2.0] — Fase 2: Design System & WCAG 2.2 AA

- **Design Tokens (`PR-2.1`)**: criação de `src/styles/tokens.css` com escala modular `1.125`, modos claro/escuro, foco acessível `2px`, espaçamentos `4–64px` e `prefers-reduced-motion`.
- **Biblioteca UI (`PR-2.2`)**: criação de componentes acessíveis em `src/components/ui/` (`Button`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio`, `Switch`, `Card`, `Badge`, `Tag`, `Avatar`, `Tooltip`, `Popover`, `Dropdown`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `LoadingState`).
- **App Shell & Fluxos (`PR-2.3` – `PR-2.5`)**: `AppShell` responsivo (Sidebar colapsável + Bottom Nav mobile), Bento Grid restrito exclusivamente ao painel autenticado (`UserDashboardPanel`), timeline visual de custódia e auditoria completa **WCAG 2.2 AA**.

---

## [1.1.0] — P0: Correções Críticas de Build & Segurança

- Geração do `package-lock.json` e ajuste do `Dockerfile` multi-stage (`node:22-alpine`).
- Fechamento de leitura cross-user nas subcoleções privadas do `firestore.rules` e implantação em produção.
- Blindagem inicial do handshake `/ws` com token Firebase verificado.

---

## [1.0.0] — Fase 1: Auditoria Inicial & Base Funcional

- Plataforma full-stack **Devana** com comissão `0%`, Firebase Auth (Google + E-mail/Senha verificado), Firestore em tempo real, backup cifrado `AES-256-GCM` e proxy GitHub.
