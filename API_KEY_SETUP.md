# OpenAI API 키 설정 가이드

## 문제: "OpenAI API 키가 설정되지 않았습니다" 오류

코드 라인수는 나오지만 AI 리뷰가 작동하지 않는 경우, OpenAI API 키가 설정되지 않은 것입니다.

## 해결 방법

### 방법 1: Cloudflare Dashboard 사용 (권장)

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/ 접속
   - 로그인

2. **Worker 선택**
   - 왼쪽 메뉴에서 "Workers & Pages" 클릭
   - 배포한 Worker 선택 (예: `java-code-review`)

3. **Settings → Variables**
   - 상단 탭에서 "Settings" 클릭
   - 왼쪽 메뉴에서 "Variables" 클릭

4. **Secret 추가**
   - "Secrets" 섹션에서 "Add secret" 버튼 클릭
   - **Name**: `OPENAI_API_KEY` (정확히 이 이름으로!)
   - **Value**: OpenAI API 키 입력
   - "Encrypt" 버튼 클릭

5. **재배포**
   - 변경사항 저장 후 자동으로 적용됩니다
   - 또는 `wrangler deploy` 명령 실행

### 방법 2: Wrangler CLI 사용

```bash
# 1. Wrangler CLI 설치 (이미 설치했다면 생략)
npm install -g wrangler

# 2. Cloudflare 로그인 (이미 했다면 생략)
wrangler login

# 3. API 키 설정
wrangler secret put OPENAI_API_KEY

# 프롬프트가 나오면 OpenAI API 키 입력
# 입력한 키는 암호화되어 저장됩니다

# 4. 재배포
wrangler deploy
```

## OpenAI API 키 발급 방법

1. **OpenAI 웹사이트 접속**
   - https://platform.openai.com/ 접속
   - 로그인 또는 회원가입

2. **API Keys 페이지**
   - https://platform.openai.com/api-keys 접속
   - 또는 상단 메뉴에서 "API keys" 선택

3. **새 키 생성**
   - "Create new secret key" 클릭
   - 키 이름 입력 (선택사항)
   - "Create secret key" 클릭
   - **키를 복사해두세요!** (한 번만 표시됩니다)

4. **크레딧 확인**
   - API를 사용하려면 계정에 크레딧이 있어야 합니다
   - https://platform.openai.com/account/billing 에서 확인

## 확인 방법

API 키를 설정한 후:

1. Java 파일을 업로드
2. 코드 분석 결과 확인
3. "AI 코드 리뷰" 섹션에 상세한 리뷰가 표시되는지 확인

## 문제 해결

### 여전히 "API 키가 설정되지 않았습니다"가 나오는 경우

1. **변수 이름 확인**
   - 정확히 `OPENAI_API_KEY`인지 확인 (대소문자 구분)
   - 다른 이름으로 설정했다면 `OPENAI_API_KEY`로 변경

2. **재배포 확인**
   - Secret을 추가한 후 Worker를 재배포했는지 확인
   - Cloudflare Dashboard에서 "Deployments" 탭 확인

3. **환경 확인**
   - Production 환경에 배포했는지 확인
   - Preview 환경과 Production 환경의 Secret은 별도로 설정됩니다

4. **로그 확인**
   - Cloudflare Dashboard → Workers → 해당 Worker → Logs
   - 에러 메시지 확인

## 비용 안내

- OpenAI API는 사용량에 따라 과금됩니다
- GPT-4 모델 사용 시: 약 $0.03 per 1K input tokens, $0.06 per 1K output tokens
- 코드 리뷰 1회당 약 $0.10~0.30 정도 소요될 수 있습니다
- 무료 크레딧이 제공되는 경우도 있습니다

