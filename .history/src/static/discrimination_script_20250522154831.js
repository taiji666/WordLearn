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

function renderDiscriminationData(wordsArray, container, BIANXI_KNOWN_KEYS) {
    container.innerHTML = '';

    if (!wordsArray || wordsArray.length === 0) {
        container.innerHTML = '<p>此主题下暂无单词辨析信息。</p>';
        return;
    }

    function buildSectionElement(title, contentHTML, type) {
        if (!contentHTML || contentHTML.trim() === '') return '';
        let sectionClass = 'word-details-section';
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

// --- 重点修改: toggleReviewMode 中关于单词 h2 的显隐逻辑 ---
function toggleReviewMode(inReviewMode, contentArea) {
    const wordElements = contentArea.querySelectorAll('.discrimination-word');

    wordElements.forEach(wordDiv => {
        const wordTitleH2 = wordDiv.querySelector('h2');
        const sectionsToHide = wordDiv.querySelectorAll('.other-info-section');
        const semanticAnalysisSections = wordDiv.querySelectorAll('.semantic-analysis-section');

        if (inReviewMode) {
            // --- 进入背诵模式 ---
            if (wordTitleH2) {
                wordTitleH2.textContent = wordTitleH2.dataset.word; // 确保显示的是实际单词以应用模糊
                wordTitleH2.classList.add('word-title-blurred');   // 添加模糊样式类

                wordTitleH2.onclick = function() { // 点击切换模糊状态
                    this.classList.toggle('word-title-blurred');
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
                wordTitleH2.textContent = wordTitleH2.dataset.word; // 恢复单词文本
                wordTitleH2.classList.remove('word-title-blurred'); // 移除模糊样式
                wordTitleH2.onclick = null; // 清除点击事件
            }

            sectionsToHide.forEach(section => {
                section.style.display = '';
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