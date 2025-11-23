# Java 코드 리뷰 시스템

Java 파일을 업로드하면 코드를 분석하고 설명해주며, 더 나은 방향을 제시해주는 AI 기반 코드 리뷰 시스템입니다.

## 기능

- 📤 Java 파일 업로드
- 🔍 코드 자동 분석 및 설명
- 💡 개선 방향 제시
- 📊 코드 품질 평가
- 🎯 Best Practice 추천

## 설치 방법

```bash
pip install -r requirements.txt
```

## 환경 변수 설정

`.env` 파일을 생성하고 OpenAI API 키를 설정하세요:

```
OPENAI_API_KEY=your_api_key_here
```

## 실행 방법

```bash
uvicorn app:app --reload
```

브라우저에서 `http://localhost:8000` 접속

## 사용 방법

1. 웹 인터페이스에서 Java 파일 업로드
2. AI가 코드를 분석하고 설명 제공
3. 개선 제안 및 Best Practice 확인
