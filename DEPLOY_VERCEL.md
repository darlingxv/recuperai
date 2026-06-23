# Deploy na Vercel (5 minutos)

## Passo 1: Crie uma conta GitHub grátis (se não tiver)
- https://github.com/signup
- Confirme o email

## Passo 2: Suba o projeto para GitHub
```bash
# Na pasta do projeto:
git init
git add .
git commit -m "Initial commit: Recuper.ai MVP"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/recuperai.git
git push -u origin main
```

## Passo 3: Conecte na Vercel
- Vá em https://vercel.com
- Clique "Sign Up" → "Continue with GitHub"
- Autorize a Vercel acessar seus repos
- Clique "Import Project" → selecione `recuperai`
- Clique "Deploy"

A Vercel detecta que é Next.js automaticamente. Em 2 minutos, seu app estará ao vivo em algo como:

```
https://recuperai-seu-username.vercel.app
```

## Passo 4: (Opcional) Adicione as chaves reais
1. No dashboard da Vercel, vá em **Settings** > **Environment Variables**
2. Adicione (deixe vazio se não tiver):
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ZAPI_INSTANCE_ID = ...
   ZAPI_TOKEN = ...
   ASAAS_API_KEY = ...
   ```
3. Redeploy (Settings > Redeploy)

Depois disso, a IA usa Claude de verdade, e as mensagens realmente vão pro WhatsApp.

## ⚠️ Limitação importante
O banco de dados no Vercel é **efêmero** (desaparece após 24h de inatividade). Isso quer dizer:
- Você consegue testar tudo
- Mas os dados não persistem entre acessos
- Para produção, você precisa de um banco real (Supabase, PostgreSQL)

Se quiser persistência **no teste**, faça o deploy num serviço com banco grátis:
- **Railway.app** (banco Postgres grátis)
- **Render.com** (idem)

Mas Vercel pura basta para ver o produto rodando agora.
