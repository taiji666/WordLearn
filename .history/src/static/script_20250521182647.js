// 确保将你的 JSON 数据完整地粘贴到这里
async function loadJsonData() {
    try {
        // 假设你的 JSON 文件名为 data.json 并且与 HTML 文件在同一目录下
        const response = await fetch('static/vocabulary_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const vocabularyData = await response.json(); // 解析 JSON 数据
        return vocabularyData; // 返回解析后的数据




    } catch (error) {
        console.error('无法加载 JSON 数据:', error);
        const dataContainer = document.getElementById('container');
        dataContainer.innerHTML = '<p>加载数据失败。</p>';
    }
}




console.log(vocabularyData); // 在控制台打印数据
// DOM 元素获取
const groupListElement = document.getElementById('group-list');
const selectedGroupTitleElement = document.getElementById('selected-group-title');
const wordDisplayAreaElement = document.getElementById('word-display-area');

/**
 * 显示选定分组的单词信息
 * @param {object} subGroup - 包含单词列表的子分组对象
 */
function displayWords(subGroup) {
    selectedGroupTitleElement.textContent = subGroup.title;
    wordDisplayAreaElement.innerHTML = ''; // 清空上一次显示的内容

    if (!subGroup.words || subGroup.words.length === 0) {
        wordDisplayAreaElement.innerHTML = '<p>此分组没有单词。</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'word-list';

    subGroup.words.forEach(wordObj => {
        const li = document.createElement('li');
        li.className = 'word-item';

        let sensesHTML = '';
        if (wordObj.Entry && wordObj.Entry.senses && wordObj.Entry.senses.length > 0) {
            sensesHTML = '<ul class="senses-list">'; // 添加类名
            wordObj.Entry.senses.forEach(sense => {
                sensesHTML += `<li><strong>${sense.translation}</strong>: ${sense.definition}</li>`;
            });
            sensesHTML += '</ul>';
        } else {
            sensesHTML = '<p><em>暂无详细释义。</em></p>';
        }

        li.innerHTML = `
            <h3>${wordObj.word}</h3>
            <p class="part-of-speech"><em>${wordObj.Entry ? wordObj.Entry.part_of_speech : '词性未知'}</em></p>
            ${sensesHTML}
        `;
        ul.appendChild(li);
    });
    wordDisplayAreaElement.appendChild(ul);
}


/**
 * 填充侧边栏的单词分组列表
 * @param {object} loadedVocabularyData - 从JSON加载并解析后的词汇数据  <-- 修改点：添加参数
 */
function populateSidebar(loadedVocabularyData) { // <-- 修改点：添加参数
    if (!groupListElement) { // 最好加上对DOM元素的检查
        console.error("Error: groupListElement is not found!");
        return;
    }
    groupListElement.innerHTML = ''; // 清空现有列表

    // 使用传入的参数 loadedVocabularyData
    if (!loadedVocabularyData || !loadedVocabularyData.vocabulary_collection) {
        console.error("Error: vocabulary_collection is missing in loaded data for sidebar.");
        groupListElement.innerHTML = '<li>词汇数据格式不正确或加载失败。</li>';
        return;
    }

    loadedVocabularyData.vocabulary_collection.forEach(collection => { // <-- 修改点：使用参数
        const collectionLi = document.createElement('li');
        collectionLi.className = 'collection-item';

        const collectionTitle = document.createElement('span');
        collectionTitle.className = 'collection-title';
        collectionTitle.textContent = collection.title;
        collectionLi.appendChild(collectionTitle);

        if (collection.sub_groups && collection.sub_groups.length > 0) {
            const subGroupUl = document.createElement('ul');
            subGroupUl.className = 'subgroup-list';

            collection.sub_groups.forEach(subGroup => {
                const subGroupLi = document.createElement('li');
                subGroupLi.className = 'subgroup-item';
                subGroupLi.textContent = subGroup.title;

                if (subGroup.words && subGroup.words.length > 0) {
                    subGroupLi.classList.add('clickable');
                    subGroupLi.dataset.collectionId = collection.id;
                    subGroupLi.dataset.subGroupId = subGroup.id;

                    subGroupLi.addEventListener('click', () => {
                        // 在事件监听器内部也使用传入的 loadedVocabularyData
                        const parentCollection = loadedVocabularyData.vocabulary_collection.find(c => c.id === subGroupLi.dataset.collectionId); // <-- 修改点
                        if (parentCollection) {
                            const selectedSubGroup = parentCollection.sub_groups.find(sg => sg.id === subGroupLi.dataset.subGroupId);
                            if (selectedSubGroup) {
                                displayWords(selectedSubGroup);
                                document.querySelectorAll('.subgroup-item.clickable').forEach(item => item.classList.remove('active'));
                                subGroupLi.classList.add('active');
                            }
                        }
                    });
                } else {
                    subGroupLi.classList.add('non-clickable');
                }
                subGroupUl.appendChild(subGroupLi);
            });
            collectionLi.appendChild(subGroupUl);
        }
        groupListElement.appendChild(collectionLi);
    });
}

// 页面加载完成后执行初始化操作
document.addEventListener('DOMContentLoaded', () => {
    loadJsonData().then(data => { // <-- 修改点：使用 .then() 来处理 Promise
        if (data) { // 确保数据成功加载
            console.log('JSON Data successfully loaded:', data);
            populateSidebar(data); // <-- 修改点：将加载的数据传递给 populateSidebar
        } else {
            // loadJsonData 内部的 catch 应该已经处理了UI提示
            console.log('Data was not loaded, sidebar will not be populated.');
        }
    }).catch(error => {
        // 这个 catch 捕获 loadJsonData() 本身的Promise被拒绝
        // 或者 .then()回调中发生的错误 (例如 populateSidebar 内部如果还有未捕获的错误)
        console.error('Error during data loading or sidebar initialization:', error);
        // 可以在这里添加一个更通用的错误显示，如果loadJsonData中的还不够
        if (groupListElement) { // 避免在 groupListElement 不存在时报错
            groupListElement.innerHTML = '<li>初始化数据失败，请稍后重试。</li>';
        }
    });
});