@echo off
chcp 65001 >nul
title Recuper.ai - servidor local
echo ============================================
echo    RECUPER.AI - rodando no seu PC
echo ============================================
echo.
echo [1/2] Instalando dependencias...
echo       (so demora na PRIMEIRA vez, depois e rapido)
echo.
call npm install
if errorlevel 1 (
  echo.
  echo *** ERRO ao instalar. O Node.js esta instalado?
  echo *** Baixe em https://nodejs.org ^(versao LTS^) e tente de novo.
  echo.
  pause
  exit /b
)
echo.
echo [2/2] Iniciando o servidor...
echo.
echo  ^>^>  No PC, abra:        http://localhost:3000
echo  ^>^>  No celular ^(mesma wifi^): http://SEU-IP:3000
echo      ^(descubra SEU-IP rodando "ipconfig" e pegando o IPv4^)
echo.
echo  Se o Windows perguntar sobre firewall, clique em PERMITIR.
echo  Para parar o servidor: feche esta janela.
echo.
call npm run dev -- -H 0.0.0.0
pause
