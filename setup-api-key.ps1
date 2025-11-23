# OpenAI API 키 설정 스크립트 (PowerShell)

Write-Host "=== OpenAI API 키 설정 ===" -ForegroundColor Cyan
Write-Host ""

# API 키 입력 받기
$apiKey = Read-Host "OpenAI API 키를 입력하세요"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "API 키가 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "API 키를 Cloudflare Workers에 설정하는 중..." -ForegroundColor Yellow

# Wrangler를 사용하여 API 키 설정
try {
    wrangler secret put OPENAI_API_KEY --env production
    
    Write-Host ""
    Write-Host "프롬프트가 나오면 위에서 입력한 API 키를 붙여넣으세요." -ForegroundColor Yellow
    Write-Host "그리고 Enter를 누르면 설정이 완료됩니다." -ForegroundColor Yellow
    Write-Host ""
    
    # API 키를 파이프로 전달
    $apiKey | wrangler secret put OPENAI_API_KEY
    
    Write-Host ""
    Write-Host "✅ API 키가 성공적으로 설정되었습니다!" -ForegroundColor Green
    Write-Host ""
    Write-Host "이제 다음 명령어로 재배포하세요:" -ForegroundColor Cyan
    Write-Host "  wrangler deploy" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ 오류가 발생했습니다: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "수동으로 설정하려면 다음 명령어를 실행하세요:" -ForegroundColor Yellow
    Write-Host "  wrangler secret put OPENAI_API_KEY" -ForegroundColor White
    Write-Host "그리고 프롬프트가 나오면 API 키를 입력하세요." -ForegroundColor Yellow
}

