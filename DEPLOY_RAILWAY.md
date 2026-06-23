# 🚀 Deploy direto no celular (Railway) — 1 clique, 2 minutos

## O que é Railway
Railway é um serviço que:
- Detecta Next.js automaticamente
- Faz deploy em 2 minutos
- Inclui banco de dados Postgres grátis
- Funciona 100% do celular

## Passo 1: Suba pra GitHub
(Você consegue fazer do celular ou de qualquer PC por 2 min)

```bash
git init
git add .
git commit -m "recuperai inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/recuperai.git
git push -u origin main
```

## Passo 2: Deploy no Railway (100% do celular)

1. Vá em **https://railway.app** (abre no celular)
2. Clique "Login with GitHub" (ou crie conta)
3. Clique "New Project"
4. Escolha "Deploy from GitHub repo"
5. Selecione `recuperai`
6. Clique "Deploy"

**Pronto!** Em 2 minutos você tem um link como:
```
https://recuperai-prod-xxxxx.railway.app
```

## Passo 3: Teste no celular

Abra esse link no navegador do seu celular. Pronto, funciona igual no PC.

## Vantagens do Railway vs. Vercel
- ✅ Banco Postgres grátis (dados **persistem**)
- ✅ Deploy automático ao fazer push
- ✅ 500h/mês grátis (basta pra MVP)
- ✅ Sem limite de requisições

## Próximos passos
1. Importe sua planilha de inadimplentes (CSV)
2. Configure as regras da IA
3. Quando quiser Claude de verdade, adicione a chave no Railway:
   - Settings > Environment Variables
   - `ANTHROPIC_API_KEY=sk-ant-...`
   - Redeploy automático

