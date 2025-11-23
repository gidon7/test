// Cloudflare Workers용 Java 코드 리뷰 시스템

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

    // 루트 경로 - HTML 반환
    if (url.pathname === '/' && method === 'GET') {
      const html = getHTML();
      return new Response(html, {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    // API 엔드포인트
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

        // AI 리뷰
        // 환경 변수에서 API 키 가져오기 (여러 가능한 이름 시도)
        const apiKey = env.OPENAI_API_KEY || env.OPENAI_KEY || env.API_KEY;
        const aiReview = await getAIReview(codeContent, file.name, apiKey);

        return new Response(
          JSON.stringify({
            success: true,
            filename: file.name,
            basic_analysis: basicAnalysis,
            ai_review: aiReview,
            api_key_configured: !!apiKey,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
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

    return new Response('Not Found', { status: 404 });
  },
};

// 기본 코드 구조 분석
function analyzeCodeStructure(code) {
  const lines = code.split('\n');
  const totalLines = lines.length;
  const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//'));

  // 클래스 개수
  const classCount = (code.match(/\bclass\s+\w+/g) || []).length;

  // 메서드 개수
  const methodCount = (code.match(/\b(public|private|protected)\s+\w+\s+\w+\s*\([^)]*\)\s*\{/g) || []).length;

  // 주석 비율
  const commentLines = lines.filter(line => line.trim().startsWith('//') || line.includes('/*')).length;
  const commentRatio = totalLines > 0 ? (commentLines / totalLines * 100) : 0;

  // 복잡도 추정
  const complexity = Math.abs(code.split('{').length - code.split('}').length);

  return {
    total_lines: totalLines,
    code_lines: codeLines.length,
    class_count: classCount,
    method_count: methodCount,
    comment_ratio: Math.round(commentRatio * 100) / 100,
    estimated_complexity: complexity,
  };
}

// AI 리뷰 가져오기
async function getAIReview(code, filename, apiKey) {
  if (!apiKey) {
    return {
      explanation: '⚠️ OpenAI API 키가 설정되지 않았습니다.\n\nCloudflare Workers에서 API 키를 설정하려면:\n1. Cloudflare Dashboard → Workers & Pages → 해당 Worker 선택\n2. Settings → Variables → Secrets\n3. "Add secret" 클릭\n4. Name: OPENAI_API_KEY\n5. Value: your_api_key_here\n\n또는 Wrangler CLI 사용:\nwrangler secret put OPENAI_API_KEY',
      strengths: 'API 키를 설정하면 AI 기반 코드 리뷰를 받을 수 있습니다.',
      improvements: '현재는 기본 코드 분석만 제공됩니다.',
      suggestions: 'OpenAI API 키를 설정하여 AI 코드 리뷰 기능을 활성화하세요.',
      best_practices: 'API 키는 Secrets로 관리하여 안전하게 보관하세요.',
      error: 'API key not configured',
      full_review: 'OpenAI API 키가 설정되지 않아 AI 리뷰를 제공할 수 없습니다. 위의 안내를 따라 API 키를 설정해주세요.',
    };
  }

  const prompt = `다음 Java 코드를 분석하고 리뷰해주세요.

파일명: ${filename}

코드:
\`\`\`java
${code}
\`\`\`

다음 항목에 대해 상세히 설명해주세요:
1. 코드 설명: 이 코드가 무엇을 하는지 설명
2. 장점: 코드의 좋은 점
3. 개선점: 개선할 수 있는 부분과 이유
4. 개선 제안: 구체적인 개선 코드 예시
5. Best Practice: Java Best Practice 관점에서의 제안

한국어로 답변해주세요.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '당신은 경험이 풍부한 Java 코드 리뷰어입니다. 코드를 분석하고 구체적이고 실용적인 개선 제안을 제공합니다.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    const reviewText = data.choices[0].message.content;

    return {
      explanation: extractSection(reviewText, '코드 설명', '장점'),
      strengths: extractSection(reviewText, '장점', '개선점'),
      improvements: extractSection(reviewText, '개선점', '개선 제안'),
      suggestions: extractSection(reviewText, '개선 제안', 'Best Practice'),
      best_practices: extractSection(reviewText, 'Best Practice', null),
      full_review: reviewText,
    };
  } catch (error) {
    return {
      explanation: '코드 분석 중 오류가 발생했습니다.',
      error: error.message,
    };
  }
}

// 섹션 추출
function extractSection(text, startKeyword, endKeyword) {
  if (!text.includes(startKeyword)) {
    return '';
  }

  const startIdx = text.indexOf(startKeyword);
  if (endKeyword) {
    const endIdx = text.indexOf(endKeyword, startIdx);
    if (endIdx === -1) {
      return text.substring(startIdx).trim();
    }
    return text.substring(startIdx, endIdx).trim();
  }

  return text.substring(startIdx).trim();
}

// HTML 생성
function getHTML() {
  const css = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;padding:20px}.container{max-width:1200px;margin:0 auto;background:white;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.3);padding:40px}header{text-align:center;margin-bottom:40px}header h1{color:#333;font-size:2.5em;margin-bottom:10px}.subtitle{color:#666;font-size:1.1em}.upload-section{margin-bottom:40px}.upload-box{max-width:600px;margin:0 auto}.upload-area{border:3px dashed #667eea;border-radius:15px;padding:60px 20px;text-align:center;cursor:pointer;transition:all 0.3s;background:#f8f9fa}.upload-area:hover{background:#e9ecef;border-color:#764ba2;transform:translateY(-2px)}.upload-icon{font-size:4em;margin-bottom:20px}.upload-text{font-size:1.2em;color:#333;margin-bottom:10px;font-weight:bold}.upload-hint{font-size:0.9em;color:#666}.file-info{display:flex;align-items:center;justify-content:space-between;background:#e3f2fd;padding:15px 20px;border-radius:10px;margin-top:20px;max-width:600px;margin-left:auto;margin-right:auto}.clear-btn{background:#f44336;color:white;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:1.2em;transition:transform 0.2s}.clear-btn:hover{transform:scale(1.1)}.loading{text-align:center;padding:40px}.spinner{border:4px solid #f3f3f3;border-top:4px solid #667eea;border-radius:50%;width:50px;height:50px;animation:spin 1s linear infinite;margin:0 auto 20px}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}.results-section{margin-top:40px}.basic-analysis{background:#f8f9fa;border-radius:15px;padding:30px;margin-bottom:30px}.basic-analysis h2{color:#333;margin-bottom:20px;font-size:1.5em}.stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px}.stat-item{background:white;padding:20px;border-radius:10px;text-align:center;box-shadow:0 2px 5px rgba(0,0,0,0.1)}.stat-label{color:#666;font-size:0.9em;margin-bottom:10px}.stat-value{color:#667eea;font-size:2em;font-weight:bold}.ai-review{background:#f8f9fa;border-radius:15px;padding:30px}.ai-review h2{color:#333;margin-bottom:20px;font-size:1.5em}.review-section{background:white;padding:20px;border-radius:10px;margin-bottom:20px;border-left:4px solid #667eea}.review-section h3{color:#667eea;margin-bottom:15px;font-size:1.2em}.review-section p{color:#555;line-height:1.8;white-space:pre-wrap}.error-message{background:#fee;color:#c33;padding:15px;border-radius:10px;margin-top:20px;text-align:center}@media (max-width:768px){.container{padding:20px}header h1{font-size:1.8em}.stats-grid{grid-template-columns:1fr}}`;

  const js = `let selectedFile=null;document.getElementById('fileInput').addEventListener('change',function(e){const file=e.target.files[0];if(file){if(!file.name.endsWith('.java')){showError('Java 파일만 업로드 가능합니다.');return}selectedFile=file;showFileInfo(file.name)}});const uploadArea=document.querySelector('.upload-area');uploadArea.addEventListener('dragover',(e)=>{e.preventDefault();uploadArea.style.background='#e9ecef'});uploadArea.addEventListener('dragleave',()=>{uploadArea.style.background='#f8f9fa'});uploadArea.addEventListener('drop',(e)=>{e.preventDefault();uploadArea.style.background='#f8f9fa';const file=e.dataTransfer.files[0];if(file&&file.name.endsWith('.java')){selectedFile=file;document.getElementById('fileInput').files=e.dataTransfer.files;showFileInfo(file.name)}else{showError('Java 파일만 업로드 가능합니다.')}});function showFileInfo(fileName){document.getElementById('fileName').textContent=fileName;document.getElementById('fileInfo').style.display='flex';document.getElementById('uploadBox').style.display='none';setTimeout(()=>{reviewCode()},500)}function clearFile(){selectedFile=null;document.getElementById('fileInput').value='';document.getElementById('fileInfo').style.display='none';document.getElementById('uploadBox').style.display='block';document.getElementById('resultsSection').style.display='none';document.getElementById('errorMessage').style.display='none'}async function reviewCode(){if(!selectedFile){showError('파일을 선택해주세요.');return}const loading=document.getElementById('loading'),resultsSection=document.getElementById('resultsSection'),errorMessage=document.getElementById('errorMessage');loading.style.display='block';resultsSection.style.display='none';errorMessage.style.display='none';try{const formData=new FormData();formData.append('file',selectedFile);const response=await fetch('/api/review',{method:'POST',body:formData}),data=await response.json();if(!response.ok){throw new Error(data.error||'리뷰 중 오류가 발생했습니다.')}if(data.success){displayResults(data)}else{showError(data.error||'리뷰 중 오류가 발생했습니다.')}}catch(error){showError(error.message)}finally{loading.style.display='none'}}function displayResults(data){const resultsSection=document.getElementById('resultsSection'),basicAnalysis=document.getElementById('basicAnalysis'),aiReview=document.getElementById('aiReview');const analysis=data.basic_analysis;basicAnalysis.innerHTML='<h2>📊 코드 분석</h2><div class="stats-grid"><div class="stat-item"><div class="stat-label">총 라인 수</div><div class="stat-value">'+analysis.total_lines+'</div></div><div class="stat-item"><div class="stat-label">코드 라인</div><div class="stat-value">'+analysis.code_lines+'</div></div><div class="stat-item"><div class="stat-label">클래스 수</div><div class="stat-value">'+analysis.class_count+'</div></div><div class="stat-item"><div class="stat-label">메서드 수</div><div class="stat-value">'+analysis.method_count+'</div></div><div class="stat-item"><div class="stat-label">주석 비율</div><div class="stat-value">'+analysis.comment_ratio+'%</div></div><div class="stat-item"><div class="stat-label">복잡도</div><div class="stat-value">'+analysis.estimated_complexity+'</div></div></div>';const review=data.ai_review;const hasApiKey=data.api_key_configured!==false;aiReview.innerHTML='<h2>🤖 AI 코드 리뷰'+(!hasApiKey?' <span style="color:#f44336;font-size:0.6em;">(API 키 미설정)</span>':'')+'</h2>'+(!hasApiKey?'<div class="review-section" style="border-left-color:#f44336;background:#fff3cd;"><h3>⚠️ OpenAI API 키 설정 필요</h3><p style="color:#856404;">AI 코드 리뷰 기능을 사용하려면 OpenAI API 키를 설정해야 합니다.<br><br><strong>설정 방법:</strong><br>1. Cloudflare Dashboard 접속<br>2. Workers & Pages → 해당 Worker 선택<br>3. Settings → Variables → Secrets<br>4. "Add secret" 클릭<br>5. Name: <code>OPENAI_API_KEY</code><br>6. Value: API 키 입력<br><br>또는 Wrangler CLI 사용:<br><code>wrangler secret put OPENAI_API_KEY</code></p></div>':'')+(review.explanation?'<div class="review-section"><h3>📝 코드 설명</h3><p>'+review.explanation+'</p></div>':'')+(review.strengths?'<div class="review-section"><h3>✅ 장점</h3><p>'+review.strengths+'</p></div>':'')+(review.improvements?'<div class="review-section"><h3>🔧 개선점</h3><p>'+review.improvements+'</p></div>':'')+(review.suggestions?'<div class="review-section"><h3>💡 개선 제안</h3><p>'+review.suggestions+'</p></div>':'')+(review.best_practices?'<div class="review-section"><h3>⭐ Best Practice</h3><p>'+review.best_practices+'</p></div>':'')+(review.full_review?'<div class="review-section"><h3>📄 전체 리뷰</h3><p>'+review.full_review+'</p></div>':'');resultsSection.style.display='block'}function showError(message){const errorMessage=document.getElementById('errorMessage');errorMessage.textContent=message;errorMessage.style.display='block'}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Java 코드 리뷰 시스템</title>
    <style>${css}</style>
</head>
<body>
    <div class="container">
        <header>
            <h1>☕ Java 코드 리뷰 시스템</h1>
            <p class="subtitle">AI 기반 코드 분석 및 개선 제안</p>
        </header>
        <div class="upload-section">
            <div class="upload-box" id="uploadBox">
                <input type="file" id="fileInput" accept=".java" style="display: none;">
                <div class="upload-area" onclick="document.getElementById('fileInput').click()">
                    <div class="upload-icon">📁</div>
                    <p class="upload-text">Java 파일을 클릭하거나 드래그하여 업로드</p>
                    <p class="upload-hint">.java 파일만 지원됩니다</p>
                </div>
            </div>
            <div class="file-info" id="fileInfo" style="display: none;">
                <span id="fileName"></span>
                <button onclick="clearFile()" class="clear-btn">✕</button>
            </div>
        </div>
        <div class="loading" id="loading" style="display: none;">
            <div class="spinner"></div>
            <p>코드를 분석하는 중...</p>
        </div>
        <div class="results-section" id="resultsSection" style="display: none;">
            <div class="basic-analysis" id="basicAnalysis"></div>
            <div class="ai-review" id="aiReview"></div>
        </div>
        <div class="error-message" id="errorMessage" style="display: none;"></div>
    </div>
    <script>${js}</script>
</body>
</html>`;
}

