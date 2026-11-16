# 💰 Devana — Roadmap de Monetização Sustentável (100% Gratuito no Core)

> **Princípio fundador:** O Devana é e sempre será gratuito no seu núcleo — sem mensalidades para clientes, sem mensalidades para profissionais, sem comissão sobre transações. A monetização existe para sustentar a infraestrutura, a moderação e o desenvolvimento contínuo, mas nunca para taxar o acesso ou o trabalho.
>
> **Regra de ouro:** Nenhuma feature essencial pode ficar atrás de paywall. Se um usuário nunca pagar nada, ele deve conseguir usar 100% do marketplace. A monetização vem de **atenção, conveniência e eficiência** — nunca de acesso.

---

## 📋 Índice

1. [Filosofia e Guardrails](#-filosofia-e-guardrails)
2. [Modelo 1 — Destaques e Impulsos (com cota gratuita)](#-modelo-1--destaques-e-impulsos-com-cota-gratuita)
3. [Modelo 2 — Publicidade Contextual e Patrocínios](#-modelo-2--publicidade-contextual-e-patrocnios)
4. [Modelo 3 — Serviços de Valor Agregado](#-modelo-3--serviços-de-valor-agregado)
5. [Modelo 4 — Receita de Float do Escrow](#-modelo-4--receita-de-float-do-escrow)
6. [Modelo 5 — Afiliados e Parcerias](#-modelo-5--afiliados-e-parcerias)
7. [Roadmap de Implementação por Fases](#-roadmap-de-implementação-por-fases)
8. [Métricas e Sinais de Saúde](#-métricas-e-sinais-de-saúde)
9. [Comunicação e Transparência](#-comunicação-e-transparência)

---

## 🧭 Filosofia e Guardrails

Antes de qualquer coisa, os limites invioláveis do modelo:

| Guardrail | Regra |
|---|---|
| **Acesso** | Nenhuma feature essencial é paga. Login, publicar projeto, enviar proposta, chat, escrow e avaliações são gratuitos para sempre. |
| **Transação** | Zero comissão sobre o valor do projeto. O valor combinado entre cliente e freelancer é integralmente deles. |
| **Recorrência** | Nenhuma cobrança mensal obrigatória. Nada de "plano pro" para usar o básico. |
| **Coerção** | Nenhum dark pattern. Sem countdown falso, sem "últimas vagas", sem bloquear ação até pagar. |
| **Transparência** | Toda fonte de receita é pública e listada em `/transparencia` ou no README. |
| **Privacidade** | Dados de usuário não são vendidos. Anúncios não usam segmentação comportamental invasiva. |

---

## 🎯 Modelo 1 — Destaques e Impulsos (com cota gratuita)

### Conceito

Usuários podem "impulsionar" projetos ou perfis para ganhar visibilidade temporária no topo de listagens, na home e em buscas. **Cada usuário tem direito a 2 impulsos gratuitos por mês**, que ele escolhe quando e onde usar. Quem quiser mais, compra pacotes pontuais (sem assinatura).

### Por que funciona

- **Não bloqueia nada:** quem nunca pagar continua com 2 boosts/mês de graça.
- **Escolha do usuário:** ele decide quando usar (ex: guardar os dois para um projeto grande).
- **Baixo atrito:** compra pontual, sem contrato, sem recorrência.
- **Alta percepção de valor:** visibilidade é o que todo freelancer quer, e é fácil de medir (views, propostas recebidas).

### Regras da Cota Gratuita

- **2 impulsos gratuitos por mês**, por conta (cliente e freelancer têm cotas separadas se forem a mesma pessoa com dois papéis).
- **Reset no primeiro dia do mês** (não acumula — para evitar estoque infinito e manter o incentivo de uso).
- **Escolha livre do tipo:** o usuário pode usar os 2 no mesmo tipo (ex: 2 projetos) ou dividir (1 projeto + 1 perfil).
- **Duração do impulso gratuito:** 7 dias (mesmo do pago, para não criar cidadania de segunda classe).
- **Sem fila de espera:** o impulso ativa imediatamente.
- **Visível no dashboard:** contador "Você tem 2 impulsos gratuitos este mês" com botão "Usar agora".

### Tipos de Impulso

| Produto | O que faz | Duração | Preço sugerido (BRL) | Cota grátis |
|---|---|---|---|---|
| **Impulso de Projeto** | Projeto no topo da categoria + selo "Destaque" + aparece na home | 7 dias | R$ 19,90 | 2/mês (compartilhado) |
| **Impulso de Perfil** | Perfil no topo das buscas + selo "Em destaque" | 7 dias | R$ 14,90 | 2/mês (compartilhado) |
| **Impulso de Proposta** | Proposta no topo da lista do cliente + badge "Prioritária" | 48h | R$ 9,90 | 2/mês (compartilhado) |
| **Pacote Combo** | 1 projeto + 1 perfil por 7 dias | 7 dias | R$ 29,90 | — |

### Mecânica de Implementação (resumo técnico)

1. **Coleção `boosts`** no Firestore: `{ id, ownerId, targetType: 'project'|'profile'|'proposal', targetId, source: 'free'|'paid', startsAt, endsAt, status }`.
2. **Coleção `boost_quotas`**: `{ userId, period: '2025-11', freeUsed: 0, freeLimit: 2, paidCredits: 0 }`. Reset mensal via Cloud Function agendada (cron).
3. **Endpoint `POST /api/boosts`**: valida cota (gratuita ou paga), cria boost, atualiza quota atomicamente em transação.
4. **Ranking:** query de listagem ordena por `isActiveBoost DESC, createdAt DESC`. Índice composto no Firestore.
5. **UI:** botão "Impulsionar" em projetos/perfis com modal mostrando "Usar impulso gratuito (2 restantes)" ou "Comprar impulso".
6. **Pagamento:** Stripe Checkout (ou Mercado Pago para BRL) apenas para compras pontuais. Webhook confirma e credita.
7. **Antiabuso:** limite de 2 contas por IP/dispositivo para evitar farming de cotas; verificação de e-mail obrigatória para usar cota gratuita.

### Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Spam de projetos impulsionados | Curadoria mínima: projeto precisa ter descrição completa e orçamento definido para ser impulsionável |
| Usuários criando contas múltiplas para farmar cotas | Verificação de e-mail + device fingerprint leve + limite por IP |
| Percepção de "pay-to-win" | Deixar claro que impulso é só visibilidade temporária, não garante contratação |
| Cota grátis canibalizar receita | Monitorar conversão: se muitos usarem só a cota, ajustar duração (ex: cota grátis = 3 dias, pago = 7 dias) |

---

## 📢 Modelo 2 — Publicidade Contextual e Patrocínios

### Conceito

Anúncios nativos, relevantes e claramente sinalizados. Nunca interrompem o fluxo, nunca bloqueiam a tela. O usuário pode ignorar sem penalidade.

### Formatos

- **Ferramentas recomendadas no perfil:** bloco discreto "Ferramentas que este profissional usa" com links de afiliado (Figma, Notion, VS Code extensions, hospedagem).
- **Patrocínio de categoria:** banner sutil no topo de uma listagem (ex: "Categoria Desenvolvimento Web patrocinada por [escola de programação]"). Deve parecer conteúdo editorial, não anúncio.
- **Anúncio assistido (opcional):** freelancer assiste 15s de vídeo de parceiro e ganha **1 impulso extra de 24h**. Gratuito, opt-in, sem custo.
- **Newsletter patrocinada:** se houver newsletter, um bloco de patrocínio por edição.

### Regras

- Máximo de **1 anúncio por viewport** em listagens.
- Sem pop-ups, sem interstitials, sem autoplay com som.
- Anúncios sempre com label "Patrocinado" ou "Parceiro".
- Sem rastreamento comportamental entre sites (sem pixel de terceiros além do estritamente necessário).
- Parceiros passam por curadoria (nada de cripto-golpe, aposta, etc.).

### Receita esperada

- Patrocínio de categoria: R$ 500–2.000/mês por categoria (negociação direta).
- Afiliados: 10–30% de comissão por assinatura gerada.
- Anúncio assistido: CPM pago pelo parceiro (R$ 15–40).

---

## 🛠️ Modelo 3 — Serviços de Valor Agregado

### Conceito

O core é gratuito. Ferramentas que economizam tempo ou aumentam eficiência são vendidas como créditos pontuais ou pacotes únicos — **nunca como assinatura obrigatória**.

### Produtos sugeridos

| Produto | Descrição | Modelo de cobrança |
|---|---|---|
| **Gerador de Propostas com IA** | Cria proposta personalizada a partir do projeto + perfil do freelancer | Créditos (ex: 10 propostas por R$ 19,90) |
| **Analytics Avançado** | Relatório de conversão de propostas, comparativo com média da categoria, tendências de demanda | Relatório único (R$ 9,90) ou pacote trimestral |
| **Integrações Premium** | Conexão nativa com Trello, Asana, ClickUp, Notion, emissão de NF | Add-on pontual (R$ 4,90/mês opt-in, cancelável) |
| **Destaque em Busca Externa** | Perfil indexado em parceiros (ex: agregadores de freelancers) | Por indicação |

### Regras

- Nenhum serviço de valor agregado é pré-requisito para usar o marketplace.
- Cancelamento em 1 clique, sem retenção.
- Período de teste gratuito de 7 dias em qualquer add-on.

---

## 💰 Modelo 4 — Receita de Float do Escrow

### Conceito

Enquanto o valor de um projeto está retido em escrow (entre depósito do cliente e liberação para o freelancer), o dinheiro rende em aplicação financeira de baixo risco. A receita desse rendimento é da plataforma.

### Como funciona

1. Cliente deposita valor do projeto no escrow.
2. Valor fica aplicado em CDB liquidez diária (ou Tesouro Selic) sob CNPJ da Devana.
3. Ao aprovar a entrega, freelancer recebe o valor integral (sem desconto).
4. A Devana fica com o rendimento do período.

### Regras

- **O freelancer recebe 100% do valor combinado.** O float não é desconto no repasse.
- **Prazo de liberação:** D+2 a D+5 após aprovação (tempo para o dinheiro render e para eventuais contestações).
- **Transparência:** política de escrow pública, explicando o prazo e a custódia.
- **Compliance:** requer estrutura jurídica (conta escrow segregada, CNPJ, parceria com instituição financeira ou uso de infra como Iugu/Asaas/Stripe Connect).

### Pré-requisitos

- Volume mínimo de transações para justificar (ex: R$ 100k/mês em escrow).
- Assessoria jurídica e contábil.
- Parceria com banco/instituição de pagamento que ofereça conta escrow.

### Receita esperada

- Com Selic a ~10% a.a. e prazo médio de 10 dias em escrow: ~0,27% do volume transacionado.
- Sobre R$ 1M/mês em escrow: ~R$ 2.700/mês de receita passiva.

---

## 🤝 Modelo 5 — Afiliados e Parcerias

### Conceito

Monetizar a jornada do usuário fora da plataforma, recomendando produtos e serviços que ele já precisa.

### Programas

- **Afiliados de ferramentas:** hospedagem, domínios, cursos, softwares de design/dev, contabilidade para freelancers.
- **Parcerias com escolas:** curso patrocina seção "Aprenda [habilidade]" e paga por lead qualificado.
- **Marketplace de serviços complementares:** cliente que contrata dev pode precisar de designer; indicação gera taxa.
- **Programa de indicação de usuários:** quem traz cliente ou freelancer ganha impulso grátis extra (não dinheiro, para não virar MLM).

### Regras

- Recomendações só para produtos que a equipe usa ou testou.
- Links de afiliado sempre sinalizados.
- Nunca recomendar produto concorrente direto do marketplace.

---

## 🗺️ Roadmap de Implementação por Fases

### 🟢 Fase 1 — Destaques e Impulsos (0–3 meses)

**Objetivo:** validar disposição a pagar sem tocar no core.

- [ ] Modelagem Firestore: `boosts`, `boost_quotas`, `boost_transactions`.
- [ ] Cloud Function agendada para reset mensal de cotas.
- [ ] Endpoint `POST /api/boosts` com validação de cota (gratuita/paga) em transação atômica.
- [ ] UI: botão "Impulsionar" em projeto/perfil + modal com cota e opção de compra.
- [ ] Dashboard: card "Impulsos gratuitos deste mês: 2/2" com botão "Usar agora".
- [ ] Integração de pagamento pontual (Stripe Checkout ou Mercado Pago).
- [ ] Ranking de listagens com boost ativo no topo.
- [ ] Antiabuso: verificação de e-mail + limite por IP/dispositivo.
- [ ] Página `/transparencia` explicando o modelo.

**Métricas de sucesso:** ≥ 30% dos usuários ativos usam a cota gratuita; ≥ 5% dos que usam compram impulso extra.

### 🟡 Fase 2 — Publicidade + Valor Agregado (3–6 meses)

- [ ] Sistema de patrocínio de categoria (contrato manual no início).
- [ ] Bloco "Ferramentas recomendadas" com links de afiliado.
- [ ] Gerador de propostas com IA (créditos).
- [ ] Analytics avançado (relatório único).
- [ ] Programa de indicação com impulso grátis como recompensa.

**Métricas de sucesso:** ≥ 1 patrocinador por categoria principal; ≥ 10% dos freelancers usam gerador de IA.

### 🟠 Fase 3 — Float do Escrow (6–12 meses)

- [ ] Estrutura jurídica e conta escrow segregada.
- [ ] Parceria com instituição financeira / PSP.
- [ ] Política de escrow pública.
- [ ] Integração contábil e relatórios de auditoria.

**Pré-requisito:** volume ≥ R$ 100k/mês em escrow.

### 🔵 Fase 4 — Escala e Otimização (12+ meses)

- [ ] Revisão de preços com base em dados de elasticidade.
- [ ] Novos formatos de patrocínio (newsletter, eventos).
- [ ] Programa de parceiros regionais.
- [ ] Relatório anual de transparência financeira.

---

## 📊 Métricas e Sinais de Saúde

### Métricas de produto

- **Taxa de uso da cota gratuita:** % de usuários ativos que usam ao menos 1 impulso/mês.
- **Conversão cota → compra:** % dos que esgotam a cota e compram extra.
- **Churn de impulsos:** usuários que param de comprar após X meses.
- **Receita por fonte:** quebra por impulsos, patrocínio, afiliados, float.
- **NPS de usuários pagantes vs. não pagantes:** garantir que não há ressentimento.

### Sinais de alerta (rever modelo)

- Queda no uso do marketplace correlacionada com aumento de anúncios.
- Reclamações públicas sobre "pay-to-win".
- Receita concentrada demais em uma fonte (> 70%).
- Usuários criando contas múltiplas para farmar cotas.

### Meta de sustentabilidade

- **Cobertura de custos:** receita ≥ custos de infra + moderação + 1 dev em 12–18 meses.
- **Diversificação:** nenhuma fonte > 50% da receita após 24 meses.

---

## 📣 Comunicação e Transparência

### Página `/transparencia`

Conteúdo mínimo:

- "O Devana é gratuito porque..."
- Lista de fontes de receita (com % aproximado).
- Explicação do modelo de cotas gratuitas.
- Compromisso: "nunca cobraremos comissão, mensalidade ou acesso".
- Canal de feedback sobre monetização.

### Tom de voz

- **Claro, não defensivo.** "Ganhamos dinheiro com impulsos opcionais e parcerias. O resto é grátis."
- **Sem eufemismos.** Não chamar anúncio de "conteúdo patrocinado" se for anúncio.
- **Comunidade incluída.** Anunciar mudanças de modelo com antecedência e abrir para discussão no GitHub (é open source, afinal).

### No README do GitHub

- Seção "Sustentabilidade" explicando o modelo.
- Link para `/transparencia`.
- Convite para contribuir com o código (open source) e com ideias de monetização.

---

## ✅ Checklist de Lançamento da Fase 1

- [ ] Modelagem Firestore revisada e testada com rules.
- [ ] Cloud Function de reset mensal deployada e monitorada.
- [ ] Endpoint de boost com testes de cota (grátis, paga, esgotada).
- [ ] UI de impulso com estados: disponível, usado, esgotado, comprado.
- [ ] Dashboard com contador de cota.
- [ ] Pagamento pontual testado em sandbox e produção.
- [ ] Antiabuso: verificação de e-mail, limite por IP.
- [ ] Página `/transparencia` publicada.
- [ ] README atualizado.
- [ ] Post de lançamento explicando o modelo (blog + redes).
- [ ] Monitoramento: dashboard de uso de cota e conversão.

---

> **Lembrete final:** o ativo mais valioso do Devana é a confiança da comunidade de que ele é gratuito de verdade. Toda decisão de monetização deve passar pelo filtro: *"isso reforça ou enfraquece essa confiança?"* Se enfraquecer, não faça — mesmo que dê receita no curto prazo.