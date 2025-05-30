// File: static/discrimination_script.js
document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('toggle-review-btn');
    const errorMessageArea = document.getElementById('error-message-area');
    const currentTopicIdInput = document.getElementById('current-topic-id'); // Get topicId from hidden input

    let isReviewMode = false;
    let discriminationDataGlobal = null; // Cache for discrimination data

    const BIANXI_KNOWN_KEYS = [
        "感情色彩", "词义的细微差别", "使用语境/场合", "语法功能和用法",
        "搭配关系", "词语的强度", "正式程度/语体风格", "具体含义vs.抽象含义",
        "具体指代或强调的侧重点"
    ];

    // --- Tailwind classes for item tags (can be customized further) ---
    const generalItemTagClasses = 'item-tag inline-block bg-gray-200 text-gray-700 px-2 py-1 text-xs sm:text-sm rounded-md font-mono mx-0.5 my-0.5 shadow-sm';
    const semanticItemTagClasses = 'semantic-item-tag inline-block bg-indigo-100 text-indigo-700 px-3 py-1 text-xs sm:text-sm rounded-md font-sans mx-0.5 my-0.5 shadow-sm';

    const topicId = currentTopicIdInput ? currentTopicIdInput.value : null;

    function displayError(message) {
        errorMessageArea.innerHTML = `<div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
                                        <strong class="font-bold block sm:inline">错误!</strong>
                                        <span class="block sm:inline ml-1">${message}</span>
                                     </div>`;
        contentAreaElement.innerHTML = ''; // Clear loading message
    }

    if (!topicId) {
        displayError('未指定单词分组ID。无法加载辨析内容。');
        if (topicTitleElement) topicTitleElement.textContent = '单词辨析 (错误)';
        // Sidebar should still load via script.js if it's included and finds its elements
        return;
    }

    async function fetchDiscriminationData() {
        if (discriminationDataGlobal) return discriminationDataGlobal; // Return cached data
        try {
            const response = await fetch('/data/vocabulary_discrimination_data.json'); // Adjusted path
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
            item && typeof item.topic === 'string' && item.topic.startsWith(topicId)
        );

        if (discriminationData) {
            if (topicTitleElement) topicTitleElement.textContent = `单词辨析: ${discriminationData.topic}`;
            renderDiscriminationData(discriminationData.words.words, contentAreaElement, BIANXI_KNOWN_KEYS);
            if (reviewButton) reviewButton.style.display = 'inline-flex'; // Show button
            initializeInteractiveElements();
        } else {
            displayError(`未找到ID为 "${topicId}" 的单词分组的辨析信息。`);
            if (topicTitleElement) topicTitleElement.textContent = `单词辨析: ${topicId} (未找到)`;
            contentAreaElement.innerHTML = `<p class="text-gray-500 text-center py-10">该分组暂无辨析内容。</p>`;
        }
    }


    if (reviewButton) {
        reviewButton.addEventListener('click', () => {
            isReviewMode = !isReviewMode;
            toggleReviewModeUI(isReviewMode, contentAreaElement);
            reviewButton.innerHTML = isReviewMode ?
                '<i class="fas fa-eye mr-2"></i> 退出背诵模式' :
                '<i class="fas fa-book-open mr-2"></i> 进入背诵模式';

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
        container.innerHTML = ''; // Clear previous content or loading message

        if (!wordsArray || wordsArray.length === 0) {
            container.innerHTML = '<p class="text-gray-600 text-center py-10">此主题下暂无单词辨析信息。</p>';
            return;
        }

        wordsArray.forEach(wordData => {
            const wordDiv = document.createElement('div');
            wordDiv.className = 'discrimination-word bg-white border border-gray-200 p-5 md:p-6 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 space-y-4';

            let htmlContent = `<h2 class="word-title text-2xl md:text-3xl font-semibold text-orange-600 mb-3 transition-all duration-300 ease-in-out" data-original-word="${wordData.word}">${wordData.word}</h2>`;

            // 通俗描述
            htmlContent += `<div class="tongsu-miaoshu-container bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 shadow-sm">
                                <h3 class="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wider">通俗描述</h3>
                                <p class="text-gray-700 text-sm md:text-base">${wordData['通俗描述'] || '无'}</p>
                            </div>`;

            function buildSectionHtml(title, content, isCollapsible = false, sectionType = '') {
                if (!content || (typeof content === 'string' && content.trim() === '')) return '';

                let titleClasses = "text-lg md:text-xl font-semibold text-gray-700 mb-2";
                let contentClasses = "text-gray-700 text-sm md:text-base"; // Base classes for content
                let sectionWrapperClasses = "word-details-section py-2";
                let contentWrapperClasses = ""; // Will hold specific styling for content block

                if (isCollapsible) {
                    titleClasses += " collapsible-toggle cursor-pointer hover:text-blue-600 transition-colors flex items-center"; // Added flex for icon alignment
                    contentWrapperClasses = "discrimination-content-collapsible hidden mt-2 space-y-2 pl-4 border-l-2 border-gray-200"; // Hidden by default, Tailwind for collapsible content
                    sectionWrapperClasses += " review-collapsible-section";
                }

                if (sectionType === 'semantic-analysis') {
                    // Specific styling for semantic analysis content block
                    contentWrapperClasses += " bg-indigo-50 p-3 md:p-4 rounded-md text-gray-800 leading-relaxed";
                } else if (sectionType === 'definitions') {
                     contentWrapperClasses += " list-disc list-inside";
                }


                let sectionHtml = `<div class="${sectionWrapperClasses}">`;
                sectionHtml += `<h3 class="${titleClasses}">${title}</h3>`; // Icon will be added by ::before
                sectionHtml += `<div class="${contentWrapperClasses}">${content}</div>`;
                sectionHtml += `</div>`;
                return sectionHtml;
            }

            // 主要释义
            htmlContent += buildSectionHtml('主要释义', `<p>${wordData['主要释义'] || '无'}</p>`, true, 'definitions');

            // 全面释义
            if (wordData['全面释义'] && wordData['全面释义'].length > 0) {
                let quanmianShiyiList = '<ul class="list-disc pl-5 space-y-1">';
                wordData['全面释义'].forEach(s => { quanmianShiyiList += `<li>${s}</li>`; });
                quanmianShiyiList += `</ul>`;
                htmlContent += buildSectionHtml('全面释义', quanmianShiyiList, true, 'definitions');
            }

            // 语义分析
            if (wordData['语义分析']) {
                let yuyiFenxiContent = `<p><strong class="text-indigo-600 font-medium">核心意义:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">语境延展:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['语境延展'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">核心意义的体现:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义的体现'] || '无'}</span></p>`;
                htmlContent += buildSectionHtml('语义分析', yuyiFenxiContent, true, 'semantic-analysis');
            }

            // 辨析
            let bianxiDisplayContent = '';
            if (wordData['辨析']) {
                if (typeof wordData['辨析'] === 'string') {
                    const discriminationText = wordData['辨析'];
                    let detailsHtml = '<div class="space-y-1">';
                    let foundAnyDetail = false;
                    // Simplified parsing: split by known keys if they act as delimiters
                    // This part might need refinement based on the exact structure of '辨析' string
                    let remainingText = discriminationText;
                    for (let i = 0; i < knownKeys.length; i++) {
                        const currentKey = knownKeys[i];
                        const searchPattern = currentKey + ":";
                        const currentKeyPatternIndex = remainingText.indexOf(searchPattern);

                        if (currentKeyPatternIndex !== -1) {
                            const valueStartIndex = currentKeyPatternIndex + searchPattern.length;
                            let valueEndIndex = remainingText.length;

                            // Find the start of the next known key to delimit the current value
                            for (let j = 0; j < knownKeys.length; j++) {
                                if (i === j) continue; // Skip the current key itself
                                const nextKeyPattern = knownKeys[j] + ":";
                                const nextKeyIndex = remainingText.indexOf(nextKeyPattern, valueStartIndex);
                                if (nextKeyIndex !== -1 && nextKeyIndex < valueEndIndex) {
                                    valueEndIndex = nextKeyIndex;
                                }
                            }
                            const value = remainingText.substring(valueStartIndex, valueEndIndex).trim();
                            if (value) {
                                detailsHtml += `<p><strong class="text-blue-600 font-medium">${currentKey}:</strong> <span class="${generalItemTagClasses}">${value}</span></p>`;
                                foundAnyDetail = true;
                            }
                             // This logic for slicing remainingText might be too simple if keys are not ordered or nested.
                            // remainingText = remainingText.substring(valueEndIndex); // This might incorrectly cut text.
                        }
                    }
                     // If no specific keys were found but there's text, show it.
                    if (!foundAnyDetail && discriminationText.trim().length > 0) {
                         detailsHtml += `<p class="${generalItemTagClasses}">${discriminationText.trim()}</p>`;
                         foundAnyDetail = true;
                    }

                    detailsHtml += `</div>`;
                    if (foundAnyDetail) {
                        bianxiDisplayContent = detailsHtml;
                    }
                } else {
                    bianxiDisplayContent = `<p class="${generalItemTagClasses}">${String(wordData['辨析'])}</p>`;
                }
            }
            if (bianxiDisplayContent) {
                htmlContent += buildSectionHtml('辨析点', bianxiDisplayContent, true);
            }

            wordDiv.innerHTML = htmlContent;
            container.appendChild(wordDiv);
        });
    }

    function toggleReviewModeUI(inReviewMode, contentArea) {
        const wordTitles = contentArea.querySelectorAll('.word-title');
        const collapsibleSections = contentArea.querySelectorAll('.review-collapsible-section');

        wordTitles.forEach(title => {
            if (inReviewMode) {
                title.classList.add('word-title-blurred');
                // Text content is handled by the click listener
            } else {
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord;
            }
        });

        collapsibleSections.forEach(section => {
            const content = section.querySelector('.discrimination-content-collapsible');
            const toggle = section.querySelector('.collapsible-toggle');
            if (content) {
                if (inReviewMode) {
                    content.classList.add('hidden');
                    if (toggle) toggle.classList.remove('open');
                } else {
                    // In normal mode, sections remain as they were (user-controlled or initially hidden)
                    // If you want them all open when exiting review mode:
                    // content.classList.remove('hidden');
                    // if(toggle) toggle.classList.add('open');
                }
            }
        });
    }

    function initializeInteractiveElements() {
        if (!contentAreaElement) return;
        // Event delegation for collapsible toggles and blurred titles
        contentAreaElement.addEventListener('click', function(event) {
            const toggle = event.target.closest('.collapsible-toggle');
            if (toggle) {
                const content = toggle.nextElementSibling;
                if (content && content.classList.contains('discrimination-content-collapsible')) {
                    content.classList.toggle('hidden');
                    toggle.classList.toggle('open'); // Toggles the class for arrow icon change
                }
            }

            const title = event.target.closest('.word-title.word-title-blurred');
            if (title && isReviewMode) {
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord;
            }
        });
    }

    // --- Initialize Page ---
    // The sidebar is initialized by script.js, so discrimination_script.js
    // only needs to focus on its specific content.
    initializeDiscriminationContent();
});
