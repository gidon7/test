#!/bin/bash
# OpenAI API 키 설정 스크립트 (Bash)

echo "=== OpenAI API 키 설정 ==="
echo ""

# API 키 입력 받기
read -p "OpenAI API 키를 입력하세요: " apiKey

if [ -z "$apiKey" ]; then
    echo "API 키가 입력되지 않았습니다."
    exit 1
fi

echo ""
echo "API 키를 Cloudflare Workers에 설정하는 중..."

# Wrangler를 사용하여 API 키 설정
echo "$apiKey" | wrangler secret put OPENAI_API_KEY

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ API 키가 성공적으로 설정되었습니다!"
    echo ""
    echo "이제 다음 명령어로 재배포하세요:"
    echo "  wrangler deploy"
else
    echo ""
    echo "❌ 오류가 발생했습니다."
    echo ""
    echo "수동으로 설정하려면 다음 명령어를 실행하세요:"
    echo "  wrangler secret put OPENAI_API_KEY"
    echo "그리고 프롬프트가 나오면 API 키를 입력하세요."
fi


