// Cloudflare Pages용 Worker
// Pages는 정적 파일을 서빙하고, 이 Worker는 API 요청을 처리합니다

import { JavaCodeAnalyzer, analyzeCodeStructure } from './worker.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // OPTIONS 요청 처리
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders, status: 204 });
    }

    // API 엔드포인트만 처리 (정적 파일은 Pages가 자동으로 서빙)
    if (url.pathname === '/api/review' && method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
          return new Response(
            JSON.stringify({ error: '파일이 없습니다.' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        if (!file.name.endsWith('.java')) {
          return new Response(
            JSON.stringify({ error: 'Java 파일만 업로드 가능합니다.' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }

        // 파일 내용 읽기
        const codeContent = await file.text();

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
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // API가 아닌 요청은 Pages가 처리하도록 pass
    return env.ASSETS.fetch(request);
  },
};
