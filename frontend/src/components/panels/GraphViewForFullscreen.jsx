// GraphViewForFullscreen.jsx - 다크모드 기능 추가

import React, { useState, useEffect, useCallback } from 'react';
import GraphView from './GraphView';
import './styles/GraphViewForFullscreen.css';

function GraphViewForFullscreen(props) {
    const [allNodes, setAllNodes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [localReferencedNodes, setLocalReferencedNodes] = useState(props.referencedNodes || []);
    const [showAdvancedControls, setShowAdvancedControls] = useState(false);
    const [graphStats, setGraphStats] = useState({ nodes: 0, links: 0 });
    const [newlyAddedNodes, setNewlyAddedNodes] = useState([]);
    const [clearTrigger, setClearTrigger] = useState(0);
    
    // ✅ 다크모드 상태 추가
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // localStorage에서 사용자 설정 불러오기
        const saved = localStorage.getItem('graphDarkMode');
        return saved ? JSON.parse(saved) : false;
    });

    // ✅ 다크모드 토글 함수
    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('graphDarkMode', JSON.stringify(newMode));
    };

    // GraphView에서 그래프 데이터 업데이트 시 처리
    const handleGraphDataUpdate = useCallback((graphData) => {
        if (graphData && graphData.nodes) {
            setAllNodes(graphData.nodes.map(node => node.name));
            setGraphStats({
                nodes: graphData.nodes.length,
                links: graphData.links?.length || 0
            });
        }
        if (props.onGraphDataUpdate) {
            props.onGraphDataUpdate(graphData);
        }
    }, [props.onGraphDataUpdate]);

    const handleNewlyAddedNodes = useCallback((nodeNames) => {
        console.log('🆕 풀스크린에서 새로 추가된 노드 감지:', nodeNames);
        setNewlyAddedNodes(nodeNames || []);
    }, []);

    useEffect(() => {
        setLocalReferencedNodes(props.referencedNodes || []);
    }, [props.referencedNodes]);

    const handleSearch = useCallback((query) => {
        if (!query.trim() || allNodes.length === 0) {
            setLocalReferencedNodes(props.referencedNodes || []);
            return;
        }

        const searchTerms = query.toLowerCase().split(/\s+/);
        const matchingNodes = allNodes.filter(nodeName =>
            searchTerms.some(term =>
                nodeName.toLowerCase().includes(term)
            )
        );

        setLocalReferencedNodes(matchingNodes);
    }, [allNodes, props.referencedNodes]);

    const handleSearchInput = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        handleSearch(query);
    };

    const clearSearch = () => {
        console.log('🧹 검색 및 하이라이트 해제');
        setSearchQuery('');
        setLocalReferencedNodes([]);
        setNewlyAddedNodes([]);
        setClearTrigger(prev => prev + 1);

        if (props.onClearHighlights) {
            props.onClearHighlights();
        } else {
            localStorage.setItem('graphStateSync', JSON.stringify({
                brainId: props.brainId,
                action: 'clear_highlights_from_fullscreen',
                timestamp: Date.now()
            }));
        }
    };

    // 키보드 단축키
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                document.getElementById('fullscreen-node-search')?.focus();
            }
            if (e.key === 'Escape') {
                clearSearch();
                document.getElementById('fullscreen-node-search')?.blur();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowAdvancedControls(prev => !prev);
            }
            // ✅ 다크모드 단축키 추가 (Ctrl/Cmd + D)
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                toggleDarkMode();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isDarkMode]);

    return (
        <div className={`graph-fullscreen-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <GraphView
                {...props}
                isFullscreen={true}
                referencedNodes={localReferencedNodes}
                onGraphDataUpdate={handleGraphDataUpdate}
                onNewlyAddedNodes={handleNewlyAddedNodes}
                externalShowReferenced={localReferencedNodes.length === 0 ? false : undefined}
                externalShowFocus={localReferencedNodes.length === 0 ? false : undefined}
                externalShowNewlyAdded={newlyAddedNodes.length === 0 ? false : undefined}
                clearTrigger={clearTrigger}
                // ✅ 다크모드 prop 전달
                isDarkMode={isDarkMode}
            />

            <div className="fullscreen-overlay">
                <div className="fullscreen-toolbar">
                    <div className="toolbar-left">
                        <div className="fullscreen-search-container">
                            <div className="fullscreen-search-input-wrapper">
                                <span className="fullscreen-search-icon">🔍</span>
                                <input
                                    id="fullscreen-node-search"
                                    type="text"
                                    placeholder="노드 검색 (⌘F)"
                                    value={searchQuery}
                                    onChange={handleSearchInput}
                                    className="fullscreen-search-input"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="fullscreen-clear-search-btn"
                                        title="검색 초기화"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <div className="fullscreen-search-results">
                                    {localReferencedNodes.length}개 노드 발견
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="toolbar-right">
                        {/* ✅ 다크모드 토글 버튼 추가 */}
                        <button
                            onClick={toggleDarkMode}
                            className="fullscreen-control-btn darkmode-toggle"
                            title={`${isDarkMode ? '라이트' : '다크'}모드 (⌘D)`}
                        >
                            <span className="fullscreen-btn-icon">
                                {isDarkMode ? '☀️' : '🌙'}
                            </span>
                            <span className="btn-text">
                                {isDarkMode ? '라이트' : '다크'}
                            </span>
                        </button>

                        <button
                            onClick={() => setShowAdvancedControls(prev => !prev)}
                            className={`fullscreen-control-btn advanced-toggle ${showAdvancedControls ? 'active' : ''}`}
                            title="고급 컨트롤 토글 (⌘K)"
                        >
                            <span className="fullscreen-btn-icon">⚙️</span>
                            <span className="btn-text">고급</span>
                        </button>

                        <button
                            onClick={() => {
                                console.log('🔄 새로고침 버튼 클릭됨');
                                if (props.onRefresh) {
                                    props.onRefresh();
                                } else {
                                    localStorage.setItem('graphStateSync', JSON.stringify({
                                        brainId: props.brainId,
                                        action: 'refresh_from_fullscreen',
                                        timestamp: Date.now()
                                    }));
                                }
                            }}
                            className="fullscreen-control-btn refresh-btn"
                            title="그래프 새로고침"
                        >
                            <span className="fullscreen-btn-icon">🔄</span>
                            <span className="btn-text">새로고침</span>
                        </button>

                        {(localReferencedNodes.length > 0 ||
                            (props.focusNodeNames && props.focusNodeNames.length > 0) ||
                            newlyAddedNodes.length > 0) && (
                                <button
                                    onClick={clearSearch}
                                    className="fullscreen-control-btn fullscreen-clear-btn"
                                    title="하이라이트 해제"
                                >
                                    <span className="fullscreen-btn-icon">✕</span>
                                    <span className="btn-text">해제</span>
                                </button>
                            )}
                    </div>
                </div>

                {showAdvancedControls && (
                    <div className="fullscreen-advanced-controls-panel">
                        <div className="fullscreen-panel-header">
                            <h4>그래프 설정</h4>
                            <button
                                onClick={() => setShowAdvancedControls(false)}
                                className="fullscreen-close-panel-btn"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="fullscreen-panel-content">
                            <div className="fullscreen-control-group">
                                <label>그래프 통계</label>
                                <div className="fullscreen-stats-grid">
                                    <div className="fullscreen-stat-item">
                                        <span className="fullscreen-stat-label">노드</span>
                                        <span className="fullscreen-stat-value">{graphStats.nodes}</span>
                                    </div>
                                    <div className="fullscreen-stat-item">
                                        <span className="fullscreen-stat-label">연결</span>
                                        <span className="fullscreen-stat-value">{graphStats.links}</span>
                                    </div>
                                    <div className="fullscreen-stat-item">
                                        <span className="fullscreen-stat-label">하이라이트</span>
                                        <span className="fullscreen-stat-value">{localReferencedNodes.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="fullscreen-control-group">
                                <label>테마 설정</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {/* ✅ 고급 패널에 다크모드 토글 추가 */}
                                    <button
                                        onClick={toggleDarkMode}
                                        className="fullscreen-control-btn darkmode-toggle"
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                    >
                                        {isDarkMode ? '☀️ 라이트모드' : '🌙 다크모드'}
                                    </button>
                                </div>
                            </div>

                            <div className="fullscreen-control-group">
                                <label>빠른 액션</label>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => {
                                            console.log('🔄 고급 패널에서 새로고침');
                                            if (props.onRefresh) {
                                                props.onRefresh();
                                            }
                                        }}
                                        className="fullscreen-control-btn"
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                    >
                                        🔄 새로고침
                                    </button>

                                    {(localReferencedNodes.length > 0 ||
                                        (props.focusNodeNames && props.focusNodeNames.length > 0) ||
                                        newlyAddedNodes.length > 0) && (
                                            <button
                                                onClick={clearSearch}
                                                className="fullscreen-control-btn fullscreen-clear-btn"
                                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                            >
                                                ✕ 해제
                                            </button>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="fullscreen-statusbar">
                    <div className="fullscreen-status-left">
                        {(localReferencedNodes.length > 0 || newlyAddedNodes.length > 0) && (
                            <div className="fullscreen-highlighted-nodes">
                                <span className="fullscreen-status-icon">📍</span>
                                <span className="fullscreen-status-text">
                                    {props.focusNodeNames && props.focusNodeNames.length > 0 ? '포커스' :
                                        newlyAddedNodes.length > 0 ? '새로 추가' : '하이라이트'}:
                                    {(localReferencedNodes.length > 0 ? localReferencedNodes : newlyAddedNodes).slice(0, 3).join(', ')}
                                    {((localReferencedNodes.length > 0 ? localReferencedNodes : newlyAddedNodes).length > 3) &&
                                        ` 외 ${(localReferencedNodes.length > 0 ? localReferencedNodes : newlyAddedNodes).length - 3}개`}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="fullscreen-status-right">
                        <div className="fullscreen-keyboard-shortcuts">
                            <span className="fullscreen-shortcut">⌘F</span>
                            <span className="fullscreen-shortcut">⌘D</span>
                            <span className="fullscreen-shortcut">⌘K</span>
                            <span className="fullscreen-shortcut">ESC</span>
                            <span className="fullscreen-shortcut-desc">더블클릭으로 이동</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GraphViewForFullscreen;