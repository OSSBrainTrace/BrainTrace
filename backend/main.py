from contextlib import asynccontextmanager
import os
import signal
import logging
import uvicorn
from fastapi import FastAPI
from neo4j_db.utils import run_neo4j  # ✅ Neo4j 실행 함수
from routers import brainGraph
# 로깅 설정
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s [%(levelname)s] %(message)s",
    force=True
)

# 로깅 필터 설정 (Uvicorn 로그 레벨 조정)
logging.getLogger("uvicorn").setLevel(logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.INFO)

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
# API 라우터를 등록합니다.
app.include_router(brainGraph.router)
# Neo4j 프로세스 객체
neo4j_process = None

# ✅ FastAPI 앱 실행
if __name__ == "__main__":
    logging.info("🚀 FastAPI 서버 실행 중... http://127.0.0.1:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False, log_level="info")