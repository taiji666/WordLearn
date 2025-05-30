document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('toggle-review-btn');
    const errorMessageArea = document.getElementById('error-message-area');
    let isReviewMode = false;

    const BIANXI_KNOWN_KEYS = [
        "感情色彩", "词义的细微差别", "使用语境/场合", "语法功能和用法",
        "搭配关系", "词语的强度", "正式程度/语体风格", "具体含义vs.抽象含义",
        "具体指代或强调的侧重点"
    ];

    // --- Bulma classes for item tags ---
    // Using 'tag is-light' for general items and 'tag is-info is-light' for semantic items
    const generalItemTagClasses = 'tag is-light mr-1 mb-1'; // Added mr-1, mb-1 for spacing
    const semanticItemTagClasses = 'tag is-info is-light mr-1 mb-1';

    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('topicId');

    function displayError(message) {
        // Using Bulma's notification class
        errorMessageArea.innerHTML = `<div class="notification is-danger">
                                        <button class="delete" onclick="this.parentElement.remove()"></button>
                                        <strong>错误!</strong> ${message}
                                     </div>`;
        contentAreaElement.innerHTML = ''; // Clear loading message
    }

    if (!topicId) {
        displayError('未指定单词分组ID。');
        return;
    }

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
                reviewButton.style.display = 'inline-block';
                initializeInteractiveElements();
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
        // Toggle Bulma button color classes
        if(isReviewMode) {
            reviewButton.classList.remove('is-warning');
            reviewButton.classList.add('is-success');
        } else {
            reviewButton.classList.remove('is-success');
            reviewButton.classList.add('is-warning');
        }
    });

    function renderDiscriminationData(wordsArray, container, knownKeys) {
        container.innerHTML = '';

        if (!wordsArray || wordsArray.length === 0) {
            container.innerHTML = '<p class="has-text-grey">此主题下暂无单词辨析信息。</p>';
            return;
        }
        
        wordsArray.forEach(wordData => {
            const wordDiv = document.createElement('div');
            // Using Bulma's card component for each word
            wordDiv.className = 'card discrimination-word-card'; // Added custom class for margin

            let cardContent = `<div class="card-content">`;
            cardContent += `<h2 class="title is-4 has-text-link word-title" data-original-word="${wordData.word}">${wordData.word}</h2>`;

            // 通俗描述 - using a custom styled div or a Bulma message
            cardContent += `<div class="tongsu-miaoshu-container mt-4 mb-4 p-3"> 
                                <p class="heading has-text-info is-size-6">通俗描述</p>
                                <p class="is-size-6 has-text-grey-darker">${wordData['通俗描述'] || '无'}</p>
                            </div>`;
            
            function buildSectionHtml(title, content, isCollapsible = false, sectionType = '') {
                if (!content || content.trim() === '') return '';
                
                // Using Bulma's title/subtitle and content classes
                let titleHtmlClass = "subtitle is-5 has-text-grey-darker"; // Default title class
                let contentHtmlClass = "content is-normal"; // Bulma's .content for typography
                let sectionWrapperClass = "mb-4"; // Margin bottom for sections
                let contentWrapperExtraClass = "";

                if (isCollapsible) {
                    titleHtmlClass += " collapsible-toggle is-clickable"; // Add is-clickable for cursor
                     // Content starts hidden if collapsible, Bulma's is-hidden
                    contentWrapperExtraClass = "is-hidden discrimination-content-collapsible";
                    sectionWrapperClass += " review-collapsible-section";
                }
                
                // Specific styling for semantic analysis content wrapper
                if (sectionType === 'semantic-analysis') {
                    // Using Bulma's message component for semantic analysis for distinct look
                    return `<div class="message is-link review-collapsible-section ${sectionWrapperClass}">
                                <div class="message-header collapsible-toggle is-clickable">${title}</div>
                                <div class="message-body ${contentHtmlClass} ${contentWrapperExtraClass} semantic-analysis-content">
                                    ${content}
                                </div>
                            </div>`;
                }

                let sectionHtml = `<div class="${sectionWrapperClass}">`;
                sectionHtml += `<h3 class="${titleHtmlClass}">${title}</h3>`;
                sectionHtml += `<div class="${contentHtmlClass} ${contentWrapperExtraClass}">${content}</div>`;
                sectionHtml += `</div>`;
                return sectionHtml;
            }

            cardContent += buildSectionHtml('主要释义', `<p>${wordData['主要释义'] || '无'}</p>`, true);

            if (wordData['全面释义'] && wordData['全面释义'].length > 0) {
                let quanmianShiyiList = '<ul>'; // .content will style ul/li
                wordData['全面释义'].forEach(s => { quanmianShiyiList += `<li>${s}</li>`; });
                quanmianShiyiList += `</ul>`;
                cardContent += buildSectionHtml('全面释义', quanmianShiyiList, true);
            }
            
            if (wordData['语义分析']) {
                let yuyiFenxiContent = `<p><strong class="has-text-link-dark">核心意义:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="has-text-link-dark">语境延展:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['语境延展'] || '无'}</span></p>`;
                yuyiFenxiContent += `<p><strong class="has-text-link-dark">核心意义的体现:</strong> <span class="${semanticItemTagClasses}">${wordData['语义分析']['核心意义的体现'] || '无'}</span></p>`;
                cardContent += buildSectionHtml('语义分析', yuyiFenxiContent, true, 'semantic-analysis');
            }

            let bianxiDisplayContent = '';
            if (wordData['辨析']) {
                if (typeof wordData['辨析'] === 'string') {
                    const discriminationText = wordData['辨析'];
                    let detailsHtml = '<div>'; 
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
                                const terminatorIndexInText = discriminationText.indexOf(terminatorPattern, currentKeyPatternIndex + 1);
                                if (terminatorIndexInText !== -1 && terminatorIndexInText > valueStartIndex) {
                                    if (terminatorIndexInText < valueEndIndex) {
                                        valueEndIndex = terminatorIndexInText;
                                    }
                                }
                            }
                            const value = discriminationText.substring(valueStartIndex, valueEndIndex).trim();
                            if (value) {
                                detailsHtml += `<p><strong class="has-text-info-dark">${currentKey}:</strong> <span class="${generalItemTagClasses}">${value}</span></p>`;
                                foundAnyDetail = true;
                            }
                        }
                    }
                    detailsHtml += `</div>`;
                    if (foundAnyDetail) {
                        bianxiDisplayContent = detailsHtml;
                    } else if (discriminationText.trim().length > 0 && !knownKeys.some(k => discriminationText.includes(k + ":"))) {
                        bianxiDisplayContent = `<p>${discriminationText}</p>`;
                    }
                } else { 
                    bianxiDisplayContent = `<p>${String(wordData['辨析'])}</p>`;
                }
            }
            if(bianxiDisplayContent) {
                 cardContent += buildSectionHtml('辨析', bianxiDisplayContent, true);
            }

            cardContent += `</div>`; // End card-content
            wordDiv.innerHTML = cardContent;
            container.appendChild(wordDiv);
        });
    }

    function toggleReviewModeUI(inReviewMode, contentArea) {
        const wordTitles = contentArea.querySelectorAll('.word-title');
        const collapsibleSections = contentArea.querySelectorAll('.review-collapsible-section');

        wordTitles.forEach(title => {
            if (inReviewMode) {
                title.classList.add('word-title-blurred');
            } else {
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord;
            }
        });

        collapsibleSections.forEach(section => {
            // For regular sections, content is direct child of .collapsible-toggle's parent
            // For message component (semantic analysis), content is .message-body
            const content = section.querySelector('.discrimination-content-collapsible, .message-body');
            const toggle = section.querySelector('.collapsible-toggle, .message-header');
            
            if (content) {
                if (inReviewMode) {
                    content.classList.add('is-hidden');
                    if(toggle) toggle.classList.remove('is-active'); // is-active for arrow
                } else {
                    // In normal mode, sections are initially collapsed by render function
                    // (due to 'is-hidden' class on discrimination-content-collapsible)
                    // or if it's a message, it's also hidden.
                }
            }
        });
    }
    
    function initializeInteractiveElements() {
        contentAreaElement.addEventListener('click', function(event) {
            const toggle = event.target.closest('.collapsible-toggle, .message-header.is-clickable');
            if (toggle) {
                let content;
                if (toggle.classList.contains('message-header')) { // Semantic analysis section
                    content = toggle.nextElementSibling; // .message-body
                } else { // Other collapsible sections
                    content = toggle.nextElementSibling; 
                }

                if (content && (content.classList.contains('discrimination-content-collapsible') || content.classList.contains('message-body'))) {
                    content.classList.toggle('is-hidden');
                    toggle.classList.toggle('is-active'); // For arrow direction
                }
            }

            const title = event.target.closest('.word-title.word-title-blurred');
            if (title && isReviewMode) {
                title.classList.remove('word-title-blurred');
                title.textContent = title.dataset.originalWord;
            }
        });
    }
});
