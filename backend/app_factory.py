# src/app_factory.py
import os, signal, logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from exceptions.custom_exceptions import AppException
from schemas.error_response import ErrorResponse
from neo4j_db.utils import run_neo4j
from sqlite_db import SQLiteHandler
from run_ollama import run_ollama, wait_for_port
from routers import (
    brainGraph, brainRouter, memoRouter, pdfRouter, textFileRouter,
    chatRouter, chatsessionRouter, searchRouter, voiceRouter,
    mdRouter, docxRouter, model_router
)

# ── 로깅 기본 설정 ───────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True
)
logging.getLogger("uvicorn").setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)

# ── 전역 상태 ─────────────────────────────────────
sqlite_handler = SQLiteHandler()
neo4j_process = None
ollama_process = None

# ── lifespan ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global neo4j_process, ollama_process

    # 1. SQLite 초기화
    sqlite_handler._init_db()

    # 2. Neo4j 기동
    try:
        neo4j_process = run_neo4j()
        logging.info("✅ Neo4j 실행됨")
    except Exception as e:
        logging.error("❌ Neo4j 실행 실패: %s", e)
        raise

    # 3. Ollama 기동
    try:
        ollama_process = run_ollama()
        logging.info("⏳ Ollama 기동 중…")
        await wait_for_port("localhost", 11434, timeout=60)
        logging.info("✅ Ollama 준비 완료")
    except Exception as e:
        logging.error("❌ Ollama 실행 실패: %s", e)
        raise

    yield  # ── FastAPI 서비스 구동 ──

    # 4. Neo4j 종료
    if neo4j_process:
        logging.info("🛑 Neo4j 종료 중…")
        try:
            if os.name == "nt":
                neo4j_process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                neo4j_process.terminate()
            neo4j_process.wait(timeout=10)
            logging.info("✅ Neo4j 정상 종료")
        except Exception as e:
            logging.error("❌ Neo4j 종료 오류: %s", e)

    # 5. Ollama 종료
    if ollama_process:
        logging.info("🛑 Ollama 종료 중…")
        try:
            ollama_process.terminate()
            logging.info("✅ Ollama 정상 종료")
        except Exception as e:
            logging.error("❌ Ollama 종료 오류: %s", e)

# ── FastAPI 인스턴스 ──────────────────────────────
app = FastAPI(
    title="BrainTrace API",
    description="지식 그래프 기반 질의응답 시스템 API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ── 공통 미들웨어·라우터·정적 파일 ───────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            code=exc.code,
            message=exc.message,
            detail=str(request.url)
        ).model_dump()
    )

# 라우터
for r in (
    brainGraph.router, brainRouter.router, memoRouter.router, pdfRouter.router,
    textFileRouter.router, mdRouter.router, chatRouter.router,
    chatsessionRouter.router, searchRouter.router, voiceRouter.router,
    docxRouter.router, model_router.router
):
    app.include_router(r)

# 정적 파일
app.mount("/uploaded_pdfs", StaticFiles(directory="uploaded_pdfs"), name="uploaded_pdfs")
app.mount("/uploaded_txts", StaticFiles(directory="uploaded_txts"), name="uploaded_txts")
app.mount("/uploaded_mds", StaticFiles(directory="uploaded_mds"), name="uploaded_mds")
app.mount("/uploaded_docx", StaticFiles(directory="uploaded_docx"), name="uploaded_docx")
