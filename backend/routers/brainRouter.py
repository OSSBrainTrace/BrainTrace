from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from sqlite_db.sqlite_handler import SQLiteHandler
import logging
import sqlite3
from datetime import date

sqlite_handler = SQLiteHandler()

router = APIRouter(
    prefix="/brains",
    tags=["brains"],
    responses={404: {"description": "Not found"}}
)

# ───────── Pydantic 모델 ───────── #
class BrainCreate(BaseModel):
    brain_name : str = Field(..., min_length=1, max_length=50)
    user_id    : int
    icon_key   : Optional[str]  = None        # 예: "BsGraphUp"
    created_at : Optional[str]  = None        # "2025-05-06" 등

class BrainUpdate(BaseModel):
    brain_name : Optional[str]  = None
    icon_key   : Optional[str]  = None
    created_at : Optional[str]  = None

class BrainResponse(BaseModel):
    brain_id: int = Field(..., description="브레인 ID", example=1)
    brain_name: str = Field(..., description="브레인 이름", example="파이썬 학습")
    user_id: int = Field(..., description="소유자 사용자 ID", example=1)
    icon_key:   str | None = None        
    created_at: str | None = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "brain_id": 1,
                "brain_name": "파이썬 학습",
                "user_id": 1
            }
        }

# ───────── 새 엔드포인트: 제목(이름)만 수정 ───────── #
class BrainRename(BaseModel):
    brain_name: str = Field(..., min_length=1, max_length=50)

# ───────── 엔드포인트 ───────── #
@router.post(
    "/", status_code=status.HTTP_201_CREATED,
    response_model=BrainResponse,
    summary="브레인 생성", description="새로운 브레인을 생성합니다."
)
async def create_brain(brain: BrainCreate):
    try:
        return sqlite_handler.create_brain(
            brain_name = brain.brain_name,
            user_id    = brain.user_id,
            icon_key   = brain.icon_key,
            created_at = date.today().isoformat()   # ← 오늘 날짜 자동 입력
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error("브레인 생성 오류: %s", e)
        raise HTTPException(status_code=500, detail="내부 서버 오류")

@router.get(
    "/", response_model=List[BrainResponse],
    summary="모든 브레인 조회", description="전체 브레인 목록을 반환합니다."
)
async def get_all_brains():
    return sqlite_handler.get_all_brains()

@router.get(
    "/user/{user_id}", response_model=List[BrainResponse],
    summary="사용자 브레인 조회"
)
async def get_user_brains(user_id: int):
    if not sqlite_handler.get_user(user_id):
        raise HTTPException(404, "사용자를 찾을 수 없습니다")
    return sqlite_handler.get_user_brains(user_id)

@router.get(
    "/{brain_id}", response_model=BrainResponse,
    summary="특정 브레인 조회"
)
async def get_brain(brain_id: int):
    rec = sqlite_handler.get_brain(brain_id)
    if not rec:
        raise HTTPException(404, "브레인을 찾을 수 없습니다")
    return rec

@router.put(
    "/{brain_id}", response_model=BrainResponse,
    summary="브레인 수정", description="이름·아이콘·파일트리·생성일 중 필요한 필드만 갱신"
)
async def update_brain(brain_id: int, data: BrainUpdate):
    origin = sqlite_handler.get_brain(brain_id)
    if not origin:
        raise HTTPException(404, "브레인을 찾을 수 없습니다")

    payload = {k: v for k, v in data.dict().items() if v is not None}
    if not payload:
        return origin  # 변경 사항 없음

    try:
        # 이름만 바꿀 때 기존 메서드 활용
        if 'brain_name' in payload:
            sqlite_handler.update_brain_name(brain_id, payload['brain_name'])
        # 나머지 필드는 범용 update_brain(가변) 메서드로 처리
        sqlite_handler.update_brain(brain_id, **payload)
        origin.update(payload)
        return origin
    except Exception as e:
        logging.error("브레인 업데이트 오류: %s", e)
        raise HTTPException(500, "내부 서버 오류")
    
@router.patch(
    "/{brain_id}/rename",
    response_model=BrainResponse,
    summary="브레인 제목(이름)만 수정",
    description="brain_name 필드만 변경합니다."
)
async def rename_brain(brain_id: int, data: BrainRename):
    # 1) 기존 레코드 확인
    origin = sqlite_handler.get_brain(brain_id)
    if not origin:
        raise HTTPException(status_code=404, detail="브레인을 찾을 수 없습니다")

    # 2) DB 업데이트
    try:
        sqlite_handler.update_brain_name(brain_id, data.brain_name)
        origin["brain_name"] = data.brain_name
        return origin
    except sqlite3.IntegrityError:
        raise HTTPException(400, "이미 존재하는 이름입니다")
    except Exception as e:
        logging.error("브레인 제목 수정 오류: %s", e)
        raise HTTPException(500, "내부 서버 오류")

@router.delete(
    "/{brain_id}", status_code=status.HTTP_204_NO_CONTENT,
    summary="브레인 삭제"
)
async def delete_brain(brain_id: int):
    if not sqlite_handler.delete_brain(brain_id):
        raise HTTPException(404, "브레인을 찾을 수 없습니다")
