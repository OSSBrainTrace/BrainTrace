/*
 GraphViewWithModal.jsx

 모달(오버레이) 형태로 그래프를 표시하고, 전체화면 창 열기/타임랩스/검색/하이라이트 표시를
 제어하는 래퍼 컴포넌트입니다.

 주요 기능:
 1. 모달 내부에서 GraphView 렌더링 및 상태(참조/포커스/신규추가) 표시 제어
 2. 외부 스탠드얼론 창(GraphViewStandalone) 열기 및 메시지 수신 핸들링
 3. 타임랩스 실행 트리거(ref를 통해 GraphView 내부 함수 호출)
 4. 검색 토글 및 ESC 키로 닫기

 구성요소:
 - GraphView: 실제 그래프를 렌더링하는 하위 컴포넌트
 - 우측 상단 버튼들: 검색 토글, 타임랩스 실행, 전체화면(외부 창 열기)
*/
import React, { useState, useRef, useEffect } from "react";
import GraphView from "./GraphView";
import { MdFullscreen, MdClose, MdOutlineSearch } from "react-icons/md";
import { PiMagicWand } from "react-icons/pi";
import "./GraphViewWithModal.css";

/**
 * GraphViewWithModal
 *
 * @param {Object} props
 * @param {string|number} props.brainId - 그래프 상태 동기화를 위한 식별자
 * @param {string|number} [props.height] - 래퍼 높이(px 또는 %)
 * @param {string[]} [props.referencedNodes] - 하이라이트할 노드 이름 목록
 * @param {string[]} [props.focusNodeNames] - 포커스할 노드 이름 목록
 * @param {number} [props.graphRefreshTrigger] - 그래프 새로고침 트리거 값
 * @param {Function} [props.onGraphDataUpdate] - 그래프 데이터 변경 콜백
 * @param {Function} [props.onGraphReady] - 그래프 준비 완료 콜백
 * @param {Function} [props.onClearReferencedNodes] - 참조 노드 초기화 콜백
 * @param {Function} [props.onClearFocusNodes] - 포커스 노드 초기화 콜백
 * @param {Function} [props.onClearNewlyAddedNodes] - 신규 추가 노드 표시 초기화 콜백
 *
 * 모달 컨텍스트 안에서 그래프를 표시하고, 별도 전체화면 창으로도 열 수 있도록 지원합니다.
 */
export default function GraphViewWithModal({
  brainId,
  height,
  referencedNodes,
  focusNodeNames,
  graphRefreshTrigger,
  onGraphDataUpdate,
  onGraphReady,
  onClearReferencedNodes,
  onClearFocusNodes,
  onClearNewlyAddedNodes,
}) {
  // ===== 상태/참조 =====
  const [isFullscreen, setIsFullscreen] = useState(false);
  const modalRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });
  const timelapseFunctionRef = useRef(null);

  // 팝업 관련 상태들 (GraphView에서 이동)
  const [showNewlyAdded, setShowNewlyAdded] = useState(false);
  const [newlyAddedNodeNames, setNewlyAddedNodeNames] = useState([]);
  const [showReferenced, setShowReferenced] = useState(true);
  const [showFocus, setShowFocus] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  // ✅ GraphView 내부 상태를 제어하기 위한 콜백 함수들
  const [graphViewCallbacks, setGraphViewCallbacks] = useState({});

  // ===== 이펙트 =====
  // GraphView의 상태 감지를 위한 useEffect들
  useEffect(() => {
    // graphRefreshTrigger 변화 감지하여 새로 추가된 노드 표시
    if (graphRefreshTrigger) {
      // 이 로직은 GraphView 내부에서 처리되므로 여기서는 기본 설정만
      setShowNewlyAdded(false);
      setNewlyAddedNodeNames([]);

      setShowReferenced(false);
      setShowFocus(false);
    }
  }, [graphRefreshTrigger]);

  // focusNodeNames 변화 감지 - 안전한 의존성 배열 사용
  useEffect(() => {
    if (focusNodeNames && focusNodeNames.length > 0) {
      console.log("✅ showFocus를 true로 설정");
      setShowFocus(true);
    }
  }, [focusNodeNames]);

  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ===== 콜백/핸들러 =====
  /**
   * 외부(새 창) 전체화면 그래프 뷰 열기
   * - URL 파라미터로 brainId, referencedNodes, focusNodeNames를 전달
   * - postMessage 리스너 등록 및 창 종료 시 정리 수행
   */
  const openExternalGraphWindow = () => {
    const params = new URLSearchParams({
      brainId: brainId,
    });

    if (referencedNodes && referencedNodes.length > 0) {
      params.set(
        "referencedNodes",
        encodeURIComponent(JSON.stringify(referencedNodes))
      );
    }

    if (focusNodeNames && focusNodeNames.length > 0) {
      params.set(
        "focusNodeNames",
        encodeURIComponent(JSON.stringify(focusNodeNames))
      );
    }

    if (onGraphDataUpdate) {
      params.set("nodeCount", onGraphDataUpdate.nodes?.length || 0);
    }

    const url = `${window.location.origin}/graph-view?${params.toString()}`;

    const newWindow = window.open(
      url,
      "_blank",
      "width=1200,height=800,scrollbars=no,resizable=yes"
    );

    const handleMessage = (event) => {
      if (event.source === newWindow) {
        console.log("Message from standalone window:", event.data);
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (newWindow.closed) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
      }
    }, 1000);
  };

  /**
   * 타임랩스 실행
   * - GraphView에서 전달한 ref(timelapseFunctionRef)를 통해 내부 startTimelapse 호출
   */
  const handleTimelapse = () => {
    if (
      timelapseFunctionRef.current &&
      timelapseFunctionRef.current.startTimelapse
    ) {
      timelapseFunctionRef.current.startTimelapse();
    }
  };

  // ✅ GraphView와 상태 동기화를 위한 콜백 함수들
  /**
   * GraphView 준비 완료 시 콜백 등록
   *
   * @param {Record<string, Function>} callbacks - GraphView가 노출하는 내부 콜백들
   */
  const handleGraphViewReady = (callbacks) => {
    console.log("📡 GraphView 콜백 등록:", Object.keys(callbacks));
    setGraphViewCallbacks(callbacks);
  };

  // ✅ GraphView에서 새로 추가된 노드 정보를 받는 함수
  /**
   * 신규 추가 노드 수신 핸들러
   *
   * @param {string[]} nodeNames - 새로 추가된 노드 이름 배열
   */
  const handleNewlyAddedNodes = (nodeNames) => {
    console.log("🆕 새로 추가된 노드들:", nodeNames);
    if (nodeNames && nodeNames.length > 0) {
      setNewlyAddedNodeNames(nodeNames);
      setShowNewlyAdded(true);
    }
  };

  return (
    <div className="graph-view-wrapper">
      <div className="graph-with-button">
        <GraphView
          brainId={brainId}
          height={height}
          referencedNodes={referencedNodes}
          focusNodeNames={focusNodeNames}
          onTimelapse={timelapseFunctionRef}
          graphRefreshTrigger={graphRefreshTrigger}
          onGraphDataUpdate={onGraphDataUpdate}
          onGraphReady={onGraphReady}
          isFullscreen={isFullscreen}
          externalShowReferenced={showReferenced}
          externalShowFocus={showFocus}
          externalShowNewlyAdded={showNewlyAdded}
          onGraphViewReady={handleGraphViewReady}
          onNewlyAddedNodes={handleNewlyAddedNodes}
          onClearReferencedNodes={onClearReferencedNodes}
          onClearFocusNodes={onClearFocusNodes}
          onClearNewlyAddedNodes={onClearNewlyAddedNodes}
          showSearch={showSearch}
        />

        {/* 타임랩스 버튼 */}
        <div
          className="timelapse-button-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* 검색 아이콘 - 타임랩스  */}
          <button
            className={`graph-search-toggle-btn${showSearch ? " active" : ""}`}
            onClick={() => setShowSearch((v) => !v)}
            title="노드 검색"
          >
            <MdOutlineSearch size={21} color="#222" />
          </button>

          <div
            className="timelapse-button"
            onClick={handleTimelapse}
            title="애니메이션"
          >
            <PiMagicWand size={21} color="black" />
          </div>
        </div>

        {/* 전체화면 버튼 */}
        <button className="fullscreen-btn" onClick={openExternalGraphWindow}>
          {!isFullscreen && (
            <MdFullscreen size={22} color="black" title="전체화면" />
          )}
        </button>
      </div>
    </div>
  );
}
