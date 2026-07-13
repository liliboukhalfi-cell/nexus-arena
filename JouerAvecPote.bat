@echo off
title Zone Hostile - Jouer avec un pote (LAN)
start "" powershell -ExecutionPolicy Bypass -File "%~dp0serve-lan.ps1"
timeout /t 3 /nobreak >nul
start "" http://localhost:5174
