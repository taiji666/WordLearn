// File: static/discrimination_script.js
document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('toggle-review-btn');
    const errorMessageArea = document.getElementById('error-message-area');
    const currentTopicIdInput = document.getElementById('current-topic-id');
    const backToHomeBtn = document.getElementById('back-to-home-btn');

    let isReviewMode = false;
    let discriminationDataGlobal = null;
    const currentTopicId = currentTopicIdInput ? currentTopicIdInput.value : null;

    // Update back to home button link
    if (backToHomeBtn && currentTopicId) {
        backToHomeBtn.href = `/?topicId=${encodeURIComponent(currentTopicId)}`;
    } else if (backToHomeBtn) {
        backToHomeBtn.href = '/'; // Fallback if no topicId
    }


    const BIANXI_KNOWN_KEYS = [
        "感情色彩", "词义的细微差别", "使用语境/场合", "语法功能和用法",
        "搭配关系", "词语的强度", "正式程度/语体风格", "具体含义vs.抽象含义",
        "具体指代或强调的侧重点"
    ];

    const generalItemTagClasses = 'item-tag inline-block bg-gray-200 text-gray-700 px-2.5 py-1 text-xs sm:text-sm rounded-md font-mono mx-0.5 my-1 shadow-sm hover:bg-gray-300 transition-colors';
    const semanticItemTagClasses = 'semantic-item-tag inline-block bg-indigo-100 text-indigo-700 px-3 py-1.5 text-xs sm:text-sm rounded-md font-sans mx-0.5 my-1 shadow-sm hover:bg-indigo-200 transition-colors';

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

    async function initializeDiscriminationContent() {
        const data = await fetchDiscriminationData();
        if (!data) return;

        if (!data.vocabulary_collection) {
            displayError('辨析数据格式不正确。');
            return;
        }

        const discriminationData = data.vocabulary_collection.find(item =>
            item && typeof item.topic === 'string' && item.topic.startsWith(currentTopicId)
        );

        if (discriminationData) {
            if (topicTitleElement) topicTitleElement.textContent = `单词辨析: ${discriminationData.topic}`;
            renderDiscriminationData(discriminationData.words.words, contentAreaElement, BIANXI_KNOWN_KEYS);
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
            document.body.classList.toggle('in-review-mode', isReviewMode); // Add class to body for global styling
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

            // Section: 通俗描述
            htmlContent += `<div class="section-vernacular-description word-details-section review-collapsible-section py-2">
                                <div class="tongsu-miaoshu-container bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                                    <h4 class="text-xs font-semibold text-blue-600 mb-1.5 uppercase tracking-wider">通俗描述</h4>
                                    <p class="text-gray-700 text-sm md:text-base leading-relaxed">${wordData['通俗描述'] || '无'}</p>
                                </div>
                            </div>`;
            
            // Section: 语义分析 (Conditionally Collapsible)
            if (wordData['语义分析']) {
                 let yuyiFenxiContent = `<p><strong class="text-indigo-600 font-medium">核心意义:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">语境延展:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['语境延展'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">核心意义的体现:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义的体现'] || '无'}</span></p>`;
                htmlContent += buildSectionHtml('语义分析', yuyiFenxiContent, true, 'section-semantic-analysis');
            }


            // Other sections that will be hidden in review mode
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
    
    // Helper to build sections, now takes an additional class for the wrapper
    function buildSectionHtml(title, content, isCollapsible = false, wrapperClass = '') {
        if (!content || (typeof content === 'string' && content.trim() === '')) return '';

        let titleClasses = "text-lg md:text-xl font-semibold text-gray-700 mb-2";
        // The content div itself will get the specific styling for semantic analysis, etc.
        let contentBlockClasses = "text-gray-700 text-sm md:text-base leading-relaxed"; 
        let sectionWrapperClasses = `word-details-section review-collapsible-section py-2 ${wrapperClass}`; // Add the passed wrapperClass
        let contentWrapperClasses = "mt-2 space-y-2"; // This is for the div that gets hidden/shown
        let iconHtml = '<i class="fas fa-chevron-right arrow-icon text-xs text-gray-400 mr-2"></i>';

        if (isCollapsible) {
            titleClasses += " collapsible-toggle cursor-pointer hover:text-blue-700 transition-colors flex items-center";
            contentWrapperClasses += " hidden pl-5 border-l-2 border-gray-200";
        } else {
            iconHtml = ''; 
        }
        
        // Apply specific styling to the content block if it's semantic analysis
        if (wrapperClass === 'section-semantic-analysis') {
             contentBlockClasses += " bg-indigo-50 p-4 rounded-md";
        }


        let sectionHtml = `<div class="${sectionWrapperClasses}">`;
        sectionHtml += `<h4 class="${titleClasses}">${iconHtml}${title}</h4>`;
        sectionHtml += `<div class="${contentWrapperClasses}">`; // This is the collapsible part
        sectionHtml += `<div class="${contentBlockClasses}">${content}</div>`; // This is the actual content block
        sectionHtml += `</div>`;
        sectionHtml += `</div>`;
        return sectionHtml;
    }


    function toggleReviewModeUI(inReviewMode, contentArea) {
        const wordTitles = contentArea.querySelectorAll('.word-title');
        const allSections = contentArea.querySelectorAll('.word-details-section'); // General class for all sections
        const vernacularSections = contentArea.querySelectorAll('.section-vernacular-description');
        const semanticSections = contentArea.querySelectorAll('.section-semantic-analysis');

        wordTitles.forEach(title => {
            title.classList.toggle('word-title-blurred', inReviewMode);
            if (!inReviewMode) {
                title.textContent = title.dataset.originalWord;
            }
        });

        allSections.forEach(section => {
            const isVernacular = section.classList.contains('section-vernacular-description');
            const isSemantic = section.classList.contains('section-semantic-analysis');
            const contentWrapper = section.querySelector('.mt-2.space-y-2'); // The collapsible div
            const toggleButton = section.querySelector('.collapsible-toggle');

            if (inReviewMode) {
                if (isVernacular || isSemantic) {
                    section.classList.remove('hidden'); // Ensure these sections are visible
                    if (isVernacular) {
                        section.querySelector('.tongsu-miaoshu-container').classList.add('review-mode-vernacular-увеличенный-текст');
                    }
                    // For semantic analysis, if it's collapsible, keep its toggle functional
                    // but it should be visible by default in review mode.
                    // We might want to auto-expand them in review mode or let user expand.
                    // For now, let's ensure they are visible, and if collapsible, user can interact.
                    if (contentWrapper && contentWrapper.classList.contains('hidden')) {
                        // Optionally auto-expand these in review mode
                        // contentWrapper.classList.remove('hidden');
                        // if (toggleButton) toggleButton.classList.add('open');
                        // if (toggleButton) toggleButton.querySelector('.arrow-icon')?.classList.replace('fa-chevron-right', 'fa-chevron-down');
                    }

                } else {
                    section.classList.add('hidden'); // Hide other sections
                }
            } else { // Exiting review mode
                section.classList.remove('hidden'); // Make all sections visible again
                if (isVernacular) {
                     section.querySelector('.tongsu-miaoshu-container').classList.remove('review-mode-vernacular-увеличенный-текст');
                }
                // Restore default collapsible state (hidden) for sections that are collapsible
                if (toggleButton && contentWrapper && !contentWrapper.classList.contains('hidden')) {
                     // If you want them to re-collapse when exiting review, uncomment below
                    // contentWrapper.classList.add('hidden');
                    // toggleButton.classList.remove('open');
                    // toggleButton.querySelector('.arrow-icon')?.classList.replace('fa-chevron-down', 'fa-chevron-right');
                }
            }
        });
    }


    function initializeInteractiveElements() {
        if (!contentAreaElement) return;
        contentAreaElement.addEventListener('click', function(event) {
            const toggle = event.target.closest('.collapsible-toggle');
            if (toggle) {
                // Find the content wrapper, which is the next sibling of the h4's parent div if structured that way,
                // or the direct next sibling if h4 is the direct parent of the collapsible content.
                // Current structure: div.word-details-section > h4.collapsible-toggle + div.content-wrapper
                const contentWrapper = toggle.nextElementSibling;
                
                if (contentWrapper && contentWrapper.classList.contains('mt-2')) { // Check for the collapsible content div
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
