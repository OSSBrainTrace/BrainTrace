// React 및 필요한 모듈 import
import React, { useState, useEffect, useRef } from 'react';
import './ChatPanel.css';
import { requestAnswer } from '../../../../api/tmpAPI';
import copyIcon from '../../../assets/icons/copy.png';
import graphIcon from '../../../assets/icons/graph-off.png';
import {
  getBrain,
  getReferencedNodes,
  getSourceIdsByNodeName,
} from '../../../../../frontend/api/backend'

import { fetchChatHistoryByBrain, deleteAllChatsByBrain, saveChatToBrain } from '../../../../api/chat';
import { getSourceCountByBrain } from '../../../../api/graphApi';

import ConfirmDialog from '../../common/ConfirmDialog';

// === 채팅 내역 불러오기 함수 ===
async function fetchChatHistory(brainId) {
  try {
    return await fetchChatHistoryByBrain(brainId);
  } catch (e) {
    console.error(e);
    return [];
  }
}

function ChatPanel({
  selectedBrainId,
  onReferencedNodesUpdate,
  allNodeNames = [],
  onOpenSource,
  onChatReady
}) {

  const [brainName, setBrainName] = useState(''); // 브레인 이름
  const [inputText, setInputText] = useState(''); // 입력창 텍스트
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const messagesEndRef = useRef(null); // 메시지 끝 ref (스크롤)
  const [hoveredMessageIndex, setHoveredMessageIndex] = useState(null); // hover된 메시지 인덱스
  const [hoveredChatId, setHoveredChatId] = useState(null); // hover된 메시지의 chatId
  const [openSourceNodes, setOpenSourceNodes] = useState({}); // 노드별 출처 열림 상태
  const [showConfirm, setShowConfirm] = useState(false); // 대화 초기화 확인창
  const [chatHistory, setChatHistory] = useState([]); // DB 기반 채팅 내역
  const [sourceCount, setSourceCount] = useState(0); // 소스 개수 상태

  // selectedBrainId 변경 시 소스 개수 fetch
  useEffect(() => {
    if (!selectedBrainId) return;
    getSourceCountByBrain(selectedBrainId)
      .then(res => setSourceCount(res.total_count ?? 0))
      .catch(() => setSourceCount(0));
  }, [selectedBrainId]);

  // ===== 브레인 이름 불러오기 (프로젝트 변경 시) =====
  useEffect(() => {
    if (!selectedBrainId) return;
    getBrain(selectedBrainId)
      .then((data) => setBrainName(data.brain_name))
      .catch((err) => {
        console.error('🛑 brain_name 불러오기 실패:', err);
        setBrainName(`프로젝트 #${selectedBrainId}`);
      });
  }, [selectedBrainId]);

  // ===== 채팅 내역 불러오기 (프로젝트 변경 시) =====
  useEffect(() => {
    if (!selectedBrainId) return;
    fetchChatHistory(selectedBrainId)
      .then(history => {
        setChatHistory(history);
        if (onChatReady) onChatReady(true);
      })
      .catch(() => {
        if (onChatReady) onChatReady(false);
      });
  }, [selectedBrainId]);

  // ===== 스크롤을 맨 아래로 내리는 함수 =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // ===== 메시지 전송 핸들러 =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('submit 시도', { inputText, isLoading });
    if (!inputText.trim() || isLoading) {
      console.log('버튼 비활성화 조건', { inputText, isLoading });
      return;
    }
    setIsLoading(true);

    // 1. 질문을 optimistic하게 바로 추가
    const tempQuestion = {
      chat_id: Date.now(),
      is_ai: false,
      message: inputText,
      referenced_nodes: []
    };
    setChatHistory(prev => [...prev, tempQuestion]);
    // DB에 질문 저장 (is_ai=0)
    saveChatToBrain(selectedBrainId, { is_ai: 0, message: inputText, referenced_nodes: [] })
      .catch(err => console.error('질문 DB 저장 실패:', err));

    try {
      // 2. 답변 요청 및 DB 저장
      const res = await requestAnswer(inputText, selectedBrainId.toString());
      console.log('requestAnswer 응답:', res);
      // 3. 답변을 바로 추가
      const tempAnswer = {
        chat_id: res?.chat_id || Date.now() + 1,
        is_ai: true,
        message: res?.answer,
        referenced_nodes: res?.referenced_nodes || []
      };
      setChatHistory(prev => [...prev, tempAnswer]);
      setInputText('');
      // DB에 답변 저장 (is_ai=1)
      saveChatToBrain(selectedBrainId, {
        is_ai: 1,
        message: res?.answer,
        referenced_nodes: res?.referenced_nodes || []
      }).catch(err => console.error('답변 DB 저장 실패:', err));
    } catch (err) {
      alert('답변 생성 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== 대화 초기화 핸들러 =====
  const handleClearChat = async () => {
    try {
      await deleteAllChatsByBrain(selectedBrainId);
      // 삭제 후 최신 내역 다시 불러오기
      const updated = await fetchChatHistory(selectedBrainId);
      setChatHistory(updated);
    } catch (e) {
      alert('대화 삭제 중 오류가 발생했습니다.');
      console.error(e);
    } finally {
      setShowConfirm(false);
    }
  };

  // ===== 출처(소스) 토글 함수 =====
  const toggleSourceList = async (nodeName) => {
    if (openSourceNodes[nodeName]) {
      // 이미 열려있으면 닫기
      setOpenSourceNodes((prev) => {
        const copy = { ...prev };
        delete copy[nodeName];
        return copy;
      });
    } else {
      // 닫혀있으면 열기 (API로 소스 목록 조회)
      try {
        const res = await getSourceIdsByNodeName(nodeName, selectedBrainId);
        setOpenSourceNodes((prev) => ({
          ...prev,
          [nodeName]: res.sources,
        }));
      } catch (err) {
        console.error('소스 조회 실패:', err);
      }
    }
  };

  // ===== 텍스트 복사 함수 =====
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const hasChatStarted = chatHistory.length > 0;
  return (
    <div className="panel-container">
      {/* 헤더는 항상 렌더링 */}
      <div className="panel-header chat-header-custom">
        <span className="header-title">Chat</span>
        <div className="header-actions">
          {hasChatStarted && (
            <button
              className="chat-refresh-btn"
              onClick={() => setShowConfirm(true)}
              title="대화 초기화"
            >
              새로 고침
            </button>
          )}
        </div>
      </div>
      {/* 채팅 내역 분기 */}
      {hasChatStarted ? (
        <div className="panel-content chat-content">
          <div className="chat-title-container"></div>
          {/* 메시지 목록 영역 */}
          <div className="chat-messages">
            {chatHistory.map((m, i) => (
              <div
                key={m.chat_id}
                className={`message-wrapper ${m.is_ai ? 'bot-message' : 'user-message'}`}
                onMouseEnter={async () => {
                  setHoveredMessageIndex(i);
                  if (m.is_ai && m.chat_id) setHoveredChatId(m.chat_id);
                }}
                onMouseLeave={() => setHoveredMessageIndex(null)}
              >
                <div className="message">
                  {/* 메시지 본문 및 참고 노드/출처 표시 */}
                  <div className="message-body">
                    {m.message.split('\n').map((line, idx) => {
                      const trimmed = line.trim();
                      const isReferenced = trimmed.startsWith('-');
                      const cleanWord = isReferenced ? trimmed.replace(/^-\t*/, '') : trimmed;
                      return (
                        <div key={idx} className="referenced-line">
                          {allNodeNames.includes(cleanWord) && isReferenced ? (
                            <div className="referenced-block">
                              <div className="referenced-header">
                                <span style={{ color: 'inherit' }}>-</span>
                                <span
                                  className="referenced-node-text"
                                  onClick={() => onReferencedNodesUpdate([cleanWord])}
                                >
                                  {cleanWord}
                                </span>
                                <button
                                  className={`source-toggle-button ${openSourceNodes[cleanWord] ? 'active' : ''}`}
                                  onClick={() => {/* 출처 토글 생략 */ }}
                                  style={{ marginLeft: '3px' }}
                                >
                                  (출처보기)
                                </button>
                              </div>
                            </div>
                          ) : (
                            trimmed
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {/* 메시지 액션(복사, 그래프) 버튼 */}
                  <div className="message-actions">
                    <button
                      className="copy-button"
                      title="복사"
                      onClick={() => navigator.clipboard.writeText(m.message)}
                    >
                      <img src={copyIcon} alt="복사" className="copy-icon" />
                    </button>
                    {/* bot 메시지에만 그래프 버튼 표시 */}
                    {m.is_ai && hoveredMessageIndex === i && (
                      <button
                        className="graph-button"
                        title="그래프 보기"
                        onClick={async () => {
                          if (!m.chat_id) return;
                          try {
                            const res = await getReferencedNodes(m.chat_id);
                            if (res.referenced_nodes && res.referenced_nodes.length > 0) {
                              onReferencedNodesUpdate(res.referenced_nodes);
                            }
                          } catch (err) {
                            console.error('❌ 참고 노드 불러오기 실패:', err);
                          }
                        }}
                      >
                        <img src={graphIcon} alt="그래프" className="graph-icon" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-wrapper bot-message">
                <div className="message">
                  <div className="thinking-indicator">
                    <span>생각하는 중</span>
                    <div className="thinking-dots">
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                      <div className="thinking-dot" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {/* 입력창 및 전송 버튼 */}
          <form className="chat-controls" onSubmit={handleSubmit}>
            <div className="input-with-button">
              <textarea
                className="chat-input"
                placeholder="무엇이든 물어보세요"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
              />
              <div className="source-count-text">소스 {sourceCount}개</div>
              <button
                type="submit"
                className="submit-circle-button"
                aria-label="메시지 전송"
                disabled={!inputText.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="stop-icon">■</span>
                ) : (
                  <span className="send-icon">➤</span>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        // 대화가 시작되지 않은 경우 안내 및 입력창
        <div className="panel-content empty-chat-content">
          <div className="chat-title-container">
            <div className="chat-title-display">
              <span
                className="header-title"
                style={{ fontSize: '23px', fontWeight: '600', marginLeft: '21px' }}
              >
                {brainName}
              </span>
            </div>
          </div>
          <div className="centered-input-container">
            <div className="hero-section">
              <h1 className="hero-title">당신의 세컨드 브레인을 추적해보세요.</h1>
            </div>
            <form className="input-wrapper" onSubmit={handleSubmit}>
              <div className="input-with-button rounded">
                <textarea
                  className="chat-input"
                  placeholder="무엇이든 물어보세요"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
                <div className="source-count-text">소스 {sourceCount}개</div>
                <button
                  type="submit"
                  className="submit-circle-button"
                  aria-label="메시지 전송"
                >
                  <span className="send-icon">➤</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 안내 문구 */}
      <p className="chat-disclaimer">
        BrainTrace는 학습된 정보 기반으로 응답하며, 실제와 다를 수 있습니다.
      </p>
      {/* 대화 초기화 확인 다이얼로그 */}
      {showConfirm && (
        <ConfirmDialog
          message="채팅 기록을 모두 삭제하시겠습니까?"
          onOk={handleClearChat}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}

// 컴포넌트 export
export default ChatPanel;
