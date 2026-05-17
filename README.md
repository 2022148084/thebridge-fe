# The Bridge Frontend

The Bridge Hackathon 2026 Team 10 프론트엔드입니다. React, Vite, TypeScript, Bun 기반으로 만든 위치 기반 웰니스 모임 서비스이며, 사용자는 지도에서 주변 모임과 친구 위치를 확인하고 AI Coach의 추천을 받아 함께 운동할 수 있습니다.

## 주요 기능

- 로그인, 회원가입, 로그아웃
- 인증된 사용자 전용 라우트
- Google Maps 기반 현재 위치, 친구 위치, 모임 위치 표시
- 위치와 채팅 맥락을 활용한 AI Coach 모임 추천
- 모임 생성, 상세 보기, 참여, 수정, 삭제
- 참여/주최한 모임 히스토리 확인
- 친구 검색, 친구 요청, 요청 수락/거절, 친구 삭제
- 프로필, 설정, 외형 변경 UI
- 관리자 사용자 관리 UI

## 기술 스택

- React 19
- Vite 7
- TypeScript
- Bun
- TanStack Router
- TanStack Query
- Tailwind CSS
- shadcn 스타일 UI 컴포넌트
- Google Maps API (`@vis.gl/react-google-maps`)
- Hey API OpenAPI client
- Biome

## 시작하기

### 1. 의존성 설치

```bash
bun install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 API 서버와 Google Maps API 키를 설정합니다.

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

로컬 백엔드 기본 주소는 `http://localhost:8000`입니다. 배포 환경에서는 `VITE_API_URL`만 운영 API 주소로 바꾸면 됩니다. 백엔드 주소를 소스 코드에 직접 넣지 마세요.

### 3. 개발 서버 실행

```bash
bun run dev
```

기본 프론트엔드 주소는 `http://localhost:5173`입니다.

## 스크립트

```bash
bun run dev
bun run build
bun run lint
bun run generate-client
```

- `bun run dev`: Vite 개발 서버 실행
- `bun run build`: TypeScript 검사 후 프로덕션 빌드
- `bun run lint`: Biome 검사
- `bun run generate-client`: OpenAPI 스키마에서 `src/client` 재생성

## OpenAPI Client

`src/client`는 `@hey-api/openapi-ts`로 생성된 코드입니다. 백엔드 API 스키마가 바뀌면 직접 수정하지 말고 아래 명령으로 다시 생성합니다.

```bash
bun run generate-client
```

현재 생성 설정은 [openapi-ts.config.ts](./openapi-ts.config.ts)에 있습니다.

## 프로젝트 구조

```text
src/
  client/              generated OpenAPI client
  components/
    Auth/              login/signup form
    Chat/              AI Coach recommendation UI
    Events/            gathering create/edit/detail UI
    Friends/           friend-related route UI
    Nav/               bottom navigation
    Profile/           profile UI
    Settings/          settings UI
    ui/                reusable UI primitives
  hooks/               auth and shared hooks
  lib/                 local utilities and state helpers
  routes/              TanStack Router file routes
```

주요 라우트:

- `/login`: 로그인/회원가입 진입 화면
- `/map`: 지도, 위치, 모임, AI Coach
- `/friends`: 친구 목록, 검색, 요청 관리
- `/history`: 주최/참여 모임 기록
- `/admin`: 관리자 사용자 관리

## 환경 변수

| 변수 | 설명 | 로컬 기본값 |
| --- | --- | --- |
| `VITE_API_URL` | 백엔드 API 서버 주소 | `http://localhost:8000` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API 키 | 없음 |

## 빌드

```bash
bun run build
```

빌드 결과는 `dist`에 생성됩니다.

## 배포

프론트엔드는 Cloudflare Pages 배포를 기준으로 합니다.

- Framework preset: `Vite`
- Build command: `bun install && bun run build`
- Build output directory: `dist`
- Production environment variable: `VITE_API_URL=https://api.example.com`

프론트엔드용 Docker, Nginx, Compose, Traefik 설정은 이 저장소에 추가하지 않습니다.

## 개발 규칙

- 패키지 매니저는 Bun만 사용합니다.
- `src/client`는 생성 코드로 유지합니다.
- API 주소는 `VITE_API_URL`로 관리합니다.
- 비밀번호 재설정/메일 관련 UI는 추가하지 않습니다.
- 로그인한 사용자의 비밀번호 변경 기능은 유지합니다.
