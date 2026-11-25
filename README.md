# NutriBarkod Web Dashboard

A barcode-based product analysis dashboard with ingredient filtering and user profile/history screens. This repository contains the React frontend; the API backend is maintained separately.

## Features

- Barcode scanning and product lookup interface
- Product ingredient and nutrition analysis views
- Personalized ingredient filters
- User profile and analysis history screens

## Architecture

The Vite application provides the browser UI and sends API requests to a separately hosted backend. Authentication, product analysis, and user data require that backend to be available.

## Tech stack

- React, TypeScript, Vite
- Tailwind CSS and shadcn/ui
- ZXing barcode scanning

## Requirements

- Node.js 20+
- npm
- A compatible backend for API-dependent features

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

In PowerShell, copy the environment template with `Copy-Item .env.example .env.local`. Vite prints the local development URL in the terminal.

## Configuration

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API root URL; do not append `/api` | `http://127.0.0.1:8000` |

Vite variables are bundled into browser code. Do not put passwords, private keys, or other secrets in them. Keep local overrides in `.env.local`, which is excluded from Git.

## Production build

```bash
npm run build
npm run preview
```

The production bundle is written to `dist/`. Configure the API URL in the deployment environment and set up HTTPS, CORS, and authentication on the backend.

## Design and attributions

The interface was designed in Figma: [NutriBarkod Web Dashboard Design](https://www.figma.com/design/noGvatBJTVbgsOD1pn6uCm/NutriBarkod-Web-Dashboard-Design). See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for third-party components and image credits.

## License

Original code in this repository is distributed under the [MIT License](LICENSE). Third-party assets may have separate terms; see the attribution file.
