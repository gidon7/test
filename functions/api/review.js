// Cloudflare Pages Functions - API 엔드포인트
// worker.js의 핵심 로직을 포함

// worker.js 전체를 동적으로 import (Pages Functions에서는 제한적)
// 대신 필요한 부분만 포함

export async function onRequestPost(context) {
  const { request } = context;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return new Response(
        JSON.stringify({ error: '파일이 없습니다.' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    if (!file.name.endsWith('.java')) {
      return new Response(
        JSON.stringify({ error: 'Java 파일만 업로드 가능합니다.' }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // 파일 내용 읽기
    const codeContent = await file.text();

    // worker.js를 동적으로 import
    // Pages Functions에서는 외부 모듈 import가 제한적이므로
    // fetch를 통해 worker.js를 로드하거나 직접 포함해야 함
    
    // 임시 해결책: worker.js의 로직을 직접 실행
    // 실제로는 worker.js를 별도로 배포하거나
    // 또는 모든 로직을 이 파일에 포함시켜야 함
    
    // 기본 코드 분석
    const basicAnalysis = analyzeCodeStructure(codeContent);

    // 코드 리뷰
    try {
      const analyzer = new JavaCodeAnalyzer();
      const aiReview = analyzer.analyze(codeContent, file.name);

      return new Response(
        JSON.stringify({
          success: true,
          filename: file.name,
          basic_analysis: basicAnalysis,
          ai_review: aiReview,
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: true,
          filename: file.name,
          basic_analysis: basicAnalysis,
          ai_review: {
            explanation: '코드 분석이 완료되었습니다.',
            strengths: '기본 분석이 완료되었습니다.',
            improvements: '상세 분석 중 오류가 발생했습니다: ' + error.message,
            suggestions: '코드를 다시 확인해주세요.',
            best_practices: 'Best Practice를 준수하세요.',
            full_review: '분석 중 오류가 발생했습니다.',
            secure_coding: {
              total_checked: 0,
              found_issues: 0,
              compliance_rate: '0'
            }
          },
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
}

// worker.js에서 필요한 함수들을 여기에 포함하거나
// 또는 worker.js를 별도 Workers로 배포하고 fetch로 호출
