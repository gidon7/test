# Cloudflare Pages 배포 가이드

## 문제점
Cloudflare Pages는 정적 사이트 호스팅이므로, Workers와는 다른 배포 방식이 필요합니다.

## 해결 방법

### 방법 1: Workers를 그대로 사용 (권장)
Pages 대신 Workers를 계속 사용하는 것이 가장 간단합니다.

```bash
wrangler deploy
```

### 방법 2: Pages + Workers 통합
1. HTML/CSS/JS는 Pages에 배포
2. API는 별도 Workers로 배포
3. 프론트엔드에서 Workers API를 호출

### 방법 3: Pages Functions 사용
`functions/api/review.js`를 사용하되, worker.js의 로직을 포함시켜야 합니다.

## 현재 상태
- `index.html`: Pages 루트에 배치됨
- `static/`: 정적 파일 폴더
- `functions/api/review.js`: Pages Functions API 엔드포인트
- `worker.js`: Workers용 코드 (export 추가됨)

## 권장 사항
Workers를 계속 사용하는 것을 권장합니다. Pages로 변경하려면:
1. worker.js의 모든 로직을 functions/api/review.js에 포함시키거나
2. 별도 Workers를 배포하고 프론트엔드에서 호출


