document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('goto-review-btn');
    let isReviewMode = false; // 追踪是否处于背诵模式

    const BIANXI_KNOWN_KEYS = [ // 定义在外部，renderDiscriminationData 会用到
        "感情色彩", "词义的细微差别", "使用语境/场合", "语法功能和用法",
        "搭配关系", "词语的强度", "正式程度/语体风格", "具体含义vs.抽象含义",
        "具体指代或强调的侧重点"
    ];

    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('topicId');

    if (!topicId) {
        contentAreaElement.innerHTML = '<p class="error-message">错误：未指定单词分组ID。</p>';
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
                reviewButton.style.display = 'inline-block'; // 显示背诵按钮
            } else {
                contentAreaElement.innerHTML = `<p>未找到ID为 "${topicId}" 的单词分组的辨析信息。</p>`;
                topicTitleElement.textContent = `单词辨析: ${topicId} (未找到)`;
            }
        })
        .catch(error => {
            console.error('加载或处理辨析数据失败:', error);
            contentAreaElement.innerHTML = `<p class="error-message">加载辨析数据失败: ${error.message}</p>`;
        });

    reviewButton.addEventListener('click', () => {
        isReviewMode = !isReviewMode;
        toggleReviewMode(isReviewMode, contentAreaElement);
        reviewButton.textContent = isReviewMode ? '退出背诵模式' : '背诵单词';
    });
});

function renderDiscriminationData(wordsArray, container, BIANXI_KNOWN_KEYS) {
    container.innerHTML = '';

    if (!wordsArray || wordsArray.length === 0) {
        container.innerHTML = '<p>此主题下暂无单词辨析信息。</p>';
        return;
    }

    wordsArray.forEach(wordData => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'discrimination-word';

        let htmlContent = `<h2 data-word="${wordData.word}">${wordData.word}</h2>`; // 单词标题

        // 通俗描述 (始终可见，不参与折叠)
        htmlContent += `<div class="tongsu-miaoshu-container">`;
        htmlContent += `<p class="discrimination-section-title">通俗描述:</p><p class="discrimination-content">${wordData['通俗描述'] || '无'}</p>`;
        htmlContent += `</div>`;

        // Helper to wrap content in a collapsible section div
        const createCollapsibleSectionHTML = (titleText, contentHTML) => {
            if (!contentHTML || contentHTML.trim() === '') return '';
            return `<div class="review-collapsible-section">
                        <p class="discrimination-section-title">${titleText}</p>
                        ${contentHTML}
                    </div>`;
        };

        // 主要释义
        let zhuyaoShiyiContent = `<p class="discrimination-content">${wordData['主要释义'] || '无'}</p>`;
        htmlContent += createCollapsibleSectionHTML('主要释义:', zhuyaoShiyiContent);

        // 全面释义
        if (wordData['全面释义'] && wordData['全面释义'].length > 0) {
            let quanmianShiyiContent = `<ul class="discrimination-content">`;
            wordData['全面释义'].forEach(s => { quanmianShiyiContent += `<li>${s}</li>`; });
            quanmianShiyiContent += `</ul>`;
            htmlContent += createCollapsibleSectionHTML('全面释义:', quanmianShiyiContent);
        }

        // 语义分析
        if (wordData['语义分析']) {
            let yuyiFenxiContent = `<div class="discrimination-content">`;
            yuyiFenxiContent += `<strong>核心意义:</strong> <item>${wordData['语义分析']['核心意义'] || '无'}</item><br>`;
            yuyiFenxiContent += `<strong>语境延展:</strong> <item>${wordData['语义分析']['语境延展'] || '无'}</item><br>`;
            yuyiFenxiContent += `<strong>核心意义的体现:</strong> <item>${wordData['语义分析']['核心意义的体现'] || '无'}</item>`;
            yuyiFenxiContent += `</div>`;
            htmlContent += createCollapsibleSectionHTML('语义分析:', yuyiFenxiContent);
        }

        // 辨析
        let bianxiInnerContent = '';
        if (wordData['辨析']) {
            if (typeof wordData['辨析'] === 'string') {
                const discriminationText = wordData['辨析'];
                let detailsHtml = `<div class="discrimination-content discrimination-details-container">`;
                let foundAnyDetail = false;

                for (let i = 0; i < BIANXI_KNOWN_KEYS.length; i++) {
                    const currentKey = BIANXI_KNOWN_KEYS[i];
                    const searchPattern = currentKey + ":";
                    const currentKeyPatternIndex = discriminationText.indexOf(searchPattern);

                    if (currentKeyPatternIndex !== -1) {
                        const valueStartIndex = currentKeyPatternIndex + searchPattern.length;
                        let valueEndIndex = discriminationText.length;
                        for (let j = 0; j < BIANXI_KNOWN_KEYS.length; j++) {
                            const potentialTerminatingKey = BIANXI_KNOWN_KEYS[j];
                            const terminatorPattern = potentialTerminatingKey + ":";
                            const terminatorIndexInText = discriminationText.indexOf(terminatorPattern, valueStartIndex); // Search after valueStartIndex
                            if (terminatorIndexInText !== -1 && terminatorIndexInText > currentKeyPatternIndex) { // Ensure it's after the current key
                                if (terminatorIndexInText < valueEndIndex) {
                                    valueEndIndex = terminatorIndexInText;
                                }
                            }
                        }
                        const value = discriminationText.substring(valueStartIndex, valueEndIndex).trim();
                        if (value) {
                            detailsHtml += `<p class="discrimination-detail-item"><strong>${currentKey}:</strong> <item>${value}</item></p>`;
                            foundAnyDetail = true;
                        }
                    }
                }
                detailsHtml += `</div>`;
                if (foundAnyDetail) {
                    bianxiInnerContent = detailsHtml;
                } else if (discriminationText.trim().length > 0 && !BIANXI_KNOWN_KEYS.some(k => discriminationText.includes(k + ":"))) {
                    // If no known keys found, but there is text, show the text as is.
                    bianxiInnerContent = `<p class="discrimination-content">${discriminationText}</p>`;
                }

            } else { // If '辨析' is not a string (e.g. from older data format)
                bianxiInnerContent = `<p class="discrimination-content">${String(wordData['辨析'])}</p>`;
            }
        }
        if(bianxiInnerContent){
            htmlContent += createCollapsibleSectionHTML('辨析:', bianxiInnerContent);
        }


        wordDiv.innerHTML = htmlContent;
        container.appendChild(wordDiv);
    });
}

function toggleReviewMode(inReviewMode, contentArea) {
    const wordElements = contentArea.querySelectorAll('.discrimination-word');

    wordElements.forEach(wordDiv => {
        const wordTitleH2 = wordDiv.querySelector('h2'); // The English word
        const collapsibleSections = wordDiv.querySelectorAll('.review-collapsible-section');

        if (inReviewMode) {
            // --- 进入背诵模式 ---
            // 1. 隐藏英文单词，点击显示
            if (wordTitleH2) {
                wordTitleH2.classList.add('word-title-review', 'hidden-word');
                // 存储原始单词文本，避免重复添加 "点击显示单词" 伪元素内容到实际文本
                // const originalWord = wordTitleH2.textContent; (已经用 data-word 存储)
                wordTitleH2.textContent = ''; // 清空实际文本，依赖CSS伪元素显示提示
                wordTitleH2.onclick = function() {
                    this.textContent = this.dataset.word; //恢复单词
                    this.classList.remove('hidden-word');
                    this.onclick = null; // 点击一次后移除事件
                };
            }

            // 2. 折叠其他部分 (通俗描述不受影响，因为它没有 .review-collapsible-section class)
            collapsibleSections.forEach(section => {
                section.classList.add('collapsed');
                const sectionTitle = section.querySelector('.discrimination-section-title');
                if (sectionTitle) {
                    sectionTitle.classList.add('collapsible-toggle');
                    sectionTitle.onclick = function() {
                        section.classList.toggle('collapsed');
                    };
                }
            });

        } else {
            // --- 退出背诵模式 ---
            // 1. 显示英文单词
            if (wordTitleH2) {
                wordTitleH2.textContent = wordTitleH2.dataset.word; // 恢复单词
                wordTitleH2.classList.remove('word-title-review', 'hidden-word');
                wordTitleH2.onclick = null;
            }

            // 2. 展开其他部分
            collapsibleSections.forEach(section => {
                section.classList.remove('collapsed');
                const sectionTitle = section.querySelector('.discrimination-section-title');
                if (sectionTitle) {
                    sectionTitle.classList.remove('collapsible-toggle');
                    sectionTitle.onclick = null;
                }
            });
        }
    });
}