document.addEventListener('DOMContentLoaded', () => {
    const topicTitleElement = document.getElementById('discrimination-topic-title');
    const contentAreaElement = document.getElementById('discrimination-content-area');

    // 1. 从 URL 获取 topicId
    const urlParams = new URLSearchParams(window.location.search);
    const topicId = urlParams.get('topicId');
    console.log('topicId:', topicId); // 调试用，确保获取到了正确的 topicId
    if (!topicId) {
        contentAreaElement.innerHTML = '<p class="error-message">错误：未指定单词分组ID。</p>';
        return;
    }

    // 2. 加载辨析 JSON 数据
    fetch('static/vocabulary_discrimination_data.json') // 确保路径正确
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

            // 3. 查找对应的辨析数据
            // 假设 topicId (来自主页的 subGroup.id) 是辨析数据中 "topic" 字段的前缀, e.g., "1-1-1" for "1-1-1 人类"
            // const discriminationData = data.vocabulary_collection.find(item =>
            //     item.topic && item.topic.startsWith(topicId)
            // );
              // **重点修改**：增加对 item 和 item.topic 的检查
            const discriminationData = data.vocabulary_collection.find(item => {
                // 确保 item 存在，item.topic 是字符串，然后再调用 startsWith
                return item && typeof item.topic === 'string' && item.topic.startsWith(topicId);
            });
            console.log('discriminationData:', discriminationData); // 调试用，确保找到了正确的数据

            if (discriminationData) {
                topicTitleElement.textContent = `单词辨析: ${discriminationData.topic}`;
                renderDiscriminationData(discriminationData.words.words, contentAreaElement);
            } else {
                contentAreaElement.innerHTML = `<p>未找到ID为 "${topicId}" 的单词分组的辨析信息。</p>`;
                topicTitleElement.textContent = `单词辨析: ${topicId} (未找到)`;
            }
        })
        .catch(error => {
            console.error('加载或处理辨析数据失败:', error);
            contentAreaElement.innerHTML = `<p class="error-message">加载辨析数据失败: ${error.message}</p>`;
        });
});

function renderDiscriminationData(wordsArray, container) {
    container.innerHTML = ''; // 清空加载提示

    if (!wordsArray || wordsArray.length === 0) {
        container.innerHTML = '<p>此主题下暂无单词辨析信息。</p>';
        return;
    }

    wordsArray.forEach(wordData => {
        const wordDiv = document.createElement('div');
        wordDiv.className = 'discrimination-word';

        let htmlContent = `<h2>${wordData.word}</h2>`;
        htmlContent += `<p><span class="discrimination-section-title">主要释义:</span> <span class="discrimination-content">${wordData['主要释义']}</span></p>`; // 使用方括号访问含中文的键

        if (wordData['全面释义'] && wordData['全面释义'].length > 0) {
            htmlContent += `<p class="discrimination-section-title">全面释义:</p><ul class="discrimination-content">`;
            wordData['全面释义'].forEach(s => { htmlContent += `<li>${s}</li>`; });
            htmlContent += `</ul>`;
        }

        htmlContent += `<p class="discrimination-section-title">通俗描述:</p><p class="discrimination-content">${wordData['通俗描述']}</p>`;

        if (wordData['语义分析']) {
            htmlContent += `<p class="discrimination-section-title">语义分析:</p>`;
            htmlContent += `<div class="discrimination-content"><strong>核心意义:</strong> <item>${wordData['语义分析']['核心意义']} </item><br>`;
            htmlContent += `<strong>语境延展:</strong>  <item>${wordData['语义分析']['语境延展']} </item><br>`;
            htmlContent += `<strong>核心意义的体现:</strong>  <item>${wordData['语义分析']['核心意义的体现']} </item></div>`;
        }
         const BIANXI_KNOWN_KEYS = [
          "感情色彩", "词义的细微差别", "使用语境/场合", "语法功能和用法",
          "搭配关系", "词语的强度", "正式程度/语体风格", "具体含义vs.抽象含义",
          "具体指代或强调的侧重点"
        ];
        if (wordData['辨析'] && typeof wordData['辨析'] === 'string') {
        htmlContent += `<p class="discrimination-section-title">辨析:</p>`;
        const discriminationText = wordData['辨析'];
        htmlContent += `<div class="discrimination-content discrimination-details-container">`;

        for (let i = 0; i < BIANXI_KNOWN_KEYS.length; i++) {
            const currentKey = BIANXI_KNOWN_KEYS[i];
            const searchPattern = currentKey + ":"; // 例如："感情色彩:"

            const currentKeyPatternIndex = discriminationText.indexOf(searchPattern);

            if (currentKeyPatternIndex !== -1) {
                // 值从 "currentKey:" 之后开始
                const valueStartIndex = currentKeyPatternIndex + searchPattern.length;
                let valueEndIndex = discriminationText.length; // 默认值的结束位置是整个辨析文本的末尾

                // 寻找下一个已知键在文本中的起始位置，以确定当前键的值的结束边界
                // 遍历所有已知的键，找到在当前键之后出现、并且位置最早的那一个
                for (let j = 0; j < BIANXI_KNOWN_KEYS.length; j++) {
                    // if (j === i) continue; // 不需要跳过当前键，因为我们要找的是文本中实际出现的下一个键模式

                    const potentialTerminatingKey = BIANXI_KNOWN_KEYS[j];
                    const terminatorPattern = potentialTerminatingKey + ":";
                    
                    // 搜索这个结束符模式在文本中的位置
                    // 必须确保这个结束符模式是在当前键模式之后出现的
                    const terminatorIndexInText = discriminationText.indexOf(terminatorPattern, currentKeyPatternIndex + 1);


                    if (terminatorIndexInText !== -1 && terminatorIndexInText > currentKeyPatternIndex) {
                            // 如果找到了一个在当前键模式之后出现的结束符，
                            //并且这个结束符比之前记录的 valueEndIndex 更早，则更新 valueEndIndex
                        if (terminatorIndexInText < valueEndIndex) {
                            valueEndIndex = terminatorIndexInText;
                        }
                    }
                }
                
                const value = discriminationText.substring(valueStartIndex, valueEndIndex).trim();

                if (value) { // 仅当提取到的值不为空时才显示
                    htmlContent += `<p class="discrimination-detail-item"><strong>${currentKey}:</strong>  <item>${value}</item></p>`;
                }
            }
        }
        htmlContent += `</div>`; // 关闭 discrimination-details-container
        } else if (wordData['辨析']) {
            htmlContent += `<p class="discrimination-section-title">辨析:</p><p class="discrimination-content">${String(wordData['辨析'])}</p>`;
        }
        // htmlContent += `<p class="discrimination-section-title">辨析:</p><p class="discrimination-content">${wordData['辨析']}</p>`;

        wordDiv.innerHTML = htmlContent;
        container.appendChild(wordDiv);
    });
}