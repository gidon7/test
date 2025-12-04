from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi import Request
import os
import aiofiles
from dotenv import load_dotenv
from code_reviewer import CodeReviewer

load_dotenv()

app = FastAPI(title="Java 코드 리뷰 시스템")

# 정적 파일 및 템플릿 설정
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# 업로드 디렉토리 생성
os.makedirs("uploads", exist_ok=True)

# 코드 리뷰어 초기화
reviewer = CodeReviewer()


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """메인 페이지"""
    return templates.TemplateResponse("index.html", {"request": request})


@app.post("/api/review")
async def review_code(file: UploadFile = File(...)):
    """Java 코드 리뷰 API"""
    try:
        # 파일 확장자 확인
        if not (file.filename.endswith('.java') or file.filename.endswith('.jsp')):
            raise HTTPException(status_code=400, detail="Java 또는 JSP 파일만 업로드 가능합니다.")
        
        # 파일 저장
        file_path = f"uploads/{file.filename}"
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # 파일 내용 읽기
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            code_content = await f.read()
        
        # 코드 리뷰 수행
        review_result = await reviewer.review_code(code_content, file.filename)
        
        # 임시 파일 삭제
        os.remove(file_path)
        
        return JSONResponse(content=review_result)
    
    except Exception as e:
        # 에러 발생 시 파일 삭제
        if os.path.exists(f"uploads/{file.filename}"):
            os.remove(f"uploads/{file.filename}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    """헬스 체크"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
