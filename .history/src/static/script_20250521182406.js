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



const vocabularyData=await loadJsonData(); // 调用函数并获取数据
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
 */
function populateSidebar() {
    groupListElement.innerHTML = ''; // 清空现有列表

    vocabularyData.vocabulary_collection.forEach(collection => {
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

                // 只有当分组包含单词时，才使其可点击以显示单词
                if (subGroup.words && subGroup.words.length > 0) {
                    subGroupLi.classList.add('clickable');
                    // 使用 dataset 存储 ID，方便后续查找数据
                    subGroupLi.dataset.collectionId = collection.id;
                    subGroupLi.dataset.subGroupId = subGroup.id;

                    subGroupLi.addEventListener('click', () => {
                        // 根据存储的 ID 从原始数据中找到对应的子分组数据
                        const parentCollection = vocabularyData.vocabulary_collection.find(c => c.id === subGroupLi.dataset.collectionId);
                        if (parentCollection) {
                            const selectedSubGroup = parentCollection.sub_groups.find(sg => sg.id === subGroupLi.dataset.subGroupId);
                            if (selectedSubGroup) {
                                displayWords(selectedSubGroup);
                                // 高亮显示当前选中的分组
                                document.querySelectorAll('.subgroup-item.clickable').forEach(item => item.classList.remove('active'));
                                subGroupLi.classList.add('active');
                            }
                        }
                    });
                } else {
                    subGroupLi.classList.add('non-clickable'); // 对于没有单词的分组，标记为不可点击
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
    populateSidebar();
});