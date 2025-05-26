# src/main.py
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
import os
import signal
import logging
import sqlite3
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from neo4j_db.utils import run_neo4j
from sqlite_db.sqlite_handler import SQLiteHandler

# 기존 라우터
from routers import brainGraph, userRouter, brainRouter, folderRouter, memoRouter, pdfRouter, textFileRouter, voiceRouter, chatRouter, searchRouter
# 새로 추가할 파일/텍스트/음성 라우터

# ─── 로깅 설정 ─────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True
)
logging.getLogger("uvicorn").setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)

# ─── DB 핸들러 & 전역 변수 ──────────────────────────
sqlite_handler = SQLiteHandler()
neo4j_process = None

# ─── 앱 수명 주기(lifespan) ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global neo4j_process
    # 1) SQLite 스키마 초기화
    sqlite_handler._init_db()
    # 2) Neo4j 실행
    try:
        neo4j_process = run_neo4j()
        if neo4j_process:
            logging.info("✅ Neo4j 실행됨. FastAPI 서버 시작 준비 완료!")
        else:
            logging.error("❌ Neo4j 실행 실패")
    except Exception as e:
        logging.error("Neo4j 실행 중 오류: %s", e)
    yield
    # 3) 종료 시 Neo4j 정리
    if neo4j_process:
        logging.info("🛑 Neo4j 프로세스를 종료합니다...")
        try:
            if os.name == "nt":
                neo4j_process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                neo4j_process.terminate()
            neo4j_process.wait(timeout=10)
            logging.info("✅ Neo4j 정상 종료 완료")
        except Exception as e:
            logging.error("Neo4j 종료 중 오류 발생: %s", e)

# ─── FastAPI 앱 생성 ─────────────────────────────────
app = FastAPI(
    title="BrainTrace API",
    description="지식 그래프 기반 질의응답 시스템 API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ─── CORS 설정 ──────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── 라우터 등록 ────────────────────────────────────
app.include_router(brainGraph.router)
app.include_router(userRouter.router)
app.include_router(brainRouter.router)
app.include_router(folderRouter.router)
app.include_router(memoRouter.router)
app.include_router(pdfRouter.router)        
app.include_router(textFileRouter.router)   
app.include_router(voiceRouter.router)      
app.include_router(chatRouter.router)
app.include_router(searchRouter.router)

app.mount("/uploaded_pdfs", StaticFiles(directory="uploaded_pdfs"), name="uploaded_pdfs")
app.mount("/uploaded_txts", StaticFiles(directory="uploaded_txts"), name="uploaded_txts")


# ─── 서버 실행 ──────────────────────────────────────
if __name__ == "__main__":
    logging.info("🚀 FastAPI 서버 실행 중... http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, log_level="info")
