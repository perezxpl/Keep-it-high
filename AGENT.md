# Instrukcje dla Agenta AI (Projekt: Keep-it-high)

## Korzystanie z CodeGraph (MCP)
- **Zasada Główna**: Przed rozpoczęciem jakiejkolwiek analizy kodu, szukaniem funkcji, zmiennych czy powiązań między plikami JS, ZAWSZE używaj narzędzia CodeGraph MCP (`codegraph_explore`).
- **Zakaz**: Nie przeszukuj całego repozytorium tekstem (narzędziami typu grep/find), jeśli możesz pobrać strukturę obiektów z bazy CodeGraph. Oszczędzaj tokeny i czas kontekstu.

## Specyfika Projektu (JavaScript / Gra)
- Projekt to gra napisana w czystym JavaScript. Główne pliki logiki znajdują się w folderze `js/` (np. `main.js`, `bot.js`, `physics.js`).
- Po każdej większej refaktoryzacji kodu lub dodaniu nowego pliku skryptowego, przypomnij użytkownikowi lub sam uruchom wbudowane narzędzie synchronizacji CodeGraph, aby zaktualizować bazę danych.
