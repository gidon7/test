import os
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()


class CodeReviewer:
    """Java 코드 리뷰어"""
    
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    
    async def review_code(self, code: str, filename: str) -> dict:
        """
        Java 코드를 분석하고 리뷰
        
        Args:
            code: Java 코드 내용
            filename: 파일명
        
        Returns:
            리뷰 결과 딕셔너리
        """
        try:
            # 기본 코드 분석
            basic_analysis = self._analyze_code_structure(code)
            
            # AI를 통한 상세 리뷰
            ai_review = await self._get_ai_review(code, filename)
            
            return {
                "success": True,
                "filename": filename,
                "basic_analysis": basic_analysis,
                "ai_review": ai_review
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def _analyze_code_structure(self, code: str) -> dict:
        """기본 코드 구조 분석"""
        lines = code.split('\n')
        total_lines = len(lines)
        code_lines = [line for line in lines if line.strip() and not line.strip().startswith('//')]
        
        # 클래스 개수
        class_count = len(re.findall(r'\bclass\s+\w+', code))
        
        # 메서드 개수
        method_count = len(re.findall(r'\b(public|private|protected)\s+\w+\s+\w+\s*\([^)]*\)\s*\{', code))
        
        # 주석 비율
        comment_lines = len([line for line in lines if line.strip().startswith('//') or '/*' in line])
        comment_ratio = (comment_lines / total_lines * 100) if total_lines > 0 else 0
        
        # 복잡도 추정 (중괄호 개수)
        complexity = code.count('{') - code.count('}')
        
        return {
            "total_lines": total_lines,
            "code_lines": len(code_lines),
            "class_count": class_count,
            "method_count": method_count,
            "comment_ratio": round(comment_ratio, 2),
            "estimated_complexity": abs(complexity)
        }
    
    async def _get_ai_review(self, code: str, filename: str) -> dict:
        """AI를 통한 코드 리뷰"""
        prompt = f"""다음 Java 코드를 분석하고 리뷰해주세요.

파일명: {filename}

코드:
```java
{code}
```

다음 항목에 대해 상세히 설명해주세요:
1. 코드 설명: 이 코드가 무엇을 하는지 설명
2. 장점: 코드의 좋은 점
3. 개선점: 개선할 수 있는 부분과 이유
4. 개선 제안: 구체적인 개선 코드 예시
5. Best Practice: Java Best Practice 관점에서의 제안

한국어로 답변해주세요."""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "당신은 경험이 풍부한 Java 코드 리뷰어입니다. 코드를 분석하고 구체적이고 실용적인 개선 제안을 제공합니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            review_text = response.choices[0].message.content
            
            # 리뷰를 구조화
            return {
                "explanation": self._extract_section(review_text, "코드 설명", "장점"),
                "strengths": self._extract_section(review_text, "장점", "개선점"),
                "improvements": self._extract_section(review_text, "개선점", "개선 제안"),
                "suggestions": self._extract_section(review_text, "개선 제안", "Best Practice"),
                "best_practices": self._extract_section(review_text, "Best Practice", None),
                "full_review": review_text
            }
        
        except Exception as e:
            # AI API 오류 시 기본 메시지
            return {
                "explanation": "코드 분석 중 오류가 발생했습니다.",
                "error": str(e)
            }
    
    def _extract_section(self, text: str, start_keyword: str, end_keyword: str = None) -> str:
        """텍스트에서 특정 섹션 추출"""
        if start_keyword not in text:
            return ""
        
        start_idx = text.find(start_keyword)
        if end_keyword:
            end_idx = text.find(end_keyword, start_idx)
            if end_idx == -1:
                return text[start_idx:].strip()
            return text[start_idx:end_idx].strip()
        
        return text[start_idx:].strip()


