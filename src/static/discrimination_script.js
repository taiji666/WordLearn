// File: static/discrimination_script.js
document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('toggle-review-btn');
    const errorMessageArea = document.getElementById('error-message-area');
    const currentTopicIdInput = document.getElementById('current-topic-id');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    
    // Sidebar elements (consistent with index.html)
    const groupListElement = document.getElementById('group-list');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseButton = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    const sidebarSearchInput = document.getElementById('sidebar-search');
    const toggleShowWords = document.getElementById('toggle-show-words');
    const wordsShownCount = document.getElementById('words-shown-count');

    let isReviewMode = false;
    let discriminationDataGlobal = null;
    let vocabularyDataGlobal = null; // For unified sidebar
    const currentTopicId = currentTopicIdInput ? currentTopicIdInput.value : null;

    let wordContainers = [];
    let totalWordItems = 0;

    // --- Sidebar Toggle Functionality ---
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            if (window.innerWidth < 1024) { // Standard check
                sidebarToggle.classList.add('hidden');
            }
        });
    }
    if (sidebarCloseButton && sidebar) {
        sidebarCloseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            if (window.innerWidth < 1024) { // Standard check
                sidebarToggle.classList.remove('hidden');
            }
        });
    }
    document.addEventListener('click', (event) => {
        if (sidebar && sidebarToggle && !sidebar.contains(event.target) && 
            !sidebarToggle.contains(event.target) && window.innerWidth < 1024) {
            if (!sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('translate-x-0');
                sidebar.classList.add('-translate-x-full');
                sidebarToggle.classList.remove('hidden');
            }
        }
    });

    // Update back to home button link
    if (backToHomeBtn && currentTopicId) {
        backToHomeBtn.href = `/?topicId=${encodeURIComponent(currentTopicId)}`;
    } else if (backToHomeBtn) {
        backToHomeBtn.href = '/'; 
    }

    // --- "Show Words List" Toggle Functionality ---
    if (toggleShowWords && wordsShownCount) {
        toggleShowWords.addEventListener('change', function() {
            const isChecked = this.checked;
            localStorage.setItem('showWordsInDiscriminationSidebar', isChecked ? 'true' : 'false');
            
            wordContainers.forEach(container => {
                container.classList.toggle('hidden', !isChecked);
            });
            
            wordsShownCount.textContent = isChecked ? totalWordItems : "0";
            
            document.querySelectorAll('#sidebar .subgroup-arrow').forEach(arrow => {
                const subGroupItem = arrow.closest('.subgroup-item');
                if (subGroupItem) {
                    const wordListContainer = subGroupItem.querySelector('.word-list-container');
                    if (wordListContainer) {
                         arrow.classList.toggle('expanded', isChecked && !wordListContainer.classList.contains('hidden'));
                    }
                }
            });
        });
    }


    const BIANXI_KNOWN_KEYS = [
        "感情色彩", "词义的细微差别", "使用语境/场合", "语法功能和用法",
        "搭配关系", "词语的强度", "正式程度/语体风格", "具体含义vs.抽象含义",
        "具体指代或强调的侧重点"
    ];

    const generalItemTagClasses = 'item-tag inline-block bg-gray-200 text-gray-700 px-2.5 py-1 text-xs sm:text-sm rounded-md font-mono mx-0.5 my-1 shadow-sm hover:bg-gray-300 transition-colors';
    const semanticItemTagClasses = 'semantic-item-tag inline-block bg-indigo-100 text-indigo-700 px-3 py-1.5 text-base sm:text-lg rounded-md font-sans mx-0.5 my-1 shadow-sm hover:bg-indigo-200 transition-colors';

    function displayError(message, isWarning = false) {
        const alertType = isWarning ? 'yellow' : 'red';
        errorMessageArea.innerHTML = `<div class="p-4 mb-4 text-sm text-${alertType}-700 bg-${alertType}-100 rounded-lg shadow-md" role="alert">
                                        <strong class="font-bold block sm:inline">${isWarning ? '提示' : '错误!'}</strong>
                                        <span class="block sm:inline ml-1">${message}</span>
                                     </div>`;
        if (!isWarning) {
            contentAreaElement.innerHTML = '';
        }
    }

    if (!currentTopicId && topicTitleElement && !window.location.pathname.includes('discrimination')) { 
        // Show error only if no topicId AND we are on a page expecting one (like discrimination detail)
        // This condition might need adjustment based on how you handle the root path /discrimination/
        displayError('未指定单词分组ID。无法加载辨析内容。');
        if (topicTitleElement) topicTitleElement.textContent = '单词辨析 (错误)';
    }


    async function fetchDiscriminationData() {
        if (discriminationDataGlobal) return discriminationDataGlobal;
        if (!currentTopicId) return null; 
        try {
            const response = await fetch('/data/vocabulary_discrimination_data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            discriminationDataGlobal = await response.json();
            return discriminationDataGlobal;
        } catch (error) {
            console.error('加载或处理辨析数据失败:', error);
            displayError(`加载辨析数据失败: ${error.message}`);
            return null;
        }
    }

    async function fetchVocabularyData() { 
        if (vocabularyDataGlobal) return vocabularyDataGlobal;
        try {
            const response = await fetch('/data/vocabulary_data.json'); 
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            vocabularyDataGlobal = await response.json();
            return vocabularyDataGlobal;
        } catch (error) {
            console.error('无法加载词汇数据 (for sidebar):', error);
            if (groupListElement) groupListElement.innerHTML = `<li class="p-3 text-sm text-red-500">侧边栏词汇加载失败: ${error.message}</li>`;
            return null;
        }
    }
    
    // +++ 新增：辅助函数用于高亮元素 +++
    function highlightElement(element) {
        if (!element) return;
        element.classList.add('highlighted-word-card');
        // Optional: remove highlight after some time
        setTimeout(() => {
            element.classList.remove('highlighted-word-card');
        }, 3000); // 高亮3秒
    }

    // +++ 新增：处理滚动和高亮的函数 +++
    function handleScrollAndHighlight(wordToScrollTo) {
        if (!wordToScrollTo || !contentAreaElement) return;

        // Wait a brief moment for content to be fully rendered
        requestAnimationFrame(() => {
            const wordTitleElements = contentAreaElement.querySelectorAll('h3.word-title[data-original-word]');
            let targetCard = null;

            for (const titleEl of wordTitleElements) {
                // Ensure exact match, considering potential decoding differences if any (though decodeURIComponent should handle most)
                if (titleEl.dataset.originalWord === wordToScrollTo) {
                    targetCard = titleEl.closest('.discrimination-word'); // .discrimination-word is the main card div
                    break;
                }
            }

            if (targetCard) {
                targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                highlightElement(targetCard);
            } else {
                // console.warn(`Word card for "${wordToScrollTo}" not found in content area.`);
            }
        });
    }
    
    function populateSidebar(loadedVocabularyData, activeTopicId = null) {
        if (!groupListElement) {
            console.error("Error: Sidebar group list element (ul#group-list) is not found!");
            return;
        }
        groupListElement.innerHTML = ''; 
        wordContainers = []; 
        totalWordItems = 0;

        if (!loadedVocabularyData || !loadedVocabularyData.vocabulary_collection) {
            console.error("Error: vocabulary_collection is missing in loaded data for sidebar.");
            groupListElement.innerHTML = '<li class="p-3 text-sm text-red-500">词汇数据格式不正确或加载失败。</li>';
            return;
        }

        loadedVocabularyData.vocabulary_collection.forEach(collection => {
            const collectionLi = document.createElement('li');
            collectionLi.className = 'mb-2';

            const collectionTitleButton = document.createElement('button');
            collectionTitleButton.className = 'collapsible-title w-full text-left px-3 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors duration-150 flex justify-between items-center text-sm';
            collectionTitleButton.innerHTML = `
                <span>${collection.title}</span>
                <i class="fas fa-chevron-right transform transition-transform duration-200 text-gray-500 text-xs arrow-icon"></i>
            `;
            collectionLi.appendChild(collectionTitleButton);

            if (collection.sub_groups && collection.sub_groups.length > 0) {
                const subGroupUl = document.createElement('ul');
                subGroupUl.className = 'subgroup-list mt-1 ml-3 pl-3 border-l-2 border-gray-200 space-y-1 hidden';
                let isParentExpanded = false;

                collection.sub_groups.forEach(subGroup => {
                    const subGroupLi = document.createElement('li');
                    subGroupLi.className = 'subgroup-item';

                    const subGroupLink = document.createElement('a');
                    subGroupLink.href = `/discrimination?topicId=${subGroup.id}`; 
                    subGroupLink.className = `subgroup-title block px-3 py-1.5 text-sm rounded-md transition-colors duration-150 items-center justify-between cursor-pointer flex`;
                    subGroupLink.dataset.subGroupId = String(subGroup.id);
                    
                    const isSubGroupActive = String(subGroup.id) === activeTopicId;
                    
                    if (isSubGroupActive) {
                        subGroupLink.classList.add('sidebar-link-active');
                        isParentExpanded = true;
                    } else {
                        subGroupLink.classList.add('text-gray-600', 'hover:text-gray-800', 'hover:bg-gray-100');
                    }

                    const contentSpan = document.createElement('span');
                    contentSpan.className = 'flex-1 truncate flex items-center';
                    
                    const titleSpan = document.createElement('span');
                    titleSpan.textContent = subGroup.title;
                    
                    const wordCount = subGroup.words ? subGroup.words.length : 0;
                    const wordCountSpan = document.createElement('span');
                    wordCountSpan.className = 'ml-2 bg-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-600';
                    wordCountSpan.textContent = wordCount > 0 ? `${wordCount}` : '0';
                    
                    contentSpan.appendChild(titleSpan);
                    contentSpan.appendChild(wordCountSpan);

                    const expandBtn = document.createElement('i');
                    expandBtn.className = 'subgroup-arrow fas fa-chevron-right ml-2 text-gray-400 text-xs cursor-pointer flex-shrink-0';
                    if (!subGroup.words || subGroup.words.length === 0) {
                        expandBtn.classList.add('opacity-0', 'pointer-events-none');
                    }

                    subGroupLink.appendChild(contentSpan);
                    subGroupLink.appendChild(expandBtn);
                    
                    subGroupLink.addEventListener('click', (event) => {
                        if (expandBtn.contains(event.target) && subGroup.words && subGroup.words.length > 0) {
                            event.preventDefault(); 
                            const wordListContainer = subGroupLi.querySelector('.word-list-container');
                            if (wordListContainer) {
                                const isCurrentlyHidden = wordListContainer.classList.toggle('hidden');
                                expandBtn.classList.toggle('expanded', !isCurrentlyHidden);
                                if (toggleShowWords) { 
                                    const allExpanded = !Array.from(wordContainers).some(c => c.classList.contains('hidden'));
                                    toggleShowWords.checked = allExpanded;
                                    if(wordsShownCount) wordsShownCount.textContent = toggleShowWords.checked ? totalWordItems : "0";
                                }
                            }
                        } else if (String(subGroup.id) === activeTopicId && !expandBtn.contains(event.target)) {
                             event.preventDefault(); 
                        }
                         if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full') && !expandBtn.contains(event.target)) {
                            sidebar.classList.remove('translate-x-0');
                            sidebar.classList.add('-translate-x-full');
                            if(sidebarToggle) sidebarToggle.classList.remove('hidden');
                        }
                    });

                    subGroupLi.appendChild(subGroupLink);

                    if (subGroup.words && subGroup.words.length > 0) {
                        totalWordItems += subGroup.words.length;
                        const wordListContainer = document.createElement('div');
                        wordListContainer.className = 'word-list-container ml-4 mt-1 mb-1 space-y-0.5 pl-2 border-l border-gray-200 hidden';
                        wordContainers.push(wordListContainer);

                        const wordList = document.createElement('div');
                        wordList.className = 'word-grid p-1'; 
                        
                        subGroup.words.forEach(wordObj => {
                            const wordItem = document.createElement('div');
                            wordItem.setAttribute('role', 'button');
                            wordItem.setAttribute('tabindex', '0');
                            wordItem.className = 'word-card flex items-center justify-start cursor-pointer text-left';
                            
                            const wordTextSpan = document.createElement('span');
                            wordTextSpan.textContent = wordObj.word;
                            wordTextSpan.className = 'truncate';

                            wordItem.appendChild(wordTextSpan);
                            
                            // +++ 修改：为单词项的点击和键盘事件添加滚动和高亮逻辑 +++
                            const targetHrefWithWord = `/discrimination?topicId=${subGroup.id}&scrollToWord=${encodeURIComponent(wordObj.word)}`;

                            wordItem.addEventListener('click', (e) => {
                                e.preventDefault(); 
                                e.stopPropagation();

                                if (String(subGroup.id) !== activeTopicId) {
                                    window.location.href = targetHrefWithWord;
                                } else {
                                    // Same topic, just scroll and highlight
                                    handleScrollAndHighlight(wordObj.word);
                                }

                                if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                                    sidebar.classList.remove('translate-x-0');
                                    sidebar.classList.add('-translate-x-full');
                                    if (sidebarToggle) sidebarToggle.classList.remove('hidden');
                                }
                            });
                            wordItem.addEventListener('keydown', (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault(); 
                                    e.stopPropagation();
                                    if (String(subGroup.id) !== activeTopicId) {
                                       window.location.href = targetHrefWithWord;
                                    } else {
                                       handleScrollAndHighlight(wordObj.word);
                                    }
                                     if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                                        sidebar.classList.remove('translate-x-0');
                                        sidebar.classList.add('-translate-x-full');
                                        if (sidebarToggle) sidebarToggle.classList.remove('hidden');
                                    }
                                }
                            });
                            wordList.appendChild(wordItem);
                        });

                        wordListContainer.appendChild(wordList);
                        subGroupLi.appendChild(wordListContainer);
                        
                        const showWordsInitially = localStorage.getItem('showWordsInDiscriminationSidebar') !== 'false';
                        wordListContainer.classList.toggle('hidden', !showWordsInitially);
                        expandBtn.classList.toggle('expanded', showWordsInitially && wordCount > 0);
                    }
                    subGroupUl.appendChild(subGroupLi);
                });
                collectionLi.appendChild(subGroupUl);

                if (isParentExpanded) {
                    subGroupUl.classList.remove('hidden');
                    collectionTitleButton.querySelector('.arrow-icon').classList.replace('fa-chevron-right', 'fa-chevron-down');
                }

                collectionTitleButton.addEventListener('click', () => {
                    subGroupUl.classList.toggle('hidden');
                    const icon = collectionTitleButton.querySelector('.arrow-icon');
                    icon.classList.toggle('fa-chevron-right');
                    icon.classList.toggle('fa-chevron-down');
                });
            } else {
                collectionTitleButton.querySelector('.arrow-icon').classList.add('hidden');
            }
            groupListElement.appendChild(collectionLi);
        });
        
        if (wordsShownCount && toggleShowWords) {
            const showWords = localStorage.getItem('showWordsInDiscriminationSidebar') !== 'false';
            toggleShowWords.checked = showWords;
            wordsShownCount.textContent = showWords ? totalWordItems : '0';

            wordContainers.forEach(container => {
                container.classList.toggle('hidden', !showWords);
            });
            document.querySelectorAll('#sidebar .subgroup-arrow').forEach(arrow => {
                const wordListContainer = arrow.closest('.subgroup-item')?.querySelector('.word-list-container');
                 const hasWords = wordListContainer && wordListContainer.querySelector('.word-card'); 
                if (wordListContainer && hasWords) {
                    arrow.classList.toggle('expanded', showWords && !wordListContainer.classList.contains('hidden'));
                } else if (!hasWords) {
                     arrow.classList.remove('expanded');
                     arrow.classList.add('opacity-0', 'pointer-events-none');
                }
            });
        }
    }

    // --- Sidebar Search Functionality (保持不变) ---
    if (sidebarSearchInput && groupListElement) {
        sidebarSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (!searchTerm) {
                if (vocabularyDataGlobal) populateSidebar(vocabularyDataGlobal, currentTopicId);
                // Hide toggle and count during search results display maybe? Or keep them. For now, keep.
                if (toggleShowWords) toggleShowWords.closest('.flex.items-center.mb-4').style.display = '';

                return;
            }
            // if (toggleShowWords) toggleShowWords.closest('.flex.items-center.mb-4').style.display = 'none';
            
            const searchResultsContainer = document.createElement('div');
            searchResultsContainer.id = 'search-results-container'; 
            searchResultsContainer.className = 'space-y-2';
            groupListElement.innerHTML = ''; 
            groupListElement.appendChild(searchResultsContainer);
            
            let anyMatchFound = false;
            let resultCount = 0;
            
            if (!vocabularyDataGlobal || !vocabularyDataGlobal.vocabulary_collection) {
                 searchResultsContainer.innerHTML = `<div class="p-3 text-sm text-gray-500">词汇数据未加载，无法搜索。</div>`;
                 return;
            }

            vocabularyDataGlobal.vocabulary_collection.forEach(collection => {
                if (!collection.sub_groups) return;
                
                collection.sub_groups.forEach(subGroup => {
                    const matches = [];
                    const collectionTitle = collection.title.toLowerCase();
                    const subGroupTitle = subGroup.title.toLowerCase();
                    let groupMatchedByTitle = false;
                    
                    if (collectionTitle.includes(searchTerm) || subGroupTitle.includes(searchTerm)) {
                        groupMatchedByTitle = true; // The group title itself matches
                    }
                    
                    let wordsInGroupMatched = false;
                    if (subGroup.words && subGroup.words.length > 0) {
                        subGroup.words.forEach(wordObj => {
                            const word = wordObj.word.toLowerCase();
                            if (word.includes(searchTerm)) {
                                matches.push({wordObj, subGroupId: subGroup.id, groupTitle: `${collection.title} > ${subGroup.title}`});
                                wordsInGroupMatched = true; 
                                resultCount++;
                            }
                        });
                    }
                    
                    if (groupMatchedByTitle || wordsInGroupMatched) { // Show group if title matches OR if any word in it matches
                        anyMatchFound = true;
                        
                        const groupLink = document.createElement('a');
                        groupLink.className = 'block px-3 py-2 text-sm rounded-md bg-blue-50 text-blue-700 font-medium cursor-pointer hover:bg-blue-100';
                        groupLink.innerHTML = `<i class="fas fa-folder mr-2 w-4 text-center"></i> ${collection.title} / ${subGroup.title}`;
                        groupLink.href = `/discrimination?topicId=${subGroup.id}`; // Link to the group page
                        groupLink.addEventListener('click', () => { 
                             if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full') ) {
                                sidebar.classList.remove('translate-x-0');
                                sidebar.classList.add('-translate-x-full');
                                if(sidebarToggle) sidebarToggle.classList.remove('hidden');
                            }
                        });
                        searchResultsContainer.appendChild(groupLink);
                        
                        // Display matched words under their group
                        matches.forEach(match => {
                            const wordLink = document.createElement('a');
                            wordLink.className = 'block px-3 py-2 text-sm rounded-md ml-4 bg-green-50 text-green-700 hover:bg-green-100 flex items-center';
                            // +++ 修改: 搜索结果中的单词也应包含 scrollToWord 参数 +++
                            wordLink.href = `/discrimination?topicId=${match.subGroupId}&scrollToWord=${encodeURIComponent(match.wordObj.word)}`;
                            wordLink.innerHTML = `<i class="fas fa-search mr-3 text-xs w-4 text-center"></i> <span class="font-medium mr-2">${match.wordObj.word}</span> <i class="fas fa-chevron-right text-xs ml-auto"></i>`;
                             wordLink.addEventListener('click', (e) => { // Allow default navigation but close sidebar
                                 if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full') ) {
                                    sidebar.classList.remove('translate-x-0');
                                    sidebar.classList.add('-translate-x-full');
                                    if(sidebarToggle) sidebarToggle.classList.remove('hidden');
                                }
                                // No preventDefault, let href work.
                            });
                            searchResultsContainer.appendChild(wordLink);
                        });
                    }
                });
            });
            
            if (!anyMatchFound) {
                const noResultsDiv = document.createElement('div');
                noResultsDiv.className = 'p-3 text-center text-gray-500 text-sm';
                noResultsDiv.innerHTML = `<i class="fas fa-search mr-2"></i>没有找到匹配的单词或分组`;
                searchResultsContainer.appendChild(noResultsDiv);
            } else {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'text-xs text-gray-500 px-3 pt-2 pb-1 bg-gray-50 rounded-b';
                infoDiv.innerHTML = `找到 ${resultCount} 个匹配的单词（在以上分组中）`;
                searchResultsContainer.appendChild(infoDiv);
            }
        });
    }


    async function initializeDiscriminationPage() {
        const vocabularyData = await fetchVocabularyData();
        if (vocabularyData) {
            populateSidebar(vocabularyData, currentTopicId); 
        } else {
             if (groupListElement) groupListElement.innerHTML = `<li class="p-3 text-sm text-red-500">侧边栏加载失败。</li>`;
        }

        if (currentTopicId) {
            const discriminationData = await fetchDiscriminationData();
            if (!discriminationData) { 
                 if (!contentAreaElement.innerHTML.includes('alert')) { 
                     displayError(`无法加载ID为 "${currentTopicId}" 的辨析数据。`, true);
                 }
                 return;
            }

            if (!discriminationData.vocabulary_collection) {
                displayError('辨析数据格式不正确。');
                return;
            }

            const discriminationGroupData = discriminationData.vocabulary_collection.find(item =>
                item && typeof item.topic === 'string' && item.topic.startsWith(currentTopicId)
            );

            if (discriminationGroupData) {
                if (topicTitleElement) topicTitleElement.innerHTML = `单词辨析: <span class="text-orange-500 font-semibold">${discriminationGroupData.topic.split('：')[1] || discriminationGroupData.topic}</span>`;
                
                renderDiscriminationData(discriminationGroupData.words.words, contentAreaElement, BIANXI_KNOWN_KEYS);
                renderSummary(discriminationGroupData.words.discriminate, contentAreaElement);
                
                if (reviewButton) {
                    reviewButton.classList.remove('hidden');
                    reviewButton.classList.add('inline-flex');
                }
                initializeInteractiveElements(); 

                // +++ 修改：在内容渲染后检查并处理 scrollToWord 参数 +++
                const urlParams = new URLSearchParams(window.location.search);
                const wordToScroll = urlParams.get('scrollToWord');
                if (wordToScroll) {
                    handleScrollAndHighlight(decodeURIComponent(wordToScroll));
                }

            } else {
                displayError(`未找到ID为 "${currentTopicId}" 的单词分组的辨析信息。`, true);
                if (topicTitleElement) topicTitleElement.textContent = `单词辨析: ${currentTopicId} (未找到)`;
                contentAreaElement.innerHTML = `
                    <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-search-minus text-5xl text-yellow-500 mb-4"></i>
                        <p class="text-gray-500 text-lg">该分组暂无辨析内容。</p>
                        <p class="text-xs text-gray-400 mt-2">ID: ${currentTopicId}</p>
                    </div>`;
            }
        } else {
             if (topicTitleElement) topicTitleElement.textContent = '单词辨析';
             contentAreaElement.innerHTML = `
                <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                    <i class="fas fa-hand-point-left text-5xl text-blue-500 mb-4"></i>
                    <p class="text-gray-600 text-lg">请从左侧侧边栏选择一个单词分组查看辨析内容。</p>
                </div>`;
            if (reviewButton) reviewButton.classList.add('hidden');
        }
    }

    if (reviewButton) {
        reviewButton.addEventListener('click', () => {
            isReviewMode = !isReviewMode;
            toggleReviewModeUI(isReviewMode, contentAreaElement);
            reviewButton.innerHTML = isReviewMode ?
                '<i class="fas fa-eye mr-2 fa-fw"></i> 退出背诵模式' :
                '<i class="fas fa-book-open mr-2 fa-fw"></i> 进入背诵模式';

            if (isReviewMode) {
                reviewButton.classList.replace('bg-orange-500', 'bg-green-600');
                reviewButton.classList.replace('hover:bg-orange-600', 'hover:bg-green-700');
            } else {
                reviewButton.classList.replace('bg-green-600', 'bg-orange-500');
                reviewButton.classList.replace('hover:bg-green-700', 'hover:bg-orange-600');
            }
        });
    }

    function renderDiscriminationData(wordsArray, container, knownKeys) {
        container.innerHTML = ''; 

        if (!wordsArray || wordsArray.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                     <i class="fas fa-info-circle text-5xl text-blue-400 mb-4"></i>
                    <p class="text-gray-600 text-lg">此主题下暂无单词辨析信息。</p>
                </div>`;
            return;
        }

        wordsArray.forEach(wordData => {
            const wordDiv = document.createElement('div');
            wordDiv.className = 'discrimination-word bg-white border border-gray-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out space-y-5';

            // +++ 确保 data-original-word 被正确设置 +++
            let htmlContent = `<h3 class="word-title text-3xl md:text-4xl font-bold text-orange-600 mb-4 pb-3 border-b border-gray-200" data-original-word="${wordData.word}">${wordData.word}</h3>`;

            htmlContent += `<div class="section-vernacular-description word-details-section review-collapsible-section py-2">
                                <div class="tongsu-miaoshu-container bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                                    <h4 class="text-xs font-semibold text-blue-600 mb-1.5 uppercase tracking-wider">通俗描述</h4>
                                    <p class="text-gray-700 text-sm md:text-base leading-relaxed">${wordData['通俗描述'] || '无'}</p>
                                </div>
                            </div>`;
            
            if (wordData['语义分析']) {
                 let yuyiFenxiContent = `<p><strong class="text-indigo-600 font-medium">核心意义:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">语境延展:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['语境延展'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">核心意义的体现:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义的体现'] || '无'}</span></p>`;
                htmlContent += buildSectionHtml('语义分析', yuyiFenxiContent, true, 'section-semantic-analysis');
            }

            htmlContent += buildSectionHtml('主要释义', `<p>${wordData['主要释义'] || '无'}</p>`, true, 'section-to-hide-in-review');

            if (wordData['全面释义'] && wordData['全面释义'].length > 0) {
                let quanmianShiyiList = '<ul class="list-decimal list-inside space-y-1.5">';
                wordData['全面释义'].forEach(s => { quanmianShiyiList += `<li>${s}</li>`; });
                quanmianShiyiList += `</ul>`;
                htmlContent += buildSectionHtml('全面释义', quanmianShiyiList, true, 'section-to-hide-in-review');
            }
            
            let bianxiDisplayContent = '';
            if (wordData['辨析']) {
                if (typeof wordData['辨析'] === 'string') {
                    const discriminationText = wordData['辨析'];
                    let detailsHtml = '<div class="space-y-2">';
                    let foundAnyDetail = false;
                    const lines = discriminationText.split('\n').map(line => line.trim()).filter(line => line);
                    let currentKeyContent = "";
                    lines.forEach(line => {
                        let matchedKey = false;
                        for (const key of knownKeys) {
                            if (line.startsWith(key + ":") || line.startsWith(key + "：")) { // Support both colons
                                if (currentKeyContent) detailsHtml += currentKeyContent + `</span></p>`;
                                currentKeyContent = `<p><strong class="block text-blue-600 font-medium mb-0.5">${key}:</strong> <span class="${generalItemTagClasses}">` + line.substring(key.length + 1).trim();
                                foundAnyDetail = true;
                                matchedKey = true;
                                break;
                            }
                        }
                        if (!matchedKey && currentKeyContent) {
                            currentKeyContent += " " + line;
                        } else if (!matchedKey && !currentKeyContent && line) {
                             detailsHtml += `<p class="${generalItemTagClasses}">${line}</p>`;
                             foundAnyDetail = true;
                        }
                    });
                    if (currentKeyContent) detailsHtml += currentKeyContent + `</span></p>`;
                    if (!foundAnyDetail && discriminationText.trim()) {
                        detailsHtml += `<p class="${generalItemTagClasses}">${discriminationText.trim()}</p>`;
                    }
                    detailsHtml += `</div>`;
                    bianxiDisplayContent = detailsHtml;
                } else { // Fallback for non-string (though data should be string)
                    bianxiDisplayContent = `<p class="${generalItemTagClasses}">${String(wordData['辨析'])}</p>`;
                }
            }
            if (bianxiDisplayContent) {
                htmlContent += buildSectionHtml('辨析要点', bianxiDisplayContent, true, 'section-to-hide-in-review');
            }

            wordDiv.innerHTML = htmlContent;
            container.appendChild(wordDiv);
        });
    }

    function renderSummary(summaryText, container) {
        if (summaryText && summaryText.trim()) {
            const summaryDiv = document.createElement('div');
            summaryDiv.className = 'summary-section bg-white border border-gray-200 p-6 md:p-8 rounded-xl shadow-lg mt-8';
    
            const htmlSummary = typeof marked !== 'undefined' ? marked.parse(summaryText) : summaryText.replace(/\n/g, '<br>'); 
    
            summaryDiv.innerHTML = `
                <h2 class="text-2xl md:text-3xl font-bold text-orange-600 mb-4">总结</h2>
                <div class="tongsu-miaoshu-container bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                    <div class="prose prose-indigo max-w-none">${htmlSummary}</div>
                </div>`;
            container.appendChild(summaryDiv);
        }
    }

    function buildSectionHtml(title, content, isCollapsible = false, wrapperClass = '') {
        if (!content || (typeof content === 'string' && content.trim() === '')) return '';

        let titleClasses = "text-lg md:text-xl font-semibold text-gray-700 mb-2";
        let contentBlockClasses = "text-gray-700 text-sm md:text-base leading-relaxed"; 
        
        if (wrapperClass === 'section-semantic-analysis') {
            contentBlockClasses = "text-gray-700 text-lg md:text-xl leading-relaxed";
        }

        let sectionWrapperClasses = `word-details-section review-collapsible-section py-2 ${wrapperClass}`; 
        let contentWrapperClasses = "mt-2 space-y-2"; 
        let iconHtml = '<i class="fas fa-chevron-right arrow-icon text-xs text-gray-400 mr-2"></i>';

        if (isCollapsible) {
            titleClasses += " collapsible-toggle cursor-pointer hover:text-blue-700 transition-colors flex items-center";
            contentWrapperClasses += " hidden pl-5 border-l-2 border-gray-200";
        } else {
            iconHtml = ''; 
        }
        
        if (wrapperClass === 'section-semantic-analysis') {
             contentBlockClasses += " bg-indigo-50 p-4 rounded-md";
        }

        let sectionHtml = `<div class="${sectionWrapperClasses}">`;
        sectionHtml += `<h4 class="${titleClasses}">${iconHtml}${title}</h4>`;
        sectionHtml += `<div class="${contentWrapperClasses}">`;
        sectionHtml += `<div class="${contentBlockClasses}">${content}</div>`; 
        sectionHtml += `</div>`;
        sectionHtml += `</div>`;
        return sectionHtml;
    }

    function toggleReviewModeUI(inReviewMode, contentArea) {
        const wordTitles = contentArea.querySelectorAll('.word-title');
        const allSections = contentArea.querySelectorAll('.word-details-section'); 

        wordTitles.forEach(title => {
            title.classList.toggle('word-title-blurred', inReviewMode);
            if (!inReviewMode) {
                title.textContent = title.dataset.originalWord;
            }
        });

        allSections.forEach(section => {
            const isVernacular = section.classList.contains('section-vernacular-description');
            const isSemantic = section.classList.contains('section-semantic-analysis');

            if (inReviewMode) {
                if (isVernacular || isSemantic) {
                    section.classList.remove('hidden'); 
                    if (isVernacular) {
                        const pElement = section.querySelector('.tongsu-miaoshu-container p');
                        if (pElement) {
                            pElement.classList.remove('text-sm', 'md:text-base');
                            pElement.classList.add('text-lg', 'md:text-xl'); 
                        }
                    }
                } else {
                    section.classList.add('hidden'); 
                }
            } else { 
                section.classList.remove('hidden'); 
                if (isVernacular) {
                    const pElement = section.querySelector('.tongsu-miaoshu-container p');
                    if (pElement) {
                        pElement.classList.remove('text-lg', 'md:text-xl');
                        pElement.classList.add('text-sm', 'md:text-base'); 
                    }
                }
            }
        });
    }

    function initializeInteractiveElements() { 
        if (!contentAreaElement) return;
        contentAreaElement.addEventListener('click', function(event) {
            const toggle = event.target.closest('.collapsible-toggle');
            if (toggle) {
                const contentWrapper = toggle.nextElementSibling;
                
                if (contentWrapper && contentWrapper.classList.contains('mt-2')) { 
                    contentWrapper.classList.toggle('hidden');
                    toggle.classList.toggle('open'); 
                    const icon = toggle.querySelector('.arrow-icon');
                    if (icon) {
                        if (contentWrapper.classList.contains('hidden')) {
                            icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
                        } else {
                            icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
                        }
                    }
                } else {
                    // console.warn("Collapsible content not found for toggle:", toggle);
                }
            }

            const title = event.target.closest('.word-title.word-title-blurred');
            if (title && isReviewMode) {
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord;
            }
        });
    }
    
    initializeDiscriminationPage();
});