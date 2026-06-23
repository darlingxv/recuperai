# Como rodar o Recuper.ai no seu PC (Windows)

Rodando local, **os contatos não somem** (salva em arquivo) e o **WhatsApp envia de verdade**.

## Passo 1 — Instalar o Node.js (só uma vez)
Baixe e instale o Node.js (versão **LTS**) em: https://nodejs.org
Aceite tudo no instalador (next, next, finish).

## Passo 2 — Iniciar
Dentro desta pasta, **dê dois cliques** em **`INICIAR-WINDOWS.bat`**.
- Na primeira vez ele instala as dependências (demora alguns minutos).
- Depois aparece algo como `Ready in ...` e `Local: http://localhost:3000`.

> Se o Windows mostrar um aviso azul (SmartScreen), clique em **"Mais informações" → "Executar assim mesmo"**.
> Se perguntar sobre **firewall**, clique em **Permitir** (é o que deixa o celular acessar).

## Passo 3 — Abrir
- **No PC:** abra o navegador em **http://localhost:3000**
- **No celular** (na mesma Wi-Fi):
  1. Abra o Prompt de Comando e digite `ipconfig`
  2. Pegue o número do **"Endereço IPv4"** (ex: 192.168.0.12)
  3. No celular, acesse **http://192.168.0.12:3000** (troque pelo seu IP)

## Ligar a IA de verdade (responder qualquer mensagem)

Sem chave de IA, o app usa respostas prontas (modo demo). Para a IA responder
de forma inteligente a qualquer coisa, pegue uma chave **gratis** e cole no
arquivo `.env.local`:

1. Abra https://console.groq.com/keys (gratis, **nao pede cartao**)
2. Crie a conta, clique em **Create API Key**, copie a chave
3. Abra o arquivo **`.env.local`** (Bloco de Notas serve)
4. Ache a linha `# GROQ_API_KEY=cole_sua_chave_aqui`, **tire o `#`** do inicio e
   cole sua chave depois do `=`. Salve.
5. Pare o servidor (feche a janela preta) e rode o `INICIAR-WINDOWS.bat` de novo.

Na tela "IA negociando" vai aparecer o selo verde **"IA real ativa"**.
(Prefere o Google Gemini? Mesma coisa com a linha `GEMINI_API_KEY` -> https://aistudio.google.com/apikey)

## Já está configurado
O arquivo **`.env.local`** já vem com as suas credenciais da Z-API.
Para o WhatsApp enviar, a sua instância precisa estar **conectada** no painel da Z-API (QR code escaneado).

## Receber mensagens REAIS dos clientes (conversa de mao dupla)

Para o cliente responder no WhatsApp dele e a IA continuar a conversa sozinha,
a Z-API precisa "avisar" o seu sistema quando chega mensagem. Isso e o **webhook**.

O endereco do webhook e: **(seu endereco)/api/webhook/zapi**
(ele tambem aparece na tela **Regras** do app)

### Se estiver rodando no PC (localhost): use o ngrok
O localhost so existe no seu PC, entao a Z-API nao alcanca. O ngrok cria um
endereco publico temporario que aponta pro seu PC:

1. Baixe o ngrok em https://ngrok.com/download e crie a conta gratis
2. Com o app **rodando** (INICIAR-WINDOWS.bat aberto), abra OUTRA janela do
   Prompt e rode:  `ngrok http 3000`
3. Vai aparecer uma linha tipo  `Forwarding  https://abc123.ngrok-free.app -> ...`
   Copie esse endereco `https://abc123.ngrok-free.app`
4. O seu webhook fica: `https://abc123.ngrok-free.app/api/webhook/zapi`
5. No painel da **Z-API**, em **Ao receber** (webhook de mensagem recebida),
   cole esse endereco e salve.
6. Mantenha o app E o ngrok abertos. Mande uma mensagem do seu outro celular
   pro numero conectado na Z-API: ela vai aparecer no Recuper.ai e a IA responde.

> O endereco do ngrok muda toda vez que voce reabre. Se reiniciar, gere de novo
> e atualize na Z-API.

### Para valer (sempre ligado): use a Vercel
No PC, o webhook so funciona com o app e o ngrok abertos. Para funcionar 24h sem
depender do seu PC, suba na Vercel e use o endereco
`https://seu-projeto.vercel.app/api/webhook/zapi` (precisa configurar a chave de
IA, as credenciais da Z-API e o banco Upstash nas variaveis de ambiente da Vercel).

## Parar o servidor
Feche a janela preta (o .bat). Para rodar de novo, dois cliques no `.bat` outra vez.
