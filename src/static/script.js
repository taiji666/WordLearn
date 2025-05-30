
document.addEventListener('DOMContentLoaded', () => {
    const groupListElement = document.getElementById('group-list');
    const selectedGroupTitleElement = document.getElementById('selected-group-title');
    const wordDisplayAreaElement = document.getElementById('word-display-area');
    const gotoDiscriminationBtn = document.getElementById('goto-discrimination-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseButton = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    const initialTopicIdElement = document.getElementById('initial-topic-id');
    const searchInput = document.getElementById('search-input');
    const sidebarSearchInput = document.getElementById('sidebar-search');
    const toggleShowWords = document.getElementById('toggle-show-words');
    const wordsShownCount = document.getElementById('words-shown-count');

    let currentSubGroupIdForDiscrimination = null;
    let vocabularyDataGlobal = null;
    let currentGroupData = null;
    let wordContainers = [];
    let totalWordItems = 0;

    // --- Sidebar Toggle Functionality ---
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            if (window.innerWidth < 1024) {
                sidebarToggle.classList.add('hidden');
            }
        });
    }
    if (sidebarCloseButton && sidebar) {
        sidebarCloseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            if (window.innerWidth < 1024) {
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

    // Sidebar search functionality
    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (!searchTerm) {
                initializePage(); // 重置时重新初始化页面
                return;
            }
            
            const searchResultsContainer = document.createElement('div');
            searchResultsContainer.id = 'search-results-container';
            searchResultsContainer.className = 'space-y-2';
            groupListElement.innerHTML = '';
            groupListElement.appendChild(searchResultsContainer);
            
            let anyMatchFound = false;
            let resultCount = 0;
            
            vocabularyDataGlobal.vocabulary_collection.forEach(collection => {
                if (!collection.sub_groups) return;
                
                collection.sub_groups.forEach(subGroup => {
                    const matches = [];
                    
                    const collectionTitle = collection.title.toLowerCase();
                    const subGroupTitle = subGroup.title.toLowerCase();
                    let groupMatched = false;
                    
                    if (collectionTitle.includes(searchTerm) || subGroupTitle.includes(searchTerm)) {
                        groupMatched = true;
                    }
                    
                    if (subGroup.words && subGroup.words.length > 0) {
                        subGroup.words.forEach(wordObj => {
                            const word = wordObj.word.toLowerCase();
                            if (word.includes(searchTerm)) {
                                matches.push({wordObj, subgroupId: subGroup.id, groupTitle: `${collection.title} > ${subGroup.title}`});
                                groupMatched = true; // A word match also means the group is relevant
                                resultCount++;
                            }
                        });
                    }
                    
                    if (groupMatched) {
                        anyMatchFound = true;
                        
                        const groupLink = document.createElement('a');
                        groupLink.className = 'block px-3 py-2 text-sm rounded-md bg-blue-50 text-blue-700 font-medium cursor-pointer hover:bg-blue-100';
                        groupLink.innerHTML = `<i class="fas fa-folder mr-2 w-4 text-center"></i> ${collection.title} / ${subGroup.title}`;
                        groupLink.addEventListener('click', () => {
                                // Instead of full page reload, simulate sidebar click
                            const matchingSidebarLink = Array.from(document.querySelectorAll('#group-list a.subgroup-title, #sidebar a.subgroup-title'))
                                                            .find(link => link.dataset.subGroupId === String(subGroup.id));
                            if (matchingSidebarLink) {
                                matchingSidebarLink.click();
                                sidebarSearchInput.value = ''; // Clear search
                                initializePage(); // Re-populate sidebar normally
                                // Ensure the clicked group is active
                                setTimeout(() => {
                                    const finalLink = Array.from(document.querySelectorAll('#group-list a.subgroup-title'))
                                                            .find(link => link.dataset.subGroupId === String(subGroup.id));
                                    if(finalLink) finalLink.click();
                                }, 50);

                            } else {
                                // Fallback if direct link not found after re-init (should not happen ideally)
                                window.location.href = `/?topicId=${subGroup.id}`;
                            }
                        });
                        searchResultsContainer.appendChild(groupLink);
                        
                        matches.forEach(match => {
                            const wordLink = document.createElement('a');
                            wordLink.className = 'block px-3 py-2 text-sm rounded-md ml-4 bg-green-50 text-green-700 hover:bg-green-100 flex items-center';
                            wordLink.innerHTML = `<i class="fas fa-search mr-3 text-xs w-4 text-center"></i> <span class="font-medium mr-2">${match.wordObj.word}</span> <i class="fas fa-chevron-right text-xs ml-auto"></i>`;
                            wordLink.addEventListener('click', (e) => {
                                e.stopPropagation();
                                // Simulate clicking this word in the (potentially re-initialized) sidebar
                                sidebarSearchInput.value = ''; // Clear search
                                initializePage(); // Re-populate sidebar
                                setTimeout(() => { // Wait for sidebar to re-populate
                                    handleWordClick(match.wordObj, match.subgroupId, e);
                                }, 100);
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
                infoDiv.innerHTML = `找到 ${resultCount} 个匹配的单词`;
                searchResultsContainer.appendChild(infoDiv);
            }
        });
    }

    if (toggleShowWords) {
        toggleShowWords.addEventListener('change', function() {
            const isChecked = this.checked;
            localStorage.setItem('showWordsInSidebar', isChecked ? 'true' : 'false');
            
            wordContainers.forEach(container => {
                container.classList.toggle('hidden', !isChecked);
            });
            
            wordsShownCount.textContent = isChecked ? totalWordItems : "0";
            
            document.querySelectorAll('.subgroup-arrow').forEach(arrow => {
                    // Only toggle if the parent sub-group list is visible
                const subGroupList = arrow.closest('.subgroup-item')?.querySelector('.word-list-container');
                if (subGroupList) { // Ensure subGroupList exists
                    arrow.classList.toggle('expanded', isChecked && !subGroupList.classList.contains('hidden'));
                }
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            filterWords(searchTerm);
        });
    }

    function filterWords(searchTerm) {
        if (!currentGroupData) {
            console.warn("No group selected, cannot filter words.");
            return;
        }
    
        const filteredWords = [];
        if (currentGroupData.words) {
            currentGroupData.words.forEach(wordObj => {
                const word = wordObj.word.toLowerCase();
                const translation = (wordObj.Entry?.senses?.[0]?.translation || '').toLowerCase();
                const definition = (wordObj.Entry?.senses?.[0]?.definition || '').toLowerCase();
                
                if (word.includes(searchTerm) || translation.includes(searchTerm) || definition.includes(searchTerm)) {
                    filteredWords.push(wordObj);
                }
            });
        }
    
        const filteredGroup = Object.assign({}, currentGroupData, { words: filteredWords });
        displayWords(filteredGroup, true);
    }

    async function loadJsonData() {
        if (vocabularyDataGlobal) return vocabularyDataGlobal;
        try {
            // In a real application, this path might be different or an API endpoint
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

    function handleGoToDiscrimination() {
        if (currentSubGroupIdForDiscrimination) {
            window.location.href = `/discrimination?topicId=${encodeURIComponent(currentSubGroupIdForDiscrimination)}`;
        } else if (currentGroupData && currentGroupData.id) {
            window.location.href = `/discrimination?topicId=${encodeURIComponent(currentGroupData.id)}`;
        } else {
            // Replace alert with a custom modal or message display in a real app
            console.warn('当前没有可用的单词分组 (for discrimination)');
        }
    }

    function displayWords(subGroup, isFiltered = false) {
        if (!selectedGroupTitleElement || !wordDisplayAreaElement || !gotoDiscriminationBtn) return;
        
        if (!isFiltered) {
            if (subGroup && subGroup.title) {
                selectedGroupTitleElement.textContent = subGroup.title;
                currentGroupData = subGroup; // Keep track of the currently displayed group data
            } else {
                wordDisplayAreaElement.innerHTML = `
                    <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-exclamation-triangle text-5xl text-yellow-500 mb-4"></i>
                        <p class="text-gray-500 text-lg">该分组不存在或无数据。</p>
                    </div>`;
                gotoDiscriminationBtn.classList.add('hidden');
                currentGroupData = null;
                return;
            }
        }
        
        wordDisplayAreaElement.innerHTML = ''; // Clear previous words
        currentSubGroupIdForDiscrimination = null;

        if (!subGroup.words || subGroup.words.length === 0) {
            wordDisplayAreaElement.innerHTML = `
                <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                    <i class="fas fa-box-open text-5xl text-gray-400 mb-4"></i>
                    <p class="text-gray-500 text-lg">${isFiltered ? '未找到匹配的单词' : '此分组没有单词'}</p>
                </div>`;
            gotoDiscriminationBtn.classList.add('hidden');
            gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination);
            return;
        }

        currentSubGroupIdForDiscrimination = String(subGroup.id);
        gotoDiscriminationBtn.classList.remove('hidden');
        gotoDiscriminationBtn.classList.add('inline-flex');
        gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination); // Remove previous before adding
        gotoDiscriminationBtn.addEventListener('click', handleGoToDiscrimination);

        const ul = document.createElement('ul');
        ul.className = 'space-y-6';

        subGroup.words.forEach(wordObj => {
            const li = document.createElement('li');
            li.className = 'bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out';
            // Add a data attribute to easily find this word card later
            li.dataset.word = wordObj.word.toLowerCase();


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

            if (wordHeaderContainer && englishWordSpan && revealPromptSpan) {
                wordHeaderContainer.addEventListener('click', () => {
                    englishWordSpan.classList.toggle('hidden');
                    revealPromptSpan.textContent = englishWordSpan.classList.contains('hidden') ? '(显示单词)' : '(隐藏单词)';
                });
            }
            
            ul.appendChild(li);
        });
        wordDisplayAreaElement.appendChild(ul);
    }

    function handleSubgroupClick(event, subGroup) {
        if (wordDisplayAreaElement && selectedGroupTitleElement) {
            displayWords(subGroup); // This will update currentGroupData
            if (window.history.pushState) { // Check for pushState support
                    window.history.pushState({ topicId: subGroup.id }, subGroup.title, `/?topicId=${subGroup.id}`);
            }

            document.querySelectorAll('#group-list a.subgroup-title').forEach(item => {
                item.classList.remove('sidebar-link-active');
                if (!item.classList.contains('sidebar-link-active')) { // Ensure not to re-add if already removed
                    item.classList.add('text-gray-600', 'hover:text-gray-800');
                }
            });
            event.currentTarget.classList.add('sidebar-link-active');
            event.currentTarget.classList.remove('hover:bg-gray-100', 'hover:text-gray-800', 'text-gray-600');
        }
        
        if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            if(sidebarToggle) sidebarToggle.classList.remove('hidden');
        }
    }

    // --- NEW/MODIFIED: Helper function to scroll to a word in the main content ---
    function scrollToWordInMainContent(wordText) {
        if (!wordDisplayAreaElement) return;

        const normalizedWordText = wordText.trim().toLowerCase();
        // Find the list item (word card) by the data-word attribute
        const targetElement = wordDisplayAreaElement.querySelector(`li[data-word="${normalizedWordText}"]`);

        if (targetElement) {
            // Ensure the word itself is visible (click the reveal prompt if needed)
            const englishWordSpan = targetElement.querySelector('.english-word');
            const revealPromptSpan = targetElement.querySelector('.reveal-word-prompt');
            if (englishWordSpan && englishWordSpan.classList.contains('hidden')) {
                if (revealPromptSpan) {
                    // Directly toggle classes instead of simulating click to avoid event conflicts
                    englishWordSpan.classList.remove('hidden');
                    revealPromptSpan.textContent = '(隐藏单词)';
                }
            }

            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Add a temporary highlight
            targetElement.classList.add('word-highlight');
            setTimeout(() => {
                targetElement.classList.remove('word-highlight');
            }, 2500); // Highlight for 2.5 seconds
        } else {
            console.warn(`Word card for "${wordText}" not found in main display area.`);
        }
    }
    
    // --- MODIFIED: handleWordClick function ---
    function handleWordClick(wordObj, subGroupId, event) {
        event.preventDefault();
        event.stopPropagation(); // Prevent event bubbling, e.g., to subgroup link click

        const targetSubGroupIdStr = String(subGroupId);

        // 1. Check if the target group is already displayed
        if (currentGroupData && String(currentGroupData.id) === targetSubGroupIdStr) {
            // Group is already displayed, just scroll to the word
            scrollToWordInMainContent(wordObj.word);
        } else {
            // Group is not displayed. Find and click the subgroup link in the sidebar.
            // This will trigger handleSubgroupClick, which calls displayWords.
            const allSubgroupLinks = document.querySelectorAll('#group-list a.subgroup-title');
            let targetSubgroupLink = null;
            allSubgroupLinks.forEach(link => {
                if (link.dataset.subGroupId === targetSubGroupIdStr) {
                    targetSubgroupLink = link;
                }
            });

            if (targetSubgroupLink) {
                // Programmatically click the subgroup link.
                // This will call handleSubgroupClick, which updates the main content and URL.
                targetSubgroupLink.click(); 

                // displayWords is called synchronously within targetSubgroupLink.click()'s event chain.
                // However, browser rendering might take a moment. A small delay can help.
                setTimeout(() => {
                    scrollToWordInMainContent(wordObj.word);
                }, 50); // Adjust if scrolling happens before content is fully ready.
                        // Consider requestAnimationFrame for smoother visual updates if needed.
            } else {
                console.error(`Subgroup link for ID ${targetSubGroupIdStr} not found in sidebar.`);
                // Potentially, load the group directly if link isn't found (e.g., after a search clear)
                const groupData = vocabularyDataGlobal.vocabulary_collection
                    .flatMap(c => c.sub_groups || [])
                    .find(sg => String(sg.id) === targetSubGroupIdStr);
                if (groupData) {
                    displayWords(groupData);
                        if (window.history.pushState) {
                        window.history.pushState({ topicId: groupData.id }, groupData.title, `/?topicId=${groupData.id}`);
                    }
                    setTimeout(() => scrollToWordInMainContent(wordObj.word), 50);
                }
            }
        }

        // Close sidebar on mobile after action
        if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            if (sidebarToggle) sidebarToggle.classList.remove('hidden');
        }
    }


    function populateSidebar(loadedVocabularyData, activeTopicId = null) {
        if (!groupListElement) {
            console.error("Error: Sidebar group list element (ul#group-list) is not found!");
            return;
        }
        groupListElement.innerHTML = ''; // Clear previous items
        wordContainers = []; 
        totalWordItems = 0;

        if (!loadedVocabularyData || !loadedVocabularyData.vocabulary_collection) {
            console.error("Error: vocabulary_collection is missing in loaded data for sidebar.");
            groupListElement.innerHTML = '<li class="p-3 text-sm text-red-500">词汇数据格式不正确或加载失败。</li>';
            return;
        }

        if (gotoDiscriminationBtn) { // Reset button state
            gotoDiscriminationBtn.classList.add('hidden');
            gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination);
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
                subGroupUl.className = 'subgroup-list mt-1 ml-3 pl-3 border-l-2 border-gray-200 space-y-1 hidden'; // Changed space-y-2 to space-y-1
                let isParentExpanded = false;

                collection.sub_groups.forEach(subGroup => {
                    const subGroupLi = document.createElement('li');
                    subGroupLi.className = 'subgroup-item'; // Removed mb-2 for tighter packing

                    const subGroupLink = document.createElement('a');
                    subGroupLink.href = `#group-${subGroup.id}`; // Meaningful href for accessibility
                    subGroupLink.className = `subgroup-title block px-3 py-1.5 text-sm rounded-md transition-colors duration-150 items-center justify-between cursor-pointer flex`; // Adjusted padding
                    subGroupLink.dataset.subGroupId = subGroup.id;
                    
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
                    // Hide arrow if no words, or controlled by global toggle
                    if (!subGroup.words || subGroup.words.length === 0) {
                        expandBtn.classList.add('opacity-0', 'pointer-events-none'); // Effectively hide if no words
                    }


                    subGroupLink.appendChild(contentSpan);
                    subGroupLink.appendChild(expandBtn);
                    
                    subGroupLink.addEventListener('click', (event) => {
                        event.preventDefault(); // Prevent default anchor behavior
                        if (expandBtn.contains(event.target) && subGroup.words && subGroup.words.length > 0) {
                            const wordListContainer = subGroupLi.querySelector('.word-list-container');
                            if (wordListContainer) {
                                const isCurrentlyHidden = wordListContainer.classList.toggle('hidden');
                                expandBtn.classList.toggle('expanded', !isCurrentlyHidden);
                                // Update global toggle state if user manually expands/collapses
                                if (toggleShowWords) {
                                    const allExpanded = !Array.from(wordContainers).some(c => c.classList.contains('hidden'));
                                    toggleShowWords.checked = allExpanded;
                                    wordsShownCount.textContent = toggleShowWords.checked ? totalWordItems : "0";
                                }
                            }
                        } else if (!expandBtn.contains(event.target)) { // Clicked on title area, not arrow
                            handleSubgroupClick(event, subGroup);
                        }
                    });

                    subGroupLi.appendChild(subGroupLink);

                    if (subGroup.words && subGroup.words.length > 0) {
                        totalWordItems += subGroup.words.length;
                        const wordListContainer = document.createElement('div');
                        wordListContainer.className = 'word-list-container ml-4 mt-1 mb-1 space-y-0.5 pl-2 border-l border-gray-200 hidden'; // Adjusted margins/padding
                        wordContainers.push(wordListContainer);

                        const wordList = document.createElement('div');
                        wordList.className = 'word-grid p-1'; 
                        
                        subGroup.words.forEach(wordObj => {
                            const wordItem = document.createElement('div');
                            // Using a button for better accessibility with click handlers
                            wordItem.setAttribute('role', 'button');
                            wordItem.setAttribute('tabindex', '0');
                            wordItem.className = 'word-card flex items-center justify-start cursor-pointer text-left'; // Ensure text is aligned left
                            
                            const wordTextSpan = document.createElement('span');
                            wordTextSpan.textContent = wordObj.word;
                            wordTextSpan.className = 'truncate'; // Ensure long words don't break layout

                            wordItem.appendChild(wordTextSpan);
                            // Removed icon from here, it was making cards too busy.
                            
                            wordItem.addEventListener('click', (e) => handleWordClick(wordObj, subGroup.id, e));
                            wordItem.addEventListener('keydown', (e) => { // For accessibility
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleWordClick(wordObj, subGroup.id, e);
                                }
                            });
                            wordList.appendChild(wordItem);
                        });

                        wordListContainer.appendChild(wordList);
                        subGroupLi.appendChild(wordListContainer);
                        // Initial state of arrow and list based on global toggle
                        const showWordsInitially = localStorage.getItem('showWordsInSidebar') !== 'false';
                        wordListContainer.classList.toggle('hidden', !showWordsInitially);
                        expandBtn.classList.toggle('expanded', showWordsInitially);

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
            const showWords = localStorage.getItem('showWordsInSidebar') !== 'false';
            toggleShowWords.checked = showWords;
            wordsShownCount.textContent = showWords ? totalWordItems : '0';

            wordContainers.forEach(container => {
                container.classList.toggle('hidden', !showWords);
            });
                document.querySelectorAll('.subgroup-arrow').forEach(arrow => {
                const wordListContainer = arrow.closest('.subgroup-item')?.querySelector('.word-list-container');
                if (wordListContainer && subGroup.words && subGroup.words.length > 0) { // Check if words exist for this arrow
                    arrow.classList.toggle('expanded', showWords && !wordListContainer.classList.contains('hidden'));
                } else if (!subGroup.words || subGroup.words.length === 0) {
                    arrow.classList.remove('expanded'); // Ensure no expansion if no words
                }
            });
        }
    }

    window.addEventListener('popstate', (event) => {
        if (wordDisplayAreaElement && selectedGroupTitleElement) {
            const newTopicId = event.state?.topicId || new URLSearchParams(window.location.search).get('topicId');
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
                    document.querySelectorAll('#group-list a.subgroup-title').forEach(item => {
                        item.classList.remove('sidebar-link-active');
                        item.classList.add('text-gray-600', 'hover:text-gray-800'); // Reset style
                        if (item.dataset.subGroupId === newTopicId) {
                            item.classList.add('sidebar-link-active');
                            item.classList.remove('hover:bg-gray-100', 'hover:text-gray-800', 'text-gray-600');
                        }
                    });
                }
            } else if (!newTopicId) { // Navigated to base URL without topicId
                selectedGroupTitleElement.textContent = '请选择一个单词分组';
                wordDisplayAreaElement.innerHTML = `
                    <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-folder-open text-5xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500 text-lg">选择一个分组来查看单词内容。</p>
                    </div>`;
                if(gotoDiscriminationBtn) gotoDiscriminationBtn.classList.add('hidden');
                document.querySelectorAll('#group-list a.subgroup-title').forEach(item => item.classList.remove('sidebar-link-active'));
                currentGroupData = null; 
            }
        }
    });

    async function initializePage() {
        const data = await loadJsonData();
        if (data) {
            let activeTopicId = null;
            const urlParams = new URLSearchParams(window.location.search);

            if (initialTopicIdElement && initialTopicIdElement.value) {
                activeTopicId = initialTopicIdElement.value;
            } else {
                activeTopicId = urlParams.get('topicId');
            }

            populateSidebar(data, activeTopicId); // This will also set up wordContainers and totalWordItems

            if (activeTopicId && wordDisplayAreaElement && selectedGroupTitleElement) {
                let foundSubGroup = null;
                for (const collection of data.vocabulary_collection) {
                    if (collection.sub_groups) {
                        foundSubGroup = collection.sub_groups.find(sg => String(sg.id) === activeTopicId);
                        if (foundSubGroup) break;
                    }
                }
                if (foundSubGroup) {
                    displayWords(foundSubGroup); // This sets currentGroupData
                    // Ensure URL is correctly set if initialTopicIdElement was used
                    if (!urlParams.has('topicId') || urlParams.get('topicId') !== activeTopicId) {
                        if (window.history.replaceState) { // Check for replaceState support
                            window.history.replaceState({ topicId: activeTopicId }, foundSubGroup.title, `/?topicId=${activeTopicId}`);
                        }
                    }
                } else {
                    selectedGroupTitleElement.textContent = "未找到分组";
                    wordDisplayAreaElement.innerHTML = `<div class="p-4 text-sm text-yellow-700 bg-yellow-100 rounded-lg shadow-md" role="alert">
                                                            <span class="font-medium">提示:</span> 未找到 ID 为 "${activeTopicId}" 的单词分组。
                                                        </div>`;
                    currentGroupData = null;
                }
            } else if (!activeTopicId && wordDisplayAreaElement && selectedGroupTitleElement) {
                    selectedGroupTitleElement.textContent = '请选择一个单词分组';
                    wordDisplayAreaElement.innerHTML = `
                    <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                        <i class="fas fa-folder-open text-5xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500 text-lg">选择一个分组来查看单词内容。</p>
                    </div>`;
                currentGroupData = null;
            }
        }
    }
    initializePage();
});
