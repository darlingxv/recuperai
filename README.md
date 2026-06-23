# Recuper.ai

**Agente financeiro virtual que lembra, negocia e recupera pagamentos em atraso.**

Um SaaS B2B onde uma IA cuida da cobrança chata: envia lembretes, negocia atrasos dentro das regras da empresa e acompanha o pagamento até o fim. Não é "software de cobrança" — é uma IA que recupera dinheiro que a empresa já estava perdendo.

Este repositório é um **MVP funcional e completo**: roda na sua máquina hoje, sem configurar nada (modo demo), e vira produto real assim que você pluga as chaves de API.

---

## O que já está pronto

- **Dashboard** — dinheiro em aberto, recuperado no mês, taxa de recuperação, negociações ativas e gráfico semanal.
- **Carteira de clientes** — lista de inadimplentes com risco, dias de atraso e probabilidade de pagamento.
- **IA negociando** (a tela principal) — chat com o devedor lado a lado com o **raciocínio da IA**: qual regra ela aplicou, o que ofereceu e por quê. Esse é o diferencial que nenhum concorrente tem.
- **Motor de negociação** — integração real com o Claude + uma **camada de segurança** que garante que a IA nunca ultrapassa os limites da empresa (parcelas, desconto, vencimento).
- **Importação de CSV** — sobe a planilha de inadimplentes e o sistema calcula risco e atraso sozinho.
- **Regras configuráveis** — máximo de parcelas, desconto máximo, valor mínimo para desconto, tom de voz e janela de horário (Código de Defesa do Consumidor).
- **Estimativa de inadimplência** — calcula a chance de pagamento a partir do histórico e sugere ação preventiva antes do vencimento.
- **Integrações com fallback seguro** — WhatsApp (Z-API) e Pix (Asaas) já codados; sem as chaves, apenas registram/simulam, pra você desenvolver sem risco.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript |
| Estilo | Tailwind CSS |
| IA / negociação | Claude (Anthropic) |
| WhatsApp | Z-API |
| Pix / cobranças | Asaas |
| Dados (MVP) | arquivo JSON local — troca direta por Postgres/Supabase |

---

## Como rodar (3 passos)

Você precisa do [Node.js](https://nodejs.org) 18+ instalado.

```bash
# 1. instalar as dependências
npm install

# 2. (opcional) copiar o arquivo de ambiente
cp .env.example .env.local

# 3. rodar
npm run dev
```

Abra **http://localhost:3000**. Pronto — o app já funciona em **modo demo**, com dados de uma clínica odontológica de exemplo e a IA negociando por regras (sem custo de API).

> **Dica:** vá em "IA negociando", escolha um cliente e clique nos botões de resposta rápida ("Estou sem dinheiro", "Achei caro"...). Veja o raciocínio da IA aparecer à direita em tempo real.

---

## Ativando os recursos reais

Tudo abaixo é opcional. Sem nenhuma chave, o app roda em modo demo.

### 1. IA de verdade (Claude)

Sem a chave, a negociação é simulada por regras. Com a chave, o Claude conduz a conversa.

1. Pegue uma chave em https://console.anthropic.com/settings/keys
2. No `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
3. Reinicie o `npm run dev`. O badge no topo muda para "Claude conectado".

O modelo padrão é o `claude-haiku-4-5` (barato e rápido, ideal pra cobrança em volume). Para negociações mais sofisticadas, troque em `.env.local`:
```
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### 2. WhatsApp (Z-API)

Sem as chaves, as mensagens só são registradas no console. Com elas, são enviadas de verdade.

1. Crie uma instância em https://z-api.io
2. No `.env.local`:
   ```
   ZAPI_INSTANCE_ID=...
   ZAPI_TOKEN=...
   ZAPI_CLIENT_TOKEN=...
   ```

Alternativas: Evolution API (open source) ou WhatsApp Cloud API (Meta). A função `sendWhatsApp()` em `src/lib/whatsapp.ts` isola o provedor — basta reescrever ali.

### 3. Pix / cobranças (Asaas)

Sem a chave, os Pix são simulados. Com ela, cria cobrança real e retorna QR Code + link.

1. Crie uma conta sandbox em https://www.asaas.com
2. No `.env.local`:
   ```
   ASAAS_API_KEY=...
   ASAAS_BASE_URL=https://api-sandbox.asaas.com/v3
   ```

Alternativas: Pagar.me, Efí, Mercado Pago. A lógica fica em `src/lib/pix.ts`.

---

## Estrutura do projeto

```
recuperai/
├── src/
│   ├── app/
│   │   ├── page.tsx              Dashboard
│   │   ├── clients/             Carteira de clientes + importação CSV
│   │   ├── negotiations/        IA negociando (tela principal)
│   │   ├── settings/            Regras da empresa
│   │   └── api/
│   │       ├── negotiate/       roda o motor de IA + envia WhatsApp
│   │       ├── import/          parse de CSV
│   │       ├── clients/         lista + estatísticas
│   │       ├── rules/           lê/salva regras
│   │       └── seed/            recarrega dados demo
│   ├── components/              Sidebar, tabelas, chat, formulários
│   └── lib/
│       ├── claude.ts            ★ MOTOR DE NEGOCIAÇÃO (Claude + modo demo)
│       ├── db.ts                camada de dados (troque por Postgres aqui)
│       ├── whatsapp.ts          integração Z-API
│       ├── pix.ts               integração Asaas
│       ├── types.ts             tipos do domínio
│       ├── seed-data.ts         clientes de exemplo
│       └── format.ts            formatação (R$, datas)
├── public/exemplo-inadimplentes.csv   CSV de exemplo pra importar
└── .env.example
```

O arquivo mais importante é **`src/lib/claude.ts`**. É onde a IA decide o que oferecer, sempre validado contra as regras da empresa (uma IA nunca pode dar um desconto maior que o permitido, mesmo que "queira").

---

## De MVP para produção

Este MVP usa um **arquivo JSON local** (`.data/db.json`) pra rodar sem nenhuma configuração. Para produção, a única coisa a trocar é a camada de dados:

1. **Banco de dados** — reimplemente as funções de `src/lib/db.ts` (`getClients`, `getClient`, `updateClient`, `addMessage`...) usando **Prisma + Postgres/Supabase**. Nenhum componente ou rota precisa mudar — eles só conhecem essa interface.
2. **Login de empresas** — adicione autenticação (ex.: Supabase Auth, Clerk) para multi-empresa.
3. **Webhooks** — Asaas e Z-API mandam webhooks de "pagamento confirmado" e "mensagem recebida". Crie rotas em `src/app/api/webhooks/` para o fluxo rodar 100% automático (hoje a resposta do cliente é simulada na tela).
4. **Agendador** — um cron (ex.: Vercel Cron) para disparar a sequência de lembretes nos horários certos.
5. **Pagamentos do SaaS** — Stripe para cobrar as empresas clientes (R$99 / R$499 / R$2.000).

---

## Deploy

O caminho mais simples é a [Vercel](https://vercel.com) (mesma empresa do Next.js):

1. Suba o projeto pro GitHub.
2. Importe na Vercel.
3. Configure as variáveis de ambiente (as mesmas do `.env.local`).
4. Para o banco, adicione Supabase ou Vercel Postgres.

> Observação: o armazenamento em arquivo JSON **não funciona em produção na Vercel** (sistema de arquivos efêmero). Faça a migração para Postgres antes do deploy — veja a seção acima.

---

## Avisos importantes

- **Cobrança e a lei:** o Código de Defesa do Consumidor regula como cobrar (horário, tom, frequência). As regras de horário e o prompt da IA já consideram isso, mas consulte um contador/advogado antes de operar comercialmente.
- **Modo demo:** os dados de exemplo são fictícios. O `.data/db.json` é recriado sempre que apagado (botão "Recarregar demo" no dashboard).

---

Construído como ponto de partida real. Próximo passo sugerido: rodar localmente, mostrar a tela de "IA negociando" para 3 clínicas e validar se elas pagariam antes de investir na infra de produção.
