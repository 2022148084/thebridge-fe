# Hackathon Frontend Template

React, Vite, TypeScript, Bun 기반 해커톤용 프론트엔드 템플릿입니다.

백엔드는 로컬에서 먼저 실행되어 있어야 합니다.

```bash
http://localhost:8000
```

프론트는 로컬에서 Vite dev server로 실행하며 기본 주소는 `http://localhost:5173`입니다.

## Stack

- React
- Vite
- TypeScript
- Bun
- TanStack Router
- TanStack Query
- Tailwind CSS
- Biome
- generated OpenAPI client

## Setup

```bash
bun install
cp .env.example .env
bun run dev
```

브라우저에서 `http://localhost:5173`에 접속합니다.

## Environment Variables

로컬 개발 기본값:

```env
VITE_API_URL=http://localhost:8000
```

운영 배포에서는 같은 변수만 운영 API 주소로 바꾸면 됩니다.

```env
VITE_API_URL=https://api.example.com
```

API 주소는 코드에 하드코딩하지 않고 `VITE_API_URL`로 관리합니다.

## Scripts

```bash
bun run dev
bun run build
bun run lint
bun run generate-client
```

## OpenAPI Client

`src/client`는 generated OpenAPI client입니다. 백엔드 API가 바뀌면 백엔드를 `http://localhost:8000`에서 실행한 뒤 아래 명령으로 client를 다시 생성합니다.

```bash
bun run generate-client
```

기본 OpenAPI schema URL은 `http://localhost:8000/api/v1/openapi.json`입니다.

## Features Kept

- login
- signup
- logout
- protected routes
- current user lookup
- profile update
- password change for logged-in users
- account deletion
- admin users UI
- items CRUD

`Items`는 예시 CRUD 리소스입니다. 실제 프로젝트에서는 posts, projects, teams 같은 도메인 리소스로 교체해서 사용하면 됩니다.

## Build

```bash
bun run build
```

빌드 결과는 `dist`에 생성됩니다.

## Cloudflare Pages

Cloudflare Pages에서 프론트를 배포합니다. 백엔드는 OCI VM에서 FastAPI로 운영하는 구성을 전제로 합니다.

- Framework preset: `Vite`
- Build command: `bun install && bun run build`
- Build output directory: `dist`
- Production environment variable: `VITE_API_URL=https://api.example.com`
- Local environment variable: `VITE_API_URL=http://localhost:8000`

프론트용 Docker, Nginx 배포 설정은 사용하지 않습니다.
