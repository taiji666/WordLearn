// File: static/script.js

document.addEventListener('DOMContentLoaded', () => {
    const groupListElement = document.getElementById('group-list');
    // For discrimination page, the ID is different
    const groupListDiscriminationElement = document.getElementById('group-list-discrimination');
    const selectedGroupTitleElement = document.getElementById('selected-group-title');
    const wordDisplayAreaElement = document.getElementById('word-display-area');
    const gotoDiscriminationBtn = document.getElementById('goto-discrimination-btn');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseButton = document.getElementById('sidebar-close');
    const sidebar = document.getElementById('sidebar');
    const initialTopicIdElement = document.getElementById('initial-topic-id');
    const currentTopicIdDiscriminationPage = document.getElementById('current-topic-id'); // For discrimination page

    let currentSubGroupIdForDiscrimination = null;
    let vocabularyDataGlobal = null; // Store loaded data globally

    // --- Sidebar Toggle Functionality ---
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
        });
    }
    if (sidebarCloseButton && sidebar) {
        sidebarCloseButton.addEventListener('click', () => {
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
        });
    }
     // Close sidebar when clicking outside on mobile/tablet
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
        if (vocabularyDataGlobal) {
            return vocabularyDataGlobal; // Return cached data if available
        }
        try {
            const response = await fetch('/data/vocabulary_data.json'); // Adjusted path
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            vocabularyDataGlobal = await response.json();
            return vocabularyDataGlobal;
        } catch (error) {
            console.error('无法加载 JSON 数据:', error);
            if (wordDisplayAreaElement) {
                wordDisplayAreaElement.innerHTML = '<p class="text-red-500 bg-red-100 p-4 rounded-lg shadow">加载数据失败，请检查文件路径或网络连接。</p>';
            }
            if (groupListElement) groupListElement.innerHTML = '<li class="text-red-500">数据加载失败</li>';
            if (groupListDiscriminationElement) groupListDiscriminationElement.innerHTML = '<li class="text-red-500">数据加载失败</li>';
            return null; // Ensure null is returned on error
        }
    }

    // --- Button Click Handler ---
    function handleGoToDiscrimination() {
        if (currentSubGroupIdForDiscrimination) {
            window.location.href = `/discrimination?topicId=${encodeURIComponent(currentSubGroupIdForDiscrimination)}`;
        }
    }

    // --- Display Words in Main Content (for index.html) ---
    function displayWords(subGroup) {
        if (!selectedGroupTitleElement || !wordDisplayAreaElement || !gotoDiscriminationBtn) {
            // This function is primarily for index.html, so skip if elements aren't there
            return;
        }

        selectedGroupTitleElement.textContent = subGroup.title;
        wordDisplayAreaElement.innerHTML = ''; // Clear previous words
        currentSubGroupIdForDiscrimination = null;

        if (!subGroup.words || subGroup.words.length === 0) {
            wordDisplayAreaElement.innerHTML = '<p class="text-gray-500 text-center py-10 bg-white rounded-lg shadow">此分组没有单词。</p>';
            gotoDiscriminationBtn.style.display = 'none';
            gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination);
            return;
        }

        currentSubGroupIdForDiscrimination = String(subGroup.id);
        gotoDiscriminationBtn.style.display = 'inline-flex'; // Use inline-flex for items-center
        gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination);
        gotoDiscriminationBtn.addEventListener('click', handleGoToDiscrimination);

        const ul = document.createElement('ul');
        ul.className = 'space-y-6'; // Tailwind classes for spacing between word items

        subGroup.words.forEach(wordObj => {
            const li = document.createElement('li');
            // Tailwind classes for word item card
            li.className = 'bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300';

            let sensesHTML = '';
            if (wordObj.Entry && wordObj.Entry.senses && wordObj.Entry.senses.length > 0) {
                sensesHTML = '<ul class="mt-3 space-y-2 list-decimal list-inside text-gray-700">';
                wordObj.Entry.senses.forEach(sense => {
                    sensesHTML += `<li class="ml-4"><strong class="text-blue-600">${sense.translation}</strong>: <span class="text-gray-600">${sense.definition}</span></li>`;
                });
                sensesHTML += '</ul>';
            } else {
                sensesHTML = '<p class="mt-3 text-sm text-gray-500"><em>暂无详细释义。</em></p>';
            }

            li.innerHTML = `
                <div class="word-header-container flex justify-between items-center cursor-pointer mb-2">
                    <span class="english-word text-2xl font-semibold text-gray-800 hidden">${wordObj.word}</span>
                    <span class="reveal-word-prompt text-sm text-blue-500 hover:text-blue-700 font-medium py-1 px-3 border border-blue-500 rounded-full transition-colors">(Show Word)</span>
                </div>
                <p class="part-of-speech text-sm text-indigo-600 bg-indigo-100 px-2 py-1 rounded-md inline-block mb-3"><em>${wordObj.Entry ? wordObj.Entry.part_of_speech : '词性未知'}</em></p>
                ${sensesHTML}
            `;

            const wordHeaderContainer = li.querySelector('.word-header-container');
            const englishWordSpan = li.querySelector('.english-word');
            const revealPromptSpan = li.querySelector('.reveal-word-prompt');

            wordHeaderContainer.addEventListener('click', () => {
                englishWordSpan.classList.toggle('hidden');
                revealPromptSpan.textContent = englishWordSpan.classList.contains('hidden') ? '(Show Word)' : '(Hide Word)';
            });
            ul.appendChild(li);
        });
        wordDisplayAreaElement.appendChild(ul);
    }

    // --- Populate Sidebar ---
    // This function will be used by both index.html and discrimination_page.html
    function populateSidebar(loadedVocabularyData, activeTopicId = null) {
        const targetGroupListElement = groupListElement || groupListDiscriminationElement;

        if (!targetGroupListElement) {
            console.error("Error: Sidebar group list element is not found!");
            return;
        }
        targetGroupListElement.innerHTML = ''; // Clear current items

        if (!loadedVocabularyData || !loadedVocabularyData.vocabulary_collection) {
            console.error("Error: vocabulary_collection is missing in loaded data for sidebar.");
            targetGroupListElement.innerHTML = '<li class="text-red-500 p-2">词汇数据格式不正确或加载失败。</li>';
            return;
        }

        // Hide discrimination button initially if on index.html
        if (gotoDiscriminationBtn) {
            gotoDiscriminationBtn.style.display = 'none';
            gotoDiscriminationBtn.removeEventListener('click', handleGoToDiscrimination);
        }

        loadedVocabularyData.vocabulary_collection.forEach(collection => {
            const collectionLi = document.createElement('li');
            collectionLi.className = 'mb-3'; // Spacing for collection items

            const collectionTitleButton = document.createElement('button');
            collectionTitleButton.className = 'collapsible-title w-full text-left px-3 py-2 font-semibold text-gray-700 hover:bg-gray-200 rounded-md focus:outline-none transition-colors duration-150 flex justify-between items-center';
            collectionTitleButton.innerHTML = `
                <span>${collection.title} <span class="text-xs text-gray-500">(ID: ${collection.id})</span></span>
                <i class="fas fa-chevron-down transform transition-transform duration-200"></i>
            `;
            collectionLi.appendChild(collectionTitleButton);

            if (collection.sub_groups && collection.sub_groups.length > 0) {
                const subGroupUl = document.createElement('ul');
                subGroupUl.className = 'subgroup-list mt-1 ml-4 pl-3 border-l-2 border-gray-200 space-y-1 hidden'; // Hidden by default

                let isExpanded = false;

                collection.sub_groups.forEach(subGroup => {
                    const subGroupLi = document.createElement('li');
                    const subGroupLink = document.createElement('a'); // Changed to <a> for navigation
                    subGroupLink.className = `block px-3 py-2 text-sm rounded-md transition-colors duration-150`;

                    // Determine if this subgroup is the active one
                    const isSubGroupActive = String(subGroup.id) === activeTopicId;
                     if (isSubGroupActive) {
                        isExpanded = true; // Expand parent if child is active
                    }


                    if (subGroup.words && subGroup.words.length > 0) {
                        subGroupLink.href = `#topic-${subGroup.id}`; // For SPA-like behavior or direct navigation
                        subGroupLink.classList.add('text-gray-600', 'hover:bg-blue-100', 'hover:text-blue-700', 'cursor-pointer');
                        if (isSubGroupActive) {
                            subGroupLink.classList.add('bg-blue-100', 'text-blue-700', 'font-medium');
                        }

                        subGroupLink.textContent = `${subGroup.title} (ID: ${subGroup.id})`;
                        subGroupLink.dataset.collectionId = String(collection.id);
                        subGroupLink.dataset.subGroupId = String(subGroup.id);

                        subGroupLink.addEventListener('click', (event) => {
                            event.preventDefault(); // Prevent default anchor behavior
                            const clickedSubGroupId = subGroupLink.dataset.subGroupId;

                            // If on index.html, display words
                            if (wordDisplayAreaElement && selectedGroupTitleElement) {
                                const parentCollection = loadedVocabularyData.vocabulary_collection.find(c => String(c.id) === subGroupLink.dataset.collectionId);
                                if (parentCollection) {
                                    const selectedSubGroup = parentCollection.sub_groups.find(sg => String(sg.id) === clickedSubGroupId);
                                    if (selectedSubGroup) {
                                        displayWords(selectedSubGroup);

                                        // Update URL hash for better navigation/state (optional)
                                        window.location.hash = `topic-${clickedSubGroupId}`;

                                        // Update active state in sidebar
                                        document.querySelectorAll('#sidebar .subgroup-list a').forEach(item => {
                                            item.classList.remove('bg-blue-100', 'text-blue-700', 'font-medium');
                                        });
                                        subGroupLink.classList.add('bg-blue-100', 'text-blue-700', 'font-medium');

                                        // Close sidebar on mobile after selection
                                        if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                                            sidebar.classList.remove('translate-x-0');
                                            sidebar.classList.add('-translate-x-full');
                                        }
                                    }
                                }
                            } else if (currentTopicIdDiscriminationPage) {
                                // If on discrimination_page.html, navigate to the new topicId
                                window.location.href = `/discrimination?topicId=${encodeURIComponent(clickedSubGroupId)}`;
                            }
                        });
                    } else {
                        subGroupLink.textContent = `${subGroup.title} (ID: ${subGroup.id})`;
                        subGroupLink.classList.add('text-gray-400', 'cursor-not-allowed');
                    }
                    subGroupLi.appendChild(subGroupLink);
                    subGroupUl.appendChild(subGroupLi);
                });
                collectionLi.appendChild(subGroupUl);

                if (isExpanded) {
                    subGroupUl.classList.remove('hidden');
                    collectionTitleButton.querySelector('i').classList.add('rotate-180');
                }


                collectionTitleButton.addEventListener('click', () => {
                    subGroupUl.classList.toggle('hidden');
                    collectionTitleButton.querySelector('i').classList.toggle('rotate-180');
                });
            } else {
                 collectionTitleButton.querySelector('i').style.display = 'none'; // Hide arrow if no subgroups
            }
            targetGroupListElement.appendChild(collectionLi);
        });
    }

    // --- Initialization ---
    async function initializePage() {
        const data = await loadJsonData();
        if (data) {
            console.log('JSON Data successfully loaded:', data);
            let activeTopicId = null;

            // Determine activeTopicId based on the page
            if (initialTopicIdElement && initialTopicIdElement.value) { // For index.html
                activeTopicId = initialTopicIdElement.value;
            } else if (currentTopicIdDiscriminationPage && currentTopicIdDiscriminationPage.value) { // For discrimination_page.html
                activeTopicId = currentTopicIdDiscriminationPage.value;
            }

            populateSidebar(data, activeTopicId);

            // If on index.html and an initialTopicId is provided, display its words
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
                } else {
                    if (wordDisplayAreaElement) wordDisplayAreaElement.innerHTML = `<p class="text-red-500 bg-red-100 p-4 rounded-lg shadow">未找到 ID 为 "${activeTopicId}" 的单词分组。</p>`;
                    if (selectedGroupTitleElement) selectedGroupTitleElement.textContent = "未找到分组";
                }
            } else if (!activeTopicId && wordDisplayAreaElement) {
                // Default message if no topicId is selected on index.html
                wordDisplayAreaElement.innerHTML = '<p class="text-gray-500 text-center py-10 bg-white rounded-lg shadow">选择一个分组来查看单词。</p>';
                if (selectedGroupTitleElement) selectedGroupTitleElement.textContent = '请选择一个单词分组';
            }

        } else {
            console.log('Data was not loaded, sidebar will not be populated.');
            const targetGroupList = groupListElement || groupListDiscriminationElement;
            if (targetGroupList) {
                targetGroupList.innerHTML = '<li class="text-red-500 p-2">数据未能加载。</li>';
            }
        }
    }

    initializePage(); // Call initialization
});
