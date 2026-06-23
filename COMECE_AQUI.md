# 🚀 Comece aqui — teste no seu celular agora

## Você tem 2 caminhos

### 1️⃣ **AGORA (no celular)** — Deploy na Vercel (2 minutos)

A forma mais rápida de ver o Recuper.ai rodando sem PC:

#### Pré-requisitos:
- Conta GitHub (grátis em https://github.com/signup)
- Cuenta Vercel (grátis, autentica com GitHub)

#### Passos:
1. **Faça um repo vazio em GitHub:**
   - Vai em https://github.com/new
   - Nome: `recuperai`
   - Clique "Create repository"

2. **Descompacte o `recuperai.zip` na sua máquina** (ou do seu colega)

3. **Abra terminal na pasta descompactada e rode:**
   ```bash
   git init
   git add .
   git commit -m "inicial"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/recuperai.git
   git push -u origin main
   ```

4. **Vá em https://vercel.com**
   - Faça login com GitHub
   - Clique "Add New" > "Project"
   - Selecione o repo `recuperai`
   - Clique "Deploy"

5. **Aguarde 2-3 minutos. Você recebe um link assim:**
   ```
   https://recuperai-xxxxx.vercel.app
   ```

6. **Copie esse link, abra no WhatsApp/Telegram e mande pra seu celular. Clique lá.**

---

### 2️⃣ **DEPOIS (no seu PC)** — Rodar localmente

Quando tiver o PC de volta:

```bash
# Descompacte o recuperai.zip
cd recuperai
npm install
npm run dev
```

Abra `http://localhost:3000` no navegador.

---

## O que você vai ver

**Dashboard:**
- R$ 82.400 em aberto, 340 clientes
- 67% de taxa de recuperação
- Gráfico semanal

**Clientes:**
- Lista de inadimplentes (risco, dias de atraso)
- Botão pra importar CSV com seus dados

**IA negociando** (a tela principal):
- Chat com o devedor à esquerda
- Raciocínio da IA à direita (qual regra aplicou, o que ofereceu, por quê)
- Simule respostas do cliente com os botões de atalho

**Regras:**
- Configure limites da IA (máximo de parcelas, desconto, horário)

---

## Modo demo vs. Modo real

**AGORA (sem nenhuma chave de API):**
- A IA negocia por regras (sem gastar nada)
- Dados de exemplo de uma clínica odontológica
- Tudo funciona

**DEPOIS (quando tiver as chaves):**

No `.env.local` adicione:
```
ANTHROPIC_API_KEY=sk-ant-...        # IA usa Claude de verdade
ZAPI_INSTANCE_ID=...                # WhatsApp envia mesmo
ZAPI_TOKEN=...
ASAAS_API_KEY=...                   # Pix real com QR Code
```

Redeploy na Vercel, e a IA começa a usar Claude, WhatsApp envia mesmo, etc.

---

## Próximas decisões

1. **Validar com clínicas locais:** mostre a tela "IA negociando" pra 3 clinicas em Concórdia. Elas pagariam R$99-299/mês?

2. **Integrar dados reais:** importe a planilha de seus inadimplentes (CSV). Sistema calcula risco e atraso sozinho.

3. **Ativar Claude:** pegue uma chave free em https://console.anthropic.com (US$5 grátis inicialmente), plugue, e veja a IA realmente negociando.

4. **Produção:** quando estiver pronto, migre o banco (agora é JSON local) pra Postgres/Supabase, e o deploy continua na Vercel. Nenhum código muda além do `src/lib/db.ts`.

---

## Problemas?

- **"Erro ao fazer push do git"** → confirma que criou o repo vazio em GitHub primeiro
- **"Deploy demorou mais de 5 min"** → normal, às vezes a Vercel fica lenta; aguarde
- **"Dados sumiram"** → Vercel limpa após 24h inativo. Use Railway/Render se quiser persistência
- **"Quer rodar localmente mas sem PC"** → não tem jeito, mas deploy na Vercel resolve agora

---

**Próximo passo:** clique em https://vercel.com e comece o deploy. Em 2 minutos você testa no celular. 🎯

