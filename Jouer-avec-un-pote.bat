@echo off
title Zone Hostile - Jouer avec un pote (meme Wi-Fi)
REM Lance le serveur reseau dans une fenetre visible (affiche l'adresse a partager)
start "Zone Hostile - serveur reseau" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-lan.ps1"
REM Laisse le serveur demarrer, puis ouvre le jeu sur CE PC
timeout /t 3 /nobreak >nul
start "" http://localhost:5174
