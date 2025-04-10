from contextlib import asynccontextmanager
import os
import signal
import logging
import uvicorn
from fastapi import FastAPI
from neo4j_db.utils import run_neo4j  # ✅ Neo4j 실행 함수

# 로깅 설정
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global neo4j_process
    try:
        neo4j_process = run_neo4j()
        if neo4j_process:
            logging.info("✅ Neo4j 실행됨. FastAPI 서버 시작 준비 완료!")
        else:
            logging.error("❌ Neo4j 실행 실패")
    except Exception as e:
        logging.error("Neo4j 실행 중 오류: %s", str(e))
    yield
    if neo4j_process:
        logging.info("🛑 Neo4j 프로세스를 종료합니다...")
        try:
            if os.name == "nt":  # Windows
                neo4j_process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                neo4j_process.terminate()
            neo4j_process.wait(timeout=10)
            logging.info("✅ Neo4j 정상 종료 완료")
        except Exception as e:
            logging.error("Neo4j 종료 중 오류 발생: %s", str(e))

app = FastAPI(title="BrainTrace API", lifespan=lifespan)

# Neo4j 프로세스 객체
neo4j_process = None

@app.get("/")
async def root():
    return {"message": "BrainTrace API에 오신 것을 환영합니다!"}

# ✅ FastAPI 앱 실행
if __name__ == "__main__":
    logging.info("🚀 FastAPI 서버 실행 중... http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)