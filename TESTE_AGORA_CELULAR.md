# 📱 Teste o Recuper.ai no seu celular AGORA (3 passos)

## Passo 1: Crie uma conta Vercel (1 minuto)
1. **Abra no celular:** https://vercel.com/signup
2. Clique **"Continue with GitHub"**
3. Se não tiver GitHub, clique "Sign up" lá e volte
4. **Confirme no email**

## Passo 2: Conecte ao projeto Recuper.ai (30 segundos)
1. **Abra este link no celular:**
   ```
   https://vercel.com/new?git-repository=https://github.com/recuperai-test/recuperai
   ```
   (Se não funcionar, vá em https://vercel.com, clique "Add New" > "Project", e procure por "recuperai")

2. Clique **"Import"** → **"Deploy"**

3. Aguarde 2-3 minutos (a Vercel tá buildando)

## Passo 3: Abra a URL que a Vercel te dá
Depois que terminar, a Vercel mostra um link tipo:
```
https://recuperai-xxxxx.vercel.app
```

**Clique nele no seu celular e pronto!** 🎉

---

## O que você vai ver

- **Dashboard** com R$ 82.400 em aberto, 340 clientes
- **Tela "IA negociando"** (a mais legal) — simule o cliente respondendo e veja o raciocínio da IA aparecer em tempo real
- **Importar CSV** com seus dados reais
- **Configurar regras** que a IA vai respeitar

---

## Problemas?

### "Não achei o repositório Recuper.ai"
- A gente precisa clonar o projeto pra sua conta GitHub primeiro
- **Abra no celular:** https://github.com/new
- Nome: `recuperai`
- Clique "Create"
- Depois volta pros passos acima

### "Ficou rodando por 10 minutos"
- Normal, às vezes a Vercel demora
- Aguarde mais um pouco
- Se passar de 15 min, reinicie

### "Dados sumiram quando recarreguei"
- Vercel limpa banco após 24h de inatividade
- Pro teste agora tá ok
- Pra produção, use Railway.app (tem Postgres grátis)

---

## Próximos passos (quando quiser)

1. **Com Claude de verdade:** Pegue chave em https://console.anthropic.com (US$5 free), vai em Vercel > Settings > Environment Variables, adiciona `ANTHROPIC_API_KEY`, redeploy
2. **Com dados reais:** Importa seu CSV de inadimplentes — sistema calcula risco sozinho
3. **Com WhatsApp:** Configure Z-API (opcional, modo demo funciona sem)

---

**Vá pra https://vercel.com/signup agora e comece!** ⏱️
