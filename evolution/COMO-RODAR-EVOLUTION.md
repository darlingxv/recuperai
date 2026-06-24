# Rodar a Evolution API (WhatsApp gratis, sem limite de numeros)

A Evolution e open-source: voce roda ela no seu PC com o Docker. E gratis e
envia para qualquer numero (diferente do trial da Z-API).

## Passo 1 - Instalar o Docker Desktop
Baixe em https://www.docker.com/products/docker-desktop e instale.
Abra o Docker Desktop e deixe ele rodando (icone da baleia na barra).

## Passo 2 - Subir a Evolution
1. Abra o Prompt de Comando dentro desta pasta "evolution"
2. (Opcional) Edite o docker-compose.yml e troque a linha
   AUTHENTICATION_API_KEY por uma senha sua (anote, vai precisar).
3. Rode:  docker compose up -d
4. Espere ~1 minuto. Pronto, a Evolution esta no ar.

## Passo 3 - Conectar o WhatsApp (pelo painel)
1. Abra http://localhost:8080/manager no navegador
2. Faca login com a chave (AUTHENTICATION_API_KEY do passo 2)
3. Clique em "Instance" / "Create Instance"
   - Name (nome): recuperai
   - Integration: WHATSAPP-BAILEYS
   - Crie e clique em conectar -> aparece um QR Code
4. No celular: WhatsApp > Aparelhos conectados > Conectar aparelho > escaneie o QR
   Quando ficar "open"/conectado, esta pronto.

## Passo 4 - Apontar o Recuper.ai para a Evolution
No arquivo .env.local do Recuper.ai, descomente e preencha:

    EVOLUTION_API_URL=http://localhost:8080
    EVOLUTION_API_KEY=a-chave-que-voce-definiu-no-passo-2
    EVOLUTION_INSTANCE=recuperai

Reinicie o Recuper.ai (feche e rode o INICIAR-WINDOWS.bat de novo).
Em Regras, o "Provedor" deve mudar para Evolution API.

## Passo 5 - Receber mensagens (webhook)
No painel da Evolution (Manager), na instancia "recuperai", abra "Webhook":
- Enabled: ligado
- URL:  http://host.docker.internal:3000/api/webhook/evolution
  (host.docker.internal = seu PC, visto de dentro do Docker)
- Events: marque MESSAGES_UPSERT
- webhook_by_events: desligado
Salve.

Agora teste: em Regras, use "Enviar mensagem de teste" para outro numero
(deve chegar!), e mande uma mensagem do seu celular para o numero conectado
(deve aparecer no Recuper.ai e a IA responde).

## Dicas
- Parar a Evolution:  docker compose down   (os dados ficam salvos)
- Ver logs:           docker compose logs -f evolution-api
- QR Code nao gera? Ja deixamos a variavel CONFIG_SESSION_PHONE_VERSION no
  docker-compose.yml (versao do WhatsApp Web). Se um dia parar de novo, atualize
  esse numero para uma versao recente e rode "docker compose down" e "up -d".
- Documentacao oficial: https://doc.evolution-api.com/v2/en/install/docker
- Se a imagem :v2.1.1 der erro, troque por :latest no docker-compose.yml
