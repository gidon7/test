# Cloudflare Workers 배포 가이드

## 1. Wrangler CLI 설치

```bash
npm install -g wrangler
```

## 2. Cloudflare 로그인

```bash
wrangler login
```

## 3. OpenAI API 키 설정

```bash
wrangler secret put OPENAI_API_KEY
```

프롬프트가 나오면 OpenAI API 키를 입력하세요.

## 4. 배포

```bash
wrangler deploy
```

## 5. 환경 변수 확인

Cloudflare Dashboard에서:
1. Workers & Pages → java-code-review 선택
2. Settings → Variables
3. `OPENAI_API_KEY`가 설정되어 있는지 확인

## 문제 해결

### "hello world"만 나오는 경우
- `worker.js` 파일이 제대로 배포되었는지 확인
- `wrangler.toml`의 `main` 필드가 `worker.js`인지 확인
- 배포 후 몇 분 기다린 후 다시 시도

### API 오류가 나는 경우
- OpenAI API 키가 제대로 설정되었는지 확인
- API 키에 충분한 크레딧이 있는지 확인

