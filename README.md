# Shuls Extension

Sistema de lealtad para el canal de Shuls - Conecta Twitch y Kick con un sistema de puntos, watch time y rewards.

## Estructura

```
Shuls-Extension/
├── backend/          # API REST (Express + SQLite)
├── extension/        # Chrome Extension (Manifest V3)
├── web/              # Dashboard web (React + Vite)
└── package.json      # Monorepo root
```

## Features

- **Sistema de Puntos**: Los viewers acumulan puntos por ver el stream en Kick
- **Migración de Twitch**: Reclamar puntos de canal de Twitch en el nuevo sistema
- **Watch Time**: Trackeo de tiempo visto en el canal
- **Racha de Streams**: Contador de streams consecutivos vistos
- **Chat Overlay**: Modificación visual del chat de Kick (badges, colores, emotes)
- **Rewards**: Sistema de recompensas canjeables desde la web/extensión

## Setup

```bash
# Instalar todo
npm run install:all

# Backend (API)
npm run backend:dev

# Web (Dashboard)
npm run web
```

## Tech Stack

- **Backend**: Node.js, Express, SQLite (Prisma ORM), JWT auth
- **Extension**: Chrome Manifest V3, Content Scripts, Popup UI
- **Web**: React, Vite, TailwindCSS, shadcn/ui
