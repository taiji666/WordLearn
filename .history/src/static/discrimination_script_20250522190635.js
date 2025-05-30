document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('toggle-review-btn'); // Changed ID
    const errorMessageArea = document.getElementById('error-message-area');
    let isReviewMode = false;

    const BIANXI_KNOWN_KEYS = [
        "感情色彩", "词义的细微差别", "使用语境/场合", "语法功能和用法",
        "搭配关系", "词语的强度", "正式程度/语体风格", "具体含义vs.抽象含义",
        "具体指代或强调的侧重点"
    ];

    // --- Tailwind classes for item tags ---
    const generalItemTagClasses = 'item-tag inline-block bg-gray-200 text-gray-700 px-2 py-1 text-sm rounded-md font-mono mx-0.5 my-0.5';
    const semanticItemTagClasses = 'semantic-item-tag inline-block bg-indigo-100 text-indigo-700 px-3 py-1 text-sm rounded-md font-sans mx-0.5 my-0.5';

    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('topicId');

    function displayError(message) {
        errorMessageArea.innerHTML = `<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert">
                                        <strong class="font-bold">错误!</strong>
                                        <span class="block sm:inline">${message}</span>
                                     </div>`;
        contentAreaElement.innerHTML = ''; // Clear loading message
    }

    if (!topicId) {
        displayError('未指定单词分组ID。');
        return;
    }

    // Assuming vocabulary_discrimination_data.json is in a 'data' subdirectory
    fetch('data/vocabulary_discrimination_data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !data.vocabulary_collection) {
                throw new Error('辨析数据格式不正确。');
            }

            const discriminationData = data.vocabulary_collection.find(item =>
                item && typeof item.topic === 'string' && item.topic.startsWith(topicId)
            );

            if (discriminationData) {
                topicTitleElement.textContent = `单词辨析: ${discriminationData.topic}`;
                renderDiscriminationData(discriminationData.words.words, contentAreaElement, BIANXI_KNOWN_KEYS);
                reviewButton.style.display = 'inline-block'; // Show button once data is loaded
                initializeInteractiveElements(); // Initialize listeners for dynamic content
            } else {
                displayError(`未找到ID为 "${topicId}" 的单词分组的辨析信息。`);
                topicTitleElement.textContent = `单词辨析: ${topicId} (未找到)`;
            }
        })
        .catch(error => {
            console.error('加载或处理辨析数据失败:', error);
            displayError(`加载辨析数据失败: ${error.message}`);
        });

    reviewButton.addEventListener('click', () => {
        isReviewMode = !isReviewMode;
        toggleReviewModeUI(isReviewMode, contentAreaElement);
        reviewButton.textContent = isReviewMode ? '退出背诵模式' : '进入背诵模式';
        if(isReviewMode) {
            reviewButton.classList.replace('bg-orange-500', 'bg-green-500');
            reviewButton.classList.replace('hover:bg-orange-600', 'hover:bg-green-600');
        } else {
            reviewButton.classList.replace('bg-green-500', 'bg-orange-500');
            reviewButton.classList.replace('hover:bg-green-600', 'hover:bg-orange-600');
        }
    });

    function renderDiscriminationData(wordsArray, container, knownKeys) {
        container.innerHTML = ''; // Clear previous content or loading message

        if (!wordsArray || wordsArray.length === 0) {
            container.innerHTML = '<p class="text-gray-600">此主题下暂无单词辨析信息。</p>';
            return;
        }
        
        wordsArray.forEach(wordData => {
            const wordDiv = document.createElement('div');
            // Tailwind classes for each word card
            wordDiv.className = 'discrimination-word bg-white border border-gray-200 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 space-y-4';

            let htmlContent = `<h2 class="word-title text-2xl md:text-3xl font-semibold text-orange-600 mb-3 transition-all duration-300 ease-in-out" data-original-word="${wordData.word}">${wordData.word}</h2>`;

            // 通俗描述
            htmlContent += `<div class="tongsu-miaoshu-container bg-gray-50 p-4 rounded-md border-l-4 border-blue-500">
                                <h3 class="text-sm font-semibold text-blue-600 mb-1 uppercase tracking-wider">通俗描述</h3>
                                <p class="text-gray-700 text-base">${wordData['通俗描述'] || '无'}</p>
                            </div>`;
            
            // Function to build sections with Tailwind classes
            function buildSectionHtml(title, content, isCollapsible = false, sectionType = '') {
                if (!content || content.trim() === '') return '';
                
                let titleClasses = "text-xl font-semibold text-gray-700 mb-2";
                let contentClasses = "text-gray-700";
                let sectionWrapperClasses = "word-details-section"; // General section class
                let contentWrapperClasses = "";

                if (isCollapsible) {
                    titleClasses += " collapsible-toggle cursor-pointer hover:text-blue-600 transition-colors";
                    contentWrapperClasses = "discrimination-content-collapsible hidden space-y-2 pl-1"; // Hidden by default
                    sectionWrapperClasses += " review-collapsible-section"; // Mark as collapsible for review mode
                }
                if (sectionType === 'semantic-analysis') {
                     contentWrapperClasses = "discrimination-content-collapsible hidden bg-indigo-50 p-4 rounded-md text-gray-800 leading-relaxed space-y-1";
                }


                let sectionHtml = `<div class="${sectionWrapperClasses}">`;
                sectionHtml += `<h3 class="${titleClasses}">${title}</h3>`;
                sectionHtml += `<div class="${contentWrapperClasses}">${content}</div>`;
                sectionHtml += `</div>`;
                return sectionHtml;
            }

            // 主要释义
            htmlContent += buildSectionHtml('主要释义', `<p>${wordData['主要释义'] || '无'}</p>`, true);

            // 全面释义
            if (wordData['全面释义'] && wordData['全面释义'].length > 0) {
                let quanmianShiyiList = '<ul class="list-disc pl-5 space-y-1">';
                wordData['全面释义'].forEach(s => { quanmianShiyiList += `<li>${s}</li>`; });
                quanmianShiyiList += `</ul>`;
                htmlContent += buildSectionHtml('全面释义', quanmianShiyiList, true);
            }
            
            // 语义分析
            if (wordData['语义分析']) {
                let yuyiFenxiContent = `<p><strong class="text-indigo-600 font-medium">核心意义:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">语境延展:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['语境延展'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="text-indigo-600 font-medium">核心意义的体现:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义的体现'] || '无'}</span></p>`;
                htmlContent += buildSectionHtml('语义分析', yuyiFenxiContent, true, 'semantic-analysis');
            }

            // 辨析 (complex parsing)
            let bianxiDisplayContent = '';
            if (wordData['辨析']) {
                if (typeof wordData['辨析'] === 'string') {
                    const discriminationText = wordData['辨析'];
                    let detailsHtml = '<div class="space-y-1">'; // Container for key-value pairs
                    let foundAnyDetail = false;
                    for (let i = 0; i < knownKeys.length; i++) {
                        const currentKey = knownKeys[i];
                        const searchPattern = currentKey + ":";
                        const currentKeyPatternIndex = discriminationText.indexOf(searchPattern);
                        if (currentKeyPatternIndex !== -1) {
                            const valueStartIndex = currentKeyPatternIndex + searchPattern.length;
                            let valueEndIndex = discriminationText.length;
                            for (let j = 0; j < knownKeys.length; j++) {
                                const potentialTerminatingKey = knownKeys[j];
                                if (i === j) continue;
                                const terminatorPattern = potentialTerminatingKey + ":";
                                const terminatorIndexInText = discriminationText.indexOf(terminatorPattern, currentKeyPatternIndex + 1); // Search after current key
                                if (terminatorIndexInText !== -1 && terminatorIndexInText > valueStartIndex) {
                                    if (terminatorIndexInText < valueEndIndex) {
                                        valueEndIndex = terminatorIndexInText;
                                    }
                                }
                            }
                            const value = discriminationText.substring(valueStartIndex, valueEndIndex).trim();
                            if (value) {
                                // Using generalItemTagClasses for the value part
                                detailsHtml += `<p><strong class="text-blue-600 font-medium">${currentKey}:</strong> <span class="${generalItemTagClasses}">${value}</span></p>`;
                                foundAnyDetail = true;
                            }
                        }
                    }
                    detailsHtml += `</div>`;
                    if (foundAnyDetail) {
                        bianxiDisplayContent = detailsHtml;
                    } else if (discriminationText.trim().length > 0 && !knownKeys.some(k => discriminationText.includes(k + ":"))) {
                        bianxiDisplayContent = `<p>${discriminationText}</p>`; // Display as plain text if no keys found
                    }
                } else { // If not a string, convert to string
                    bianxiDisplayContent = `<p>${String(wordData['辨析'])}</p>`;
                }
            }
            if(bianxiDisplayContent) {
                 htmlContent += buildSectionHtml('辨析', bianxiDisplayContent, true);
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
                // Text content is handled by the click listener to show/hide original word
            } else {
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord; // Restore original word
            }
        });

        collapsibleSections.forEach(section => {
            const content = section.querySelector('.discrimination-content-collapsible');
            const toggle = section.querySelector('.collapsible-toggle');
            if (content) {
                if (inReviewMode) {
                    content.classList.add('hidden'); // Collapse all sections
                    if(toggle) toggle.classList.remove('open');
                } else {
                    // In normal mode, sections are initially collapsed by render function (due to 'hidden' class)
                    // User can expand them manually. Or, if you want them all open:
                    // content.classList.remove('hidden');
                    // if(toggle) toggle.classList.add('open');
                    // For now, let's keep them as rendered (initially hidden)
                }
            }
        });
    }
    
    function initializeInteractiveElements() {
        // Event delegation for collapsible toggles
        contentAreaElement.addEventListener('click', function(event) {
            const toggle = event.target.closest('.collapsible-toggle');
            if (toggle) {
                const content = toggle.nextElementSibling; // Assumes content is direct sibling
                if (content && content.classList.contains('discrimination-content-collapsible')) {
                    content.classList.toggle('hidden');
                    toggle.classList.toggle('open');
                }
            }

            // Event delegation for blurred word titles
            const title = event.target.closest('.word-title.word-title-blurred');
            if (title && isReviewMode) { // Only unblur if in review mode
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord;
                 // Optional: Make it re-blurrable or one-time reveal
                // To make it re-blurrable on a second click (more complex state needed)
                // For now, it's a one-time reveal per click while in review mode.
                // If user clicks again, it won't re-blur unless toggleReviewMode is called.
            }
        });
    }
});
