# 빠른 API 키 설정 가이드

## 방법 1: 스크립트 사용 (가장 쉬움)

### Windows (PowerShell)
```powershell
.\setup-api-key.ps1
```
API 키를 입력하면 자동으로 설정됩니다.

### Mac/Linux
```bash
chmod +x setup-api-key.sh
./setup-api-key.sh
```

## 방법 2: 한 줄 명령어

API 키를 알고 있다면:

```bash
# Windows PowerShell
$apiKey = "your-api-key-here"; wrangler secret put OPENAI_API_KEY

# Mac/Linux
echo "your-api-key-here" | wrangler secret put OPENAI_API_KEY
```

## 방법 3: 수동 설정

1. **터미널에서 실행**:
   ```bash
   wrangler secret put OPENAI_API_KEY
   ```

2. **프롬프트가 나오면**:
   - API 키를 붙여넣기
   - Enter 키 누르기

3. **재배포**:
   ```bash
   wrangler deploy
   ```

## OpenAI API 키 발급 (5분)

1. https://platform.openai.com/api-keys 접속
2. "Create new secret key" 클릭
3. 키 이름 입력 (선택사항)
4. 키 복사 (한 번만 표시됨!)
5. 위의 방법 중 하나로 설정

## 확인

설정 후 Java 파일을 업로드하면 AI 리뷰가 작동합니다!


