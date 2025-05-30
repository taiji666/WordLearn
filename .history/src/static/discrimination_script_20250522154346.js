document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');
    const reviewButton = document.getElementById('goto-review-btn');
    let isReviewMode = false;

    const BIANXI_KNOWN_KEYS = [
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
                reviewButton.style.display = 'inline-block';
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

// --- 重点修改: renderDiscriminationData ---
// 使用新的辅助函数 buildSectionElement 来构建HTML，并为不同部分添加特定类名
function renderDiscriminationData(wordsArray, container, BIANXI_KNOWN_KEYS) {
    container.innerHTML = '';

    if (!wordsArray || wordsArray.length === 0) {
        container.innerHTML = '<p>此主题下暂无单词辨析信息。</p>';
        return;
    }

    // 辅助函数，用于构建带有特定类的知识区块
    function buildSectionElement(title, contentHTML, type) {
        if (!contentHTML || contentHTML.trim() === '') return '';
        // type: 'semantic-analysis' (语义分析，背诵时可折叠)
        //       'other-info' (其他信息，如主要释义、辨析等，背诵时隐藏)
        let sectionClass = 'word-details-section'; // 通用基础类
        if (type === 'semantic-analysis') {
            sectionClass += ' semantic-analysis-section review-collapsible-section';
        } else if (type === 'other-info') {
            sectionClass += ' other-info-section';
        }

        return `<div class="${sectionClass}">
                    <p class="discrimination-section-title">${title}</p>
                    ${contentHTML}
                </div>`;
    }

    wordsArray.forEach(wordData => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'discrimination-word';

        let htmlContent = `<h2 data-word="${wordData.word}">${wordData.word}</h2>`;

        htmlContent += `<div class="tongsu-miaoshu-container">`;
        htmlContent += `<p class="discrimination-section-title">通俗描述:</p><p class="discrimination-content">${wordData['通俗描述'] || '无'}</p>`;
        htmlContent += `</div>`;

        let zhuyaoShiyiContent = `<p class="discrimination-content">${wordData['主要释义'] || '无'}</p>`;
        htmlContent += buildSectionElement('主要释义:', zhuyaoShiyiContent, 'other-info');

        if (wordData['全面释义'] && wordData['全面释义'].length > 0) {
            let quanmianShiyiContent = `<ul class="discrimination-content">`;
            wordData['全面释义'].forEach(s => { quanmianShiyiContent += `<li>${s}</li>`; });
            quanmianShiyiContent += `</ul>`;
            htmlContent += buildSectionElement('全面释义:', quanmianShiyiContent, 'other-info');
        }

        if (wordData['语义分析']) {
            let yuyiFenxiContent = `<div class="discrimination-content">`;
            yuyiFenxiContent += `<strong>核心意义:</strong> <item>${wordData['语义分析']['核心意义'] || '无'}</item><br>`;
            yuyiFenxiContent += `<strong>语境延展:</strong> <item>${wordData['语义分析']['语境延展'] || '无'}</item><br>`;
            yuyiFenxiContent += `<strong>核心意义的体现:</strong> <item>${wordData['语义分析']['核心意义的体现'] || '无'}</item>`;
            yuyiFenxiContent += `</div>`;
            htmlContent += buildSectionElement('语义分析:', yuyiFenxiContent, 'semantic-analysis');
        }

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
                            if (i === j) continue; // Don't use the current key as its own terminator immediately
                            const terminatorPattern = potentialTerminatingKey + ":";
                            const terminatorIndexInText = discriminationText.indexOf(terminatorPattern, currentKeyPatternIndex + 1); // Search after current key's pattern
                            if (terminatorIndexInText !== -1 && terminatorIndexInText > valueStartIndex) {
                                if (terminatorIndexInText < valueEndंडex) {
                                    valueEndIndex = terminatorIndexInText;
                                }
                            } else if (terminatorIndexInText !== -1 && terminatorIndexInText < currentKeyPatternIndex && valueStartIndex < discriminationText.indexOf(terminatorPattern, valueStartIndex)) {
                                // This case is tricky, basically if a previous key appears again
                                // For simplicity, the original logic is kept, assuming keys are mostly ordered or distinct.
                                // A more robust parser might be needed for complex overlapping cases.
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
                    bianxiInnerContent = `<p class="discrimination-content">${discriminationText}</p>`;
                }
            } else {
                bianxiInnerContent = `<p class="discrimination-content">${String(wordData['辨析'])}</p>`;
            }
        }
        if(bianxiInnerContent){
            htmlContent += buildSectionElement('辨析:', bianxiInnerContent, 'other-info');
        }

        wordDiv.innerHTML = htmlContent;
        container.appendChild(wordDiv);
    });
}

// --- 重点修改: toggleReviewMode ---
// 根据新的类名来隐藏或折叠特定区块
function toggleReviewMode(inReviewMode, contentArea) {
    const wordElements = contentArea.querySelectorAll('.discrimination-word');

    wordElements.forEach(wordDiv => {
        const wordTitleH2 = wordDiv.querySelector('h2');
        const sectionsToHide = wordDiv.querySelectorAll('.other-info-section');
        const semanticAnalysisSections = wordDiv.querySelectorAll('.semantic-analysis-section'); // These are also .review-collapsible-section

        if (inReviewMode) {
            // --- 进入背诵模式 ---
            if (wordTitleH2) {
                wordTitleH2.classList.add('word-title-review', 'hidden-word');
                wordTitleH2.textContent = '';
                wordTitleH2.onclick = function() {
                    this.textContent = this.dataset.word;
                    this.classList.remove('hidden-word');
                    this.onclick = null;
                };
            }

            sectionsToHide.forEach(section => {
                section.style.display = 'none';
            });

            semanticAnalysisSections.forEach(section => {
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
            if (wordTitleH2) {
                wordTitleH2.textContent = wordTitleH2.dataset.word;
                wordTitleH2.classList.remove('word-title-review', 'hidden-word');
                wordTitleH2.onclick = null;
            }

            sectionsToHide.forEach(section => {
                section.style.display = ''; // Revert to stylesheet's default
            });

            semanticAnalysisSections.forEach(section => {
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