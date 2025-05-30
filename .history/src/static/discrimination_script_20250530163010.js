// File: static/discrimination_script.js
document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('toggle-review-btn');
    const errorMessageArea = document.getElementById('error-message-area');
    const currentTopicIdInput = document.getElementById('current-topic-id');
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    const sidebarSearchInput = document.getElementById('sidebar-search');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarCloseButton = document.getElementById('sidebar-close');
    const groupListElement = document.getElementById('group-list');

    let isReviewMode = false;
    let discriminationDataGlobal = null;
    let vocabularyDataGlobal = null;
    const currentTopicId = currentTopicIdInput ? currentTopicIdInput.value : null;

    // Sidebar toggle functionality
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('-translate-x-full');
            sidebar.classList.add('translate-x-0');
            sidebarToggle.classList.add('hidden');
        });
    }
    if (sidebarCloseButton && sidebar) {
        sidebarCloseButton.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.remove('translate-x-0');
            sidebar.classList.add('-translate-x-full');
            sidebarToggle.classList.remove('hidden');
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

    // Word display toggle functionality
    const showWordsToggle = document.getElementById('show-words-toggle');
    if (showWordsToggle) {
        showWordsToggle.addEventListener('change', function() {
            document.querySelector('#sidebar').classList.toggle('show-words', this.checked);
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

    if (!currentTopicId) {
        displayError('未指定单词分组ID。无法加载辨析内容。');
        if (topicTitleElement) topicTitleElement.textContent = '单词辨析 (错误)';
        return;
    }

    async function fetchDiscriminationData() {
        if (discriminationDataGlobal) return discriminationDataGlobal;
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
            console.error('加载或处理词汇数据失败:', error);
            displayError(`加载词汇数据失败: ${error.message}`, true);
            return null;
        }
    }

    function populateSidebar(loadedVocabularyData, activeTopicId = null) {
        if (!groupListElement) return;
        groupListElement.innerHTML = '';

        if (!loadedVocabularyData || !loadedVocabularyData.vocabulary_collection) {
            groupListElement.innerHTML = '<li class="p-3 text-sm text-red-500">词汇数据格式不正确或加载失败。</li>';
            return;
        }

        loadedVocabularyData.vocabulary_collection.forEach(collection => {
            const collectionLi = document.createElement('li');
            collectionLi.className = 'mb-1';

            const collectionTitleButton = document.createElement('button');
            collectionTitleButton.className = 'collapsible-title w-full text-left px-3 py-2.5 font-semibold text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors duration-150 flex justify-between items-center text-sm';
            collectionTitleButton.innerHTML = `
                <span>${collection.title}</span>
                <i class="fas fa-chevron-right transform transition-transform duration-200 text-gray-500 text-xs arrow-icon"></i>
            `;
            collectionLi.appendChild(collectionTitleButton);

            if (collection.sub_groups && collection.sub_groups.length > 0) {
                const subGroupUl = document.createElement('ul');
                subGroupUl.className = 'subgroup-list mt-1 ml-3 pl-3 border-l-2 border-gray-200 space-y-0.5 hidden';
                let isParentExpanded = false;

                collection.sub_groups.forEach(subGroup => {
                    const subGroupLi = document.createElement('li');
                    const subGroupLink = document.createElement('a');
                    subGroupLink.className = `block px-3 py-2 text-sm rounded-md transition-colors duration-150`;
                    const isSubGroupActive = String(subGroup.id) === activeTopicId;
                    
                    // Get word list for showing in sidebar
                    const words = subGroup.words ? 
                                  subGroup.words.map(w => w.word).join(', ') :
                                  '无单词';
                    
                    subGroupLink.innerHTML = `${subGroup.title} 
                        <span class="word-list">(${words})</span>`;
                    
                    if (isSubGroupActive) {
                        subGroupLink.classList.add('sidebar-link-active');
                        isParentExpanded = true;
                    } else {
                        subGroupLink.classList.add('text-gray-600', 'hover:bg-gray-100', 'hover:text-gray-800');
                    }

                    if (subGroup.words && subGroup.words.length > 0) {
                        subGroupLink.href = `/discrimination?topicId=${subGroup.id}`;
                        subGroupLink.classList.add('cursor-pointer');
                        subGroupLink.dataset.collectionId = String(collection.id);
                        subGroupLink.dataset.subGroupId = String(subGroup.id);

                        subGroupLink.addEventListener('click', (event) => {
                            window.location.href = `/discrimination?topicId=${subGroup.id}`;
                            if (window.innerWidth < 1024 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
                                sidebar.classList.remove('translate-x-0');
                                sidebar.classList.add('-translate-x-full');
                                sidebarToggle.classList.remove('hidden');
                            }
                        });
                    } else {
                        subGroupLink.classList.add('text-gray-400', 'cursor-not-allowed', 'opacity-75');
                    }
                    subGroupLi.appendChild(subGroupLink);
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
        });
    }

    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            const groupLinks = document.querySelectorAll('#group-list a');
            
            if (!searchTerm) {
                groupLinks.forEach(link => {
                    link.parentElement.classList.remove('hidden');
                });
                return;
            }
            
            groupLinks.forEach(link => {
                const fullText = link.textContent.toLowerCase();
                const title = link.querySelector('span:first-child')?.textContent.toLowerCase().trim() || '';
                const wordList = link.querySelector('.word-list')?.textContent.toLowerCase().trim() || '';
                
                if (title.includes(searchTerm) || wordList.includes(searchTerm)) {
                    link.parentElement.classList.remove('hidden');
                } else {
                    link.parentElement.classList.add('hidden');
                }
            });
        });
    }

    async function initializeDiscriminationContent() {
        const discriminationData = await fetchDiscriminationData();
        const vocabularyData = await fetchVocabularyData();
        
        if (vocabularyData) {
            populateSidebar(vocabularyData, currentTopicId);
        }

        if (!discriminationData) return;

        if (!discriminationData.vocabulary_collection) {
            displayError('辨析数据格式不正确。');
            return;
        }

        const discriminationGroupData = discriminationData.vocabulary_collection.find(item =>
            item && typeof item.topic === 'string' && item.topic.startsWith(currentTopicId)
        );

        if (discriminationGroupData) {
            if (topicTitleElement) topicTitleElement.innerHTML = `单词辨析: ${discriminationGroupData.topic}`;
            renderDiscriminationData(discriminationGroupData.words.words, contentAreaElement, BIANXI_KNOWN_KEYS);
            renderSummary(discriminationGroupData.words.discriminate, contentAreaElement);
            if (reviewButton) {
                reviewButton.classList.remove('hidden');
                reviewButton.classList.add('inline-flex');
            }
            initializeInteractiveElements();
        } else {
            displayError(`未找到ID为 "${currentTopicId}" 的单词分组的辨析信息。`, true);
            if (topicTitleElement) topicTitleElement.textContent = `单词辨析: ${currentTopicId} (未找到)`;
            contentAreaElement.innerHTML = `
                <div class="text-center py-12 px-6 bg-white rounded-xl shadow-lg">
                    <i class="fas fa-search-minus text-5xl text-yellow-500 mb-4"></i>
                    <p class="text-gray-500 text-lg">该分组暂无辨析内容。</p>
                </div>`;
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
                            if (line.startsWith(key + ":")) {
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
                } else {
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
    
            const htmlSummary = marked.parse(summaryText); 
    
            summaryDiv.innerHTML = `
                <h2 class="text-2xl md:text-3xl font-bold text-orange-600 mb-4">总结</h2>
                <div class="tongsu-miaoshu-container bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                    <div class="prose prose-indigo max-w-none">${htmlSummary}</div>
                </div>`;
            container.appendChild(summaryDiv);
    
            if (typeof reviewButton !== 'undefined' && reviewButton) {
                reviewButton.classList.remove('hidden');
                reviewButton.classList.add('inline-flex');
            }   
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
                    console.warn("Collapsible content not found for toggle:", toggle);
                }
            }

            const title = event.target.closest('.word-title.word-title-blurred');
            if (title && isReviewMode) {
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord;
            }
        });
    }
    initializeDiscriminationContent();
});
