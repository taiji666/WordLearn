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
            const discriminationData = data.vocabulary_collection.find(item =>
                item.topic && item.topic.startsWith(topicId)
            );
            ; 
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
            htmlContent += `<div class="discrimination-content"><strong>核心意义:</strong> ${wordData['语义分析']['核心意义']}<br>`;
            htmlContent += `<strong>语境延展:</strong> ${wordData['语义分析']['语境延展']}<br>`;
            htmlContent += `<strong>核心意义的体现:</strong> ${wordData['语义分析']['核心意义的体现']}</div>`;
        }

        htmlContent += `<p class="discrimination-section-title">辨析:</p><p class="discrimination-content">${wordData['辨析']}</p>`;

        wordDiv.innerHTML = htmlContent;
        container.appendChild(wordDiv);
    });
}