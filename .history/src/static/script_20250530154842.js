// File: static/script.js
document.addEventListener('DOMContentLoaded', () => {
    const groupListElement = document.getElementById('group-list');
    const selectedGroupTitleElement = document.getElementById('selected-group-title');
    const wordDisplayAreaElement = document.getElementById('word-display-area');
    const gotoDiscriminationBtn = document.getElementById('goto-discrimination-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseButton = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    const initialTopicIdElement = document.getElementById('initial-topic-id'); // For index.html
    const currentTopicIdDiscriminationPage = document.getElementById('current-topic-id'); // For discrimination_page.html
    const searchInputElement = document.getElementById('search-input'); // ✨ Search input

    let currentSubGroupIdForDiscrimination = null;
    let vocabularyDataGlobal = null;

    // --- Sidebar Toggle Functionality ---
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
        });
    }
    if (sidebarCloseButton && sidebar) {
        sidebarCloseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
        });
    }
    document.addEventListener('click', (event) => {
        if (sidebar && sidebarToggle && !sidebar.contains(event.target) && !sidebarToggle.contains(event.target) && window.innerWidth < 1024) {
            if (!sidebar.classList.contains('-translate-x-full')) {
                sidebar.classList.remove('translate-x-0');
                sidebar.classList.add('-translate-x-full');
            }
        }
    });

    // --- Data Loading ---
    async function loadJsonData() {
        if (vocabularyDataGlobal) return vocabularyDataGlobal;
        try {
            const response = await fetch('/data/vocabulary_data.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            vocabularyDataGlobal = await response.json();
            return vocabularyDataGlobal;
        } catch (error) {
            console.error('无法加载 JSON 数据:', error);
            const errorHtml = `<div class="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg shadow-md" role="alert">
                                <span class="font-medium">错误!</span> 加载数据失败，请检查文件路径或网络连接。
                             </div>`;
            if (wordDisplayAreaElement) wordDisplayAreaElement.innerHTML = errorHtml;
            if (groupListElement) groupListElement.innerHTML = `<li class="p-3 text-sm text-red-500">${error.message}</li>`;
            return null;
        }
    }

    // --- Button Click Handler (for "goto-discrimination-btn" on index.html) ---
    function handleGoToDiscrimination() {
        if (currentSubGroupIdForDiscrimination) {
            window.location.href = `/discrimination?topicId=${encodeURIComponent(currentSubGroupIdForDiscrimination)}`;
        }
    }

    // --- Display Words in Main Content (for index.html) ---
    function displayWords(subGroup) {
        if (!selectedGroupTitleElement || !wordDisplayAreaElement || !gotoDiscriminationBtn) return;

        selectedGroupTitleElement.textContent = subGroup.title;
        wordDisplayAreaElement.innerHTML = '';
        currentSubGroupIdForDiscrimination = null;

        if (!subGroup.words || subGroup.words.length === 0) {
            wordDisplayAreaElement.innerHTML = `
                <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                    <i class="fas fa-box-open text-5xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500 text-lg">此分组没有单词。</p>
                </div>`;
            gotoDiscriminationBtn.classList.add('hidden');
            gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination);
            return;
        }

        currentSubGroupIdForDiscrimination = String(subGroup.id);
        gotoDiscriminationBtn.classList.remove('hidden');
        gotoDiscriminationBtn.classList.add('inline-flex');
        gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination); // Remove first to avoid multiple listeners
        gotoDiscriminationBtn.addEventListener('click', handleGoToDiscrimination);

        const ul = document.createElement('ul');
        ul.className = 'space-y-6';

        subGroup.words.forEach(wordObj => {
            const li = document.createElement('li');
            li.className = 'bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out';

            let sensesHTML = '';
            if (wordObj.Entry && wordObj.Entry.senses && wordObj.Entry.senses.length > 0) {
                sensesHTML = '<ul class="mt-4 space-y-3 text-gray-700">';
                wordObj.Entry.senses.forEach((sense, index) => {
                    sensesHTML += `<li class="border-l-4 border-blue-200 pl-4 py-1">
                                     <strong class="block text-blue-700 text-base">${index + 1}. ${sense.translation}</strong>
                                     <span class="text-gray-600 text-sm">${sense.definition}</span>
                                   </li>`;
                });
                sensesHTML += '</ul>';
            } else {
                sensesHTML = '<p class="mt-3 text-sm text-gray-500 italic">暂无详细释义。</p>';
            }

            li.innerHTML = `
                <div class="word-header-container flex justify-between items-center cursor-pointer mb-3 pb-3 border-b border-gray-200">
                    <div>
                        <span class="english-word text-2xl font-semibold text-gray-800 hidden">${wordObj.word}</span>
                        <span class="reveal-word-prompt text-sm text-blue-600 hover:text-blue-800 font-medium py-1 px-3 border border-blue-500 hover:bg-blue-100 rounded-full transition-colors duration-150">(显示单词)</span>
                    </div>
                    <p class="part-of-speech text-xs text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-full font-medium"><em>${wordObj.Entry ? wordObj.Entry.part_of_speech : '词性未知'}</em></p>
                </div>
                ${sensesHTML}
            `;

            const wordHeaderContainer = li.querySelector('.word-header-container');
            const englishWordSpan = li.querySelector('.english-word');
            const revealPromptSpan = li.querySelector('.reveal-word-prompt');

            wordHeaderContainer.addEventListener('click', () => {
                englishWordSpan.classList.toggle('hidden');
                revealPromptSpan.textContent = englishWordSpan.classList.contains('hidden') ? '(显示单词)' : '(隐藏单词)';
            });
            ul.appendChild(li);
        });
        wordDisplayAreaElement.appendChild(ul);
    }

    // --- Populate Sidebar (handles search) ---
    function populateSidebar(loadedVocabularyData, activeTopicId = null, searchTerm = '') {
        if (!groupListElement) {
            console.error("Error: Sidebar group list element (ul#group-list) is not found!");
            return;
        }
        groupListElement.innerHTML = ''; 

        if (!loadedVocabularyData || !loadedVocabularyData.vocabulary_collection) {
            console.error("Error: vocabulary_collection is missing in loaded data for sidebar.");
            groupListElement.innerHTML = '<li class="p-3 text-sm text-red-500">词汇数据格式不正确或加载失败。</li>';
            return;
        }

        if (gotoDiscriminationBtn) { // Primarily for index.html
            gotoDiscriminationBtn.classList.add('hidden');
            gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination);
        }
        
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        let resultsFound = false;

        loadedVocabularyData.vocabulary_collection.forEach(collection => {
            const collectionTitleMatches = lowerSearchTerm ? collection.title.toLowerCase().includes(lowerSearchTerm) : false;
            let collectionHasMatchingSubgroupOrWord = false;
            const subGroupNodes = [];

            if (collection.sub_groups && collection.sub_groups.length > 0) {
                collection.sub_groups.forEach(subGroup => {
                    const subGroupTitleMatches = lowerSearchTerm ? subGroup.title.toLowerCase().includes(lowerSearchTerm) : false;
                    let subGroupHasMatchingWord = false;
                    if (lowerSearchTerm && subGroup.words && subGroup.words.length > 0) {
                        subGroupHasMatchingWord = subGroup.words.some(wordObj => wordObj.word.toLowerCase().includes(lowerSearchTerm));
                    }

                    if (!lowerSearchTerm || subGroupTitleMatches || subGroupHasMatchingWord) {
                        collectionHasMatchingSubgroupOrWord = true;
                        resultsFound = true;

                        const subGroupLi = document.createElement('li');
                        const subGroupLink = document.createElement('a');
                        subGroupLink.className = `block px-3 py-2 text-sm rounded-md transition-colors duration-150`;
                        const isSubGroupActive = String(subGroup.id) === activeTopicId;

                        if (isSubGroupActive) {
                            subGroupLink.classList.add('sidebar-link-active');
                        } else {
                            subGroupLink.classList.add('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-800');
                        }
                        
                        const displayTitle = `${subGroup.title} <span class="text-xs text-gray-400 ml-1">(ID: ${subGroup.id})</span>`;

                        if (subGroup.words && subGroup.words.length > 0) {
                            subGroupLink.href = `#topic-${subGroup.id}`; 
                            subGroupLink.classList.add('cursor-pointer');
                            subGroupLink.innerHTML = displayTitle;
                            subGroupLink.dataset.collectionId = String(collection.id);
                            subGroupLink.dataset.subGroupId = String(subGroup.id);

                            subGroupLink.addEventListener('click', (event) => {
                                event.preventDefault();
                                const clickedSubGroupId = subGroupLink.dataset.subGroupId;
                                const clickedCollectionId = subGroupLink.dataset.collectionId;

                                if (wordDisplayAreaElement && selectedGroupTitleElement) { // On index.html
                                    const parentCol = loadedVocabularyData.vocabulary_collection.find(c => String(c.id) === clickedCollectionId);
                                    const selectedSub = parentCol?.sub_groups.find(sg => String(sg.id) === clickedSubGroupId);
                                    if (selectedSub) {
                                        displayWords(selectedSub);
                                        window.history.pushState({ topicId: clickedSubGroupId }, selectedSub.title, `/?topicId=${clickedSubGroupId}`);
                                        document.querySelectorAll('#group-list a').forEach(item => {
                                            item.classList.remove('sidebar-link-active');
                                            if (!item.classList.contains('sidebar-link-active')) {
                                                item.classList.add('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-800');
                                            }
                                        });
                                        subGroupLink.classList.add('sidebar-link-active');
                                        subGroupLink.classList.remove('hover:bg-gray-100', 'hover:text-gray-800');
                                    }
                                } else if (currentTopicIdDiscriminationPage) { // On discrimination_page.html
                                    if (clickedSubGroupId !== activeTopicId) { // activeTopicId here is currentTopicIdDiscriminationPage.value
                                        window.location.href = `/discrimination?topicId=${encodeURIComponent(clickedSubGroupId)}`;
                                    }
                                }
                                if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                                    sidebar.classList.remove('translate-x-0');
                                    sidebar.classList.add('-translate-x-full');
                                }
                            });
                        } else {
                            subGroupLink.innerHTML = displayTitle;
                            subGroupLink.classList.add('text-gray-400', 'cursor-not-allowed', 'opacity-75');
                        }
                        subGroupLi.appendChild(subGroupLink);
                        subGroupNodes.push(subGroupLi);
                    }
                });
            }

            if (!lowerSearchTerm || collectionTitleMatches || collectionHasMatchingSubgroupOrWord) {
                if (!lowerSearchTerm) resultsFound = true;

                const collectionLi = document.createElement('li');
                collectionLi.className = 'mb-1';

                const collectionTitleButton = document.createElement('button');
                collectionTitleButton.className = 'collapsible-title w-full text-left px-3 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors duration-150 flex justify-between items-center text-sm';
                collectionTitleButton.innerHTML = `
                    <span>${collection.title}</span>
                    <i class="fas fa-chevron-right transform transition-transform duration-200 text-gray-500 text-xs arrow-icon"></i>`;
                collectionLi.appendChild(collectionTitleButton);

                if (subGroupNodes.length > 0) {
                    const subGroupUl = document.createElement('ul');
                    subGroupUl.className = 'subgroup-list mt-1 ml-3 pl-3 border-l-2 border-gray-200 space-y-0.5';
                    subGroupNodes.forEach(node => subGroupUl.appendChild(node));
                    collectionLi.appendChild(subGroupUl);

                    const hasActiveChild = collection.sub_groups && collection.sub_groups.some(sg => String(sg.id) === activeTopicId && subGroupNodes.some(n => n.firstChild.dataset.subGroupId === String(sg.id)));
                    const shouldExpand = (lowerSearchTerm && subGroupNodes.length > 0) || hasActiveChild;

                    if (shouldExpand) {
                        subGroupUl.classList.remove('hidden');
                        collectionTitleButton.querySelector('.arrow-icon').classList.replace('fa-chevron-right', 'fa-chevron-down');
                    } else {
                        subGroupUl.classList.add('hidden');
                        collectionTitleButton.querySelector('.arrow-icon').classList.replace('fa-chevron-down', 'fa-chevron-right');
                    }

                    collectionTitleButton.addEventListener('click', () => {
                        subGroupUl.classList.toggle('hidden');
                        const icon = collectionTitleButton.querySelector('.arrow-icon');
                        if (subGroupUl.classList.contains('hidden')) {
                            icon.classList.replace('fa-chevron-down', 'fa-chevron-right');
                        } else {
                            icon.classList.replace('fa-chevron-right', 'fa-chevron-down');
                        }
                    });
                } else {
                    collectionTitleButton.querySelector('.arrow-icon').classList.add('hidden');
                }
                groupListElement.appendChild(collectionLi);
            }
        });

        if (!resultsFound && lowerSearchTerm) {
            groupListElement.innerHTML = `<li class="p-3 text-sm text-gray-500">未找到与 "${searchTerm}" 相关的结果。</li>`;
        } else if (groupListElement.children.length === 0 && !lowerSearchTerm) {
            groupListElement.innerHTML = '<li class="p-3 text-sm text-gray-500">加载分组中或无分组信息...</li>';
        }
    }
    
    // --- Search Event Listener ---
    if (searchInputElement && groupListElement) {
        searchInputElement.addEventListener('input', (event) => {
            const searchTerm = event.target.value;
            if (vocabularyDataGlobal) {
                let currentActiveTopicId = null;
                if (initialTopicIdElement && initialTopicIdElement.value) { // index.html context
                    const urlParams = new URLSearchParams(window.location.search);
                    currentActiveTopicId = urlParams.get('topicId') || (window.history.state ? window.history.state.topicId : initialTopicIdElement.value);
                } else if (currentTopicIdDiscriminationPage && currentTopicIdDiscriminationPage.value) { // discrimination_page.html context
                    currentActiveTopicId = currentTopicIdDiscriminationPage.value;
                }
                populateSidebar(vocabularyDataGlobal, currentActiveTopicId, searchTerm);
            }
        });
    }

    // --- Popstate event for browser back/forward navigation (primarily for index.html) ---
    window.addEventListener('popstate', (event) => {
        if (wordDisplayAreaElement && selectedGroupTitleElement) { // Ensure this runs on index.html
            const newTopicId = event.state ? event.state.topicId : new URLSearchParams(window.location.search).get('topicId');
            if (newTopicId && vocabularyDataGlobal) {
                 let foundSubGroup = null;
                for (const collection of vocabularyDataGlobal.vocabulary_collection) {
                    if (collection.sub_groups) {
                        foundSubGroup = collection.sub_groups.find(sg => String(sg.id) === newTopicId);
                        if (foundSubGroup) break;
                    }
                }
                if (foundSubGroup) {
                    displayWords(foundSubGroup);
                    // Update active state in sidebar
                    document.querySelectorAll('#group-list a').forEach(item => {
                        item.classList.remove('sidebar-link-active');
                        item.classList.add('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-800');
                         if (item.dataset.subGroupId === newTopicId) {
                            item.classList.add('sidebar-link-active');
                            item.classList.remove('hover:bg-gray-100', 'hover:text-gray-800');
                            // Also expand its parent
                            const parentLi = item.closest('li');
                            if(parentLi) {
                                const subGroupUl = parentLi.parentElement;
                                if (subGroupUl && subGroupUl.classList.contains('subgroup-list')) {
                                    subGroupUl.classList.remove('hidden');
                                    const collectionButton = subGroupUl.previousElementSibling;
                                    if(collectionButton && collectionButton.querySelector('.arrow-icon')) {
                                         collectionButton.querySelector('.arrow-icon').classList.replace('fa-chevron-right', 'fa-chevron-down');
                                    }
                                }
                            }
                        }
                    });
                }
            } else if (!newTopicId) { // No topicId, reset to default view
                 selectedGroupTitleElement.textContent = '请选择一个单词分组';
                 wordDisplayAreaElement.innerHTML = `
                    <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-folder-open text-5xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500 text-lg">选择一个分组来查看单词内容。</p>
                    </div>`;
                if(gotoDiscriminationBtn) gotoDiscriminationBtn.classList.add('hidden');
                document.querySelectorAll('#group-list a').forEach(item => item.classList.remove('sidebar-link-active'));
            }
        }
    });

    // --- Initialize Page ---
    async function initializePage() {
        const data = await loadJsonData();
        if (data) {
            let activeTopicId = null;
            const urlParams = new URLSearchParams(window.location.search);
            const currentSearchTerm = searchInputElement ? searchInputElement.value : '';


            // Determine activeTopicId based on context (index.html vs discrimination_page.html)
            if (initialTopicIdElement && initialTopicIdElement.value) { // index.html
                activeTopicId = initialTopicIdElement.value;
                 // If URL has topicId, it should take precedence for initial load on index.html
                const urlTopicId = urlParams.get('topicId');
                if (urlTopicId) activeTopicId = urlTopicId;

            } else if (currentTopicIdDiscriminationPage && currentTopicIdDiscriminationPage.value) { // discrimination_page.html
                activeTopicId = currentTopicIdDiscriminationPage.value;
            } else { // Fallback if elements not present, though one should be
                 activeTopicId = urlParams.get('topicId');
            }
            
            populateSidebar(data, activeTopicId, currentSearchTerm);

            // Logic specific to index.html for displaying words based on activeTopicId
            if (activeTopicId && wordDisplayAreaElement && selectedGroupTitleElement) {
                let foundSubGroup = null;
                for (const collection of data.vocabulary_collection) {
                    if (collection.sub_groups) {
                        foundSubGroup = collection.sub_groups.find(sg => String(sg.id) === activeTopicId);
                        if (foundSubGroup) break;
                    }
                }
                if (foundSubGroup) {
                    displayWords(foundSubGroup);
                    // Ensure URL reflects the loaded topicId on index.html if not already
                    if (!urlParams.has('topicId') || urlParams.get('topicId') !== activeTopicId) {
                         window.history.replaceState({ topicId: activeTopicId }, foundSubGroup.title, `/?topicId=${activeTopicId}`);
                    }
                } else { // Topic ID from URL/input not found in data
                    selectedGroupTitleElement.textContent = "未找到分组";
                    wordDisplayAreaElement.innerHTML = `<div class="p-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg shadow-md" role="alert">
                                                        <span class="font-medium">提示:</span> 未找到 ID 为 "${activeTopicId}" 的单词分组。请从侧边栏选择一个有效的分组。
                                                      </div>`;
                }
            } else if (!activeTopicId && wordDisplayAreaElement && selectedGroupTitleElement) { // No active topic, show default on index.html
                selectedGroupTitleElement.textContent = '请选择一个单词分组';
                 wordDisplayAreaElement.innerHTML = `
                    <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-folder-open text-5xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500 text-lg">选择一个分组来查看单词内容。</p>
                    </div>`;
            }
        }
    }
    initializePage();
});