# STEP - 학교평가 및 교육계획 수립 자동화 플랫폼

STEP은 학교평가와 교육계획 수립을 자동화하여 교사의 업무 효율성을 극대화하는 통합 플랫폼입니다.
복잡한 데이터를 손쉽게 수집, 분석하고 AI를 활용하여 의미 있는 인사이트를 도출합니다.

## ✨ 주요 기능 (Key Features)

*   **📊 대시보드 (Dashboard)**: 학교 평가 진행 상황과 주요 지표를 한눈에 파악할 수 있습니다.
*   **📝 설문조사 (Surveys)**: 학생, 학부모, 교사 대상 설문조사를 생성하고 배포하여 데이터를 수집합니다.
*   **🤖 AI 분석 (AI Analysis)**: Google Gemini API를 활용하여 수집된 데이터를 심층 분석하고 개선점을 제안합니다.
*   **📈 프로젝트 관리**: 학교별, 연도별 평가 프로젝트를 체계적으로 관리합니다.
*   **📱 반응형 디자인**: PC와 모바일 어디서든 편리하게 접근 가능합니다.

## 🛠️ 기술 스택 (Tech Stack)

### Frontend
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, shadcn/ui
*   **State Management**: Tanstack Query
*   **Routing**: React Router

### Backend & Infrastructure
*   **Database**: Firebase Firestore, Supabase
*   **Serverless**: Firebase Cloud Functions
*   **Hosting**: Firebase Hosting
*   **AI**: Google Generative AI (Gemini)

## 🌐 서비스 접속 (Service Access)

[https://step-school-eval.web.app](https://step-school-eval.web.app)

### 🔑 테스트 계정 (Test Account)
*   **학교 코드 (School Code)**: `SD1004`
*   **비밀번호 (Password)**: `1234`

## 🚀 시작하기 (Getting Started)

### 필수 요구사항 (Prerequisites)
*   Node.js (v18 이상 권장)
*   npm

### 설치 (Installation)

1. 저장소를 클론합니다.
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. 의존성을 설치합니다.
   ```bash
   npm install
   ```

3. 개발 서버를 실행합니다.
   ```bash
   npm run dev
   ```

## 📦 배포 (Deployment)

이 프로젝트는 Firebase Hosting을 사용하여 배포됩니다.

```bash
npm run build
firebase deploy
```

## 📄 라이선스 (License)

Copyright © 2025 STEP. All rights reserved.
