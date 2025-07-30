# BrainT 채팅 시스템 테스트 스위트

이 폴더는 BrainT 채팅 시스템의 다양한 기능을 테스트하는 테스트 코드들을 포함합니다.

## 📁 테스트 파일 구조

```
tests/
├── brain_tests/                 # Brain API 테스트
│   ├── __init__.py
│   ├── test_brain_api.py
│   └── run_brain_tests.py
├── chat_tests/                  # 채팅 시스템 테스트
│   ├── __init__.py
│   ├── test_chat_integration.py
│   ├── test_chat_api.py
│   └── run_chat_tests.py
├── neo4j_tests/                 # Neo4j 동기화 테스트
│   ├── __init__.py
│   └── test_neo4j_sync.py
├── frontend_tests/              # 프론트엔드 통합 테스트
│   ├── __init__.py
│   └── test_frontend_integration.py
├── file_tests/                  # 파일 처리 테스트
│   ├── __init__.py
│   ├── docx/                    # DOCX 파일 처리 테스트
│   │   ├── __init__.py
│   │   ├── test_docx_integration.py
│   │   └── run_docx_tests.py
│   ├── pdf/                     # PDF 파일 처리 테스트
│   │   ├── __init__.py
│   │   └── test_pdf_integration.py
│   ├── textfile/                # TextFile 처리 테스트
│   │   ├── __init__.py
│   │   └── test_textfile_integration.py
│   └── mds/                     # MDS(Markdown) 파일 처리 테스트
│       ├── __init__.py
│       └── test_mds_integration.py
├── memo_tests/                  # Memo 처리 테스트
│   ├── __init__.py
│   └── test_memo_integration.py
├── test_utils.py                # 테스트 데이터 관리 유틸리티
├── run_all_tests.py             # 모든 테스트 실행 스크립트
├── run_file_tests.py            # 파일 처리 테스트만 실행 스크립트
├── install_dependencies.py      # 의존성 설치 스크립트
├── __init__.py
└── README.md                    # 이 파일
```

## 📁 테스트 폴더 구조

테스트는 기능별로 폴더로 구분되어 있어 오픈소스로 공개되었을 때 어떤 코드에 대한 테스트인지 쉽게 구분할 수 있습니다.

### 폴더별 설명
- **`brain_tests/`**: Brain API 관련 테스트 (생성, 조회, 수정, 삭제, 채팅 연동)
- **`chat_tests/`**: 채팅 시스템 관련 테스트 (세션 관리, 질문-답변, 채팅 내역, API 테스트)
- **`neo4j_tests/`**: Neo4j 데이터베이스 동기화 및 노드 관리 테스트
- **`frontend_tests/`**: 프론트엔드와 백엔드 간 통합 테스트
- **`file_tests/`**: 파일 처리 관련 테스트
  - **`docx/`**: Microsoft Word 문서(.docx) 처리 테스트
  - **`pdf/`**: PDF 문서 처리 테스트
  - **`textfile/`**: 텍스트 파일(.txt) 처리 테스트
  - **`mds/`**: Markdown 파일(.md) 처리 테스트
- **`memo_tests/`**: 메모 CRUD 기능 테스트

## 🚀 테스트 실행 방법

### 1. 모든 테스트 실행
```bash
cd backend/tests
python run_all_tests.py
```

### 2. 기능별 테스트 실행
```bash
# 채팅 시스템 테스트만
python chat_tests/run_chat_tests.py

# 파일 처리 테스트만 (선택 가능)
python run_file_tests.py [file|memo|all]

# 특정 파일 타입 테스트만
python file_tests/docx/run_docx_tests.py
```

### 3. 개별 테스트 실행
```bash
cd backend/tests

# Brain API 테스트
python brain_tests/test_brain_api.py

# 채팅 통합 테스트
python chat_tests/test_chat_integration.py

# 채팅 API 테스트
python chat_tests/test_chat_api.py

# Neo4j 동기화 테스트
python neo4j_tests/test_neo4j_sync.py

# 프론트엔드 통합 테스트
python frontend_tests/test_frontend_integration.py

# Brain API 테스트
python brain_tests/run_brain_tests.py

# 채팅 시스템 테스트
python chat_tests/run_chat_tests.py

# Neo4j 동기화 테스트
python neo4j_tests/test_neo4j_sync.py

# 프론트엔드 통합 테스트
python frontend_tests/test_frontend_integration.py

# DOCX 파일 처리 테스트
python file_tests/docx/run_docx_tests.py

# PDF 파일 처리 테스트
python file_tests/pdf/test_pdf_integration.py

# TextFile 처리 테스트
python file_tests/textfile/test_textfile_integration.py

# MDS(Markdown) 파일 처리 테스트
python file_tests/mds/test_mds_integration.py

# Memo 처리 테스트
python memo_tests/test_memo_integration.py

# 파일 처리 테스트만 실행 (선택 가능)
python run_file_tests.py [file|memo|all]
```

## 🔄 트랜잭션 처리 및 자동 데이터 정리

### 테스트 데이터 관리 시스템

모든 테스트는 **트랜잭션 처리**를 통해 실행되며, 테스트 중 생성된 모든 데이터가 자동으로 정리됩니다.

#### 🎯 주요 특징
- **자동 데이터 추적**: 테스트 중 생성된 모든 ID를 자동으로 기록
- **순서별 정리**: 의존성을 고려하여 올바른 순서로 데이터 삭제
- **에러 처리**: 정리 과정에서 발생하는 오류를 안전하게 처리
- **상세 로깅**: 어떤 데이터가 정리되었는지 명확히 표시

#### 📊 정리 순서
1. **채팅 메시지** 삭제
2. **채팅 세션** 삭제  
3. **업로드된 파일** 삭제
4. **메모** 삭제
5. **Brain** 삭제 (마지막에 삭제 - 다른 데이터들이 참조)

#### 💻 사용 방법

```python
# 트랜잭션 컨텍스트 매니저 사용
from test_utils import test_transaction

with test_transaction(BASE_URL) as data_manager:
    # 테스트 실행
    test_instance = TestBrainApi(data_manager)
    test_instance.test_brain_creation()
    # 실패하든 성공하든 자동으로 모든 데이터 정리
```

#### 🧹 TestDataManager 클래스

```python
class TestDataManager:
    def add_brain_id(self, brain_id: int)      # Brain ID 추가
    def add_session_id(self, session_id: int)  # 세션 ID 추가
    def add_chat_id(self, chat_id: int)        # 채팅 ID 추가
    def add_memo_id(self, memo_id: int)        # 메모 ID 추가
    def add_file_id(self, file_id: int, file_type: str)  # 파일 ID 추가
    def cleanup_all(self)                      # 모든 데이터 정리
```

#### ✅ 적용된 테스트 파일들
- ✅ `brain_tests/test_brain_api.py`
- ✅ `chat_tests/test_chat_api.py`
- ✅ `memo_tests/test_memo_integration.py`
- ✅ `file_tests/docx/test_docx_integration.py`
- ✅ `file_tests/pdf/test_pdf_integration.py`
- ✅ `file_tests/textfile/test_textfile_integration.py`
- ✅ `file_tests/mds/test_mds_integration.py`

#### 🎉 장점
- **데이터 정리 보장**: 테스트 실패 시에도 생성된 데이터가 정리됨
- **테스트 격리**: 각 테스트가 독립적으로 실행됨
- **데이터베이스 깨끗함**: 테스트 후 데이터베이스가 깨끗한 상태로 유지됨
- **개발 효율성**: 수동으로 데이터를 정리할 필요가 없음

## 📋 테스트 전제 조건

### 백엔드 서버 실행
테스트를 실행하기 전에 백엔드 서버가 실행 중이어야 합니다:

```bash
cd backend
python main.py
```

### 데이터베이스 설정
- Neo4j 데이터베이스가 실행 중이어야 합니다
- Qdrant 벡터 데이터베이스가 실행 중이어야 합니다
- SQLite 데이터베이스 파일이 생성되어 있어야 합니다

### 테스트 데이터
- `brain_id=1`에 대한 테스트 데이터가 있어야 합니다
- "안예찬", "강아지", "태양" 등의 노드가 저장되어 있어야 합니다

## 🧪 테스트 내용

### 1. test_brain_api.py
**Brain API 테스트**

- ✅ Brain 생성 및 조회
- ✅ Brain 목록 조회
- ✅ Brain 수정 및 삭제
- ✅ 여러 Brain 생성
- ✅ Brain과 채팅 통합
- ✅ 에러 처리

### 2. test_chat_integration.py
**채팅 시스템 통합 테스트**

- ✅ 채팅 세션 생성/조회/삭제
- ✅ 질문-답변 기능
- ✅ 채팅 내역 저장/조회
- ✅ 여러 질문 연속 처리
- ✅ Neo4j 동기화 기능

### 3. test_chat_api.py
**Chat API 테스트**

- ✅ 채팅 세션 CRUD (생성, 조회, 수정, 삭제)
- ✅ 채팅 메시지 CRUD
- ✅ 채팅 내역 조회
- ✅ 여러 메시지 처리
- ✅ Brain과 채팅 통합
- ✅ 에러 처리

### 4. test_neo4j_sync.py
**Neo4j 동기화 기능 테스트**

- ✅ 임베딩 벡터 DB → Neo4j 동기화
- ✅ brain_id 문자열 변환 처리
- ✅ brain_id별 노드 조회
- ✅ 참조 노드 추출
- ✅ source_id 매핑

### 5. test_frontend_integration.py
**프론트엔드 통합 테스트**

- ✅ 채팅 세션 생성 및 선택
- ✅ ChatPanel 기능
- ✅ 세션 목록 기능
- ✅ brain_id 일관성
- ✅ 에러 처리

### 4. test_docx_integration.py
**DOCX 파일 처리 테스트**

- ✅ DOCX 파일 업로드
- ✅ DOCX 파일 처리 및 내용 추출
- ✅ 노드 생성 및 그래프 연동
- ✅ 채팅과의 통합
- ✅ 파일 목록 조회
- ✅ 에러 처리

### 5. test_pdf_integration.py
**PDF 파일 처리 테스트**

- ✅ PDF 파일 업로드
- ✅ PDF 파일 처리 및 내용 추출
- ✅ 노드 생성 및 그래프 연동
- ✅ 채팅과의 통합
- ✅ 파일 목록 조회
- ✅ 에러 처리

### 6. test_textfile_integration.py
**TextFile 처리 테스트**

- ✅ TextFile 업로드
- ✅ TextFile 처리 및 내용 추출
- ✅ 노드 생성 및 그래프 연동
- ✅ 채팅과의 통합
- ✅ 파일 목록 조회
- ✅ 인코딩 처리
- ✅ 에러 처리

### 7. test_memo_integration.py
**Memo 처리 테스트**

- ✅ Memo 생성 및 수정
- ✅ Memo 처리 및 노드 생성
- ✅ 내용 조회 및 목록 관리
- ✅ 채팅과의 통합
- ✅ 여러 메모 생성
- ✅ 에러 처리

### 8. test_mds_integration.py
**MDS(Markdown) 파일 처리 테스트**

- ✅ MDS 파일 업로드
- ✅ MDS 파일 처리 및 내용 추출
- ✅ 노드 생성 및 그래프 연동
- ✅ 채팅과의 통합
- ✅ 파일 목록 조회
- ✅ Markdown 문법 처리
- ✅ 에러 처리

## 🔧 테스트 설정

### 환경 변수
```bash
# 테스트 설정 (필요시 수정)
BASE_URL = "http://localhost:8000"
TEST_BRAIN_ID = 1
```

### 의존성
```bash
# 자동 설치 스크립트 실행
python install_dependencies.py

# 또는 수동 설치
pip install requests python-docx reportlab PyPDF2 markdown
```

### API 엔드포인트 수정사항
테스트 파일들이 실제 API 엔드포인트에 맞게 수정되었습니다:

- **DOCX**: `/docx/upload` → `/docx/upload-docx`
- **PDF**: `/pdf/upload` → `/pdfs/upload`
- **TextFile**: `/textfile/upload` → `/textfiles/upload-txt`
- **MDS**: `/mds/upload` → `/mds/upload-md`
- **Memo**: 필드명 수정 (`title` → `memo_title`, `content` → `memo_text`)

### 파일 업로드 형식
- 파일 업로드 시 `files` 파라미터 사용 (단일 파일도 배열로 전송)
- 별도 처리 엔드포인트는 없으며, 업로드 시 자동으로 처리됨

## 📊 테스트 결과 해석

### 성공 케이스
```
✅ 채팅 세션 생성 성공: session_id=1
✅ 질문-답변 성공: 안예찬은 사람의 이름이다...
✅ 참조 노드: ['안예찬']
```

### 실패 케이스
```
❌ 테스트 실패: Connection refused
❌ 테스트 실패: 404 Not Found
```

## 🐛 문제 해결

### 1. 백엔드 서버 연결 실패
```bash
# 백엔드 서버가 실행 중인지 확인
curl http://localhost:8000/docs
```

### 2. 데이터베이스 연결 실패
```bash
# Neo4j 상태 확인
# Qdrant 상태 확인
# SQLite 파일 존재 확인
```

### 3. 테스트 데이터 부족
```bash
# 테스트용 데이터 업로드
# brain_id=1에 노드 데이터 추가
```

## 📝 테스트 추가 방법

새로운 테스트를 추가하려면:

1. 새로운 테스트 파일 생성
2. `TestClass` 클래스 정의 (트랜잭션 처리 포함)
3. `test_*` 메서드 작성
4. `run_all_tests.py`에 파일명 추가

### 기본 템플릿

```python
import requests
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from test_utils import TestDataManager, test_transaction

class TestNewFeature:
    def __init__(self, data_manager: TestDataManager = None):
        self.data_manager = data_manager or TestDataManager()
    
    def test_new_functionality(self):
        # 테스트 코드 작성
        response = requests.get("http://localhost:8000/api/endpoint")
        assert response.status_code == 200
        
        # 생성된 데이터가 있다면 관리자에 추가
        if "id" in response.json():
            self.data_manager.add_brain_id(response.json()["id"])
    
    def cleanup(self):
        # 데이터 관리자가 자동으로 정리함
        pass

if __name__ == "__main__":
    # 트랜잭션 처리로 테스트 실행
    with test_transaction("http://localhost:8000") as data_manager:
        test_instance = TestNewFeature(data_manager)
        test_instance.test_new_functionality()
```

### 트랜잭션 처리 필수사항

- 모든 테스트 클래스는 `TestDataManager`를 받아야 함
- 생성된 데이터 ID는 `data_manager.add_*_id()` 메서드로 추가
- `cleanup()` 메서드는 자동 정리를 위해 비워둠
- `__main__` 블록에서는 `test_transaction` 컨텍스트 매니저 사용

## 🎯 테스트 목표

이 테스트 스위트는 다음을 목표로 합니다:

1. **기능 검증**: 모든 주요 기능이 정상 작동하는지 확인
2. **통합 테스트**: 백엔드와 프론트엔드 간 연동 확인
3. **에러 처리**: 예외 상황에서 적절한 처리 확인
4. **성능 확인**: 응답 시간과 처리량 확인
5. **데이터 일관성**: 데이터베이스 간 동기화 확인

## 📋 폴더 구조의 장점

### 1. **명확한 분류**
- 각 기능별로 테스트가 분리되어 있어 어떤 코드를 테스트하는지 명확
- 새로운 개발자가 코드를 이해하기 쉬움

### 2. **선택적 실행**
- 필요한 기능의 테스트만 선택적으로 실행 가능
- 개발 중 특정 기능만 테스트하고 싶을 때 유용

### 3. **유지보수성**
- 기능별로 테스트가 분리되어 있어 유지보수가 쉬움
- 새로운 테스트 추가 시 적절한 폴더에 배치하면 됨

### 4. **오픈소스 친화적**
- 오픈소스로 공개되었을 때 어떤 기능을 테스트하는지 명확
- 기여자가 쉽게 이해하고 참여할 수 있음

### 5. **확장성**
- 새로운 파일 타입이나 기능이 추가될 때 해당 폴더에 테스트 추가
- 기존 구조를 유지하면서 확장 가능

## 📞 지원

테스트 실행 중 문제가 발생하면:

1. 백엔드 서버 로그 확인
2. 데이터베이스 연결 상태 확인
3. 테스트 데이터 준비 상태 확인
4. 네트워크 연결 상태 확인 