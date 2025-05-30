// 确保将你的 JSON 数据完整地粘贴到这里
async function loadJsonData() {
    try {
        const response = await fetch('static/vocabulary_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const vocabularyData = await response.json();
        return vocabularyData;
    } catch (error) {
        console.error('无法加载 JSON 数据:', error);
        const dataContainer = document.getElementById('word-display-area'); // 更合适的容器来显示错误
        if (dataContainer) { // 确保容器存在
             dataContainer.innerHTML = '<p>加载数据失败，请检查文件路径或网络连接。</p>';
        }
    }
}

const groupListElement = document.getElementById('group-list');
const selectedGroupTitleElement = document.getElementById('selected-group-title');
const wordDisplayAreaElement = document.getElementById('word-display-area');

function displayWords(subGroup) {
    selectedGroupTitleElement.textContent = subGroup.title;
    wordDisplayAreaElement.innerHTML = '';

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
            sensesHTML = '<ul class="senses-list">';
            wordObj.Entry.senses.forEach(sense => {
                sensesHTML += `<li><strong>${sense.translation}</strong> <definition> ${sense.definition}</li>`;
            });
            sensesHTML += '</ul>';
        } else {
            sensesHTML = '<p><em>暂无详细释义。</em></p>';
        }

        li.innerHTML = `
            <div class="word-header-container">
                <span class="english-word">${wordObj.word}</span>
                <span class="reveal-word-prompt">(Show Word)</span>
            </div>
            <p class="part-of-speech"><em>${wordObj.Entry ? wordObj.Entry.part_of_speech : '词性未知'}</em></p>
            ${sensesHTML}
        `;

        const wordHeaderContainer = li.querySelector('.word-header-container');
        const englishWordSpan = li.querySelector('.english-word');
        const revealPromptSpan = li.querySelector('.reveal-word-prompt');

        englishWordSpan.classList.add('hidden');

        wordHeaderContainer.addEventListener('click', () => {
            englishWordSpan.classList.toggle('hidden');
            if (!englishWordSpan.classList.contains('hidden')) {
                revealPromptSpan.textContent = '(Hide Word)';
            } else {
                revealPromptSpan.textContent = '(Show Word)';
            }
        });
        ul.appendChild(li);
    });
    wordDisplayAreaElement.appendChild(ul);
}

function populateSidebar(loadedVocabularyData) {
    if (!groupListElement) {
        console.error("Error: groupListElement is not found!");
        return;
    }
    groupListElement.innerHTML = '';

    if (!loadedVocabularyData || !loadedVocabularyData.vocabulary_collection) {
        console.error("Error: vocabulary_collection is missing in loaded data for sidebar.");
        groupListElement.innerHTML = '<li>词汇数据格式不正确或加载失败。</li>';
        return;
    }

    loadedVocabularyData.vocabulary_collection.forEach(collection => {
        const collectionLi = document.createElement('li');
        collectionLi.className = 'collection-item';

        const collectionTitle = document.createElement('span');
        collectionTitle.className = 'collection-title';
        collectionTitle.textContent = `${collection.title} (ID: ${collection.id})`;
        collectionLi.appendChild(collectionTitle);

        if (collection.sub_groups && collection.sub_groups.length > 0) {
            collectionTitle.classList.add('collapsible');
            collectionTitle.title = '点击展开/折叠';

            const subGroupUl = document.createElement('ul');
            subGroupUl.className = 'subgroup-list';

            collectionTitle.addEventListener('click', () => {
                collectionTitle.classList.toggle('expanded');
                subGroupUl.classList.toggle('expanded');
            });

            collection.sub_groups.forEach(subGroup => {
                const subGroupLi = document.createElement('li');
                subGroupLi.className = 'subgroup-item';
                subGroupLi.textContent = `${subGroup.title} (ID: ${subGroup.id})`;

                if (subGroup.words && subGroup.words.length > 0) {
                    subGroupLi.classList.add('clickable');
                    subGroupLi.dataset.collectionId = String(collection.id);
                    subGroupLi.dataset.subGroupId = String(subGroup.id);

                    subGroupLi.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const parentCollection = loadedVocabularyData.vocabulary_collection.find(c => String(c.id) === subGroupLi.dataset.collectionId);
                        if (parentCollection) {
                            const selectedSubGroup = parentCollection.sub_groups.find(sg => String(sg.id) === subGroupLi.dataset.subGroupId);
                            if (selectedSubGroup) {
                                displayWords(selectedSubGroup);
                                document.querySelectorAll('.subgroup-item.clickable').forEach(item => item.classList.remove('active'));
                                subGroupLi.classList.add('active');

                                // **重点：移动端点击单词分组后关闭侧边栏**
                                const sidebarElement = document.querySelector('.sidebar');
                                if (window.innerWidth < 768 && sidebarElement && sidebarElement.classList.contains('open')) {
                                    sidebarElement.classList.remove('open');
                                }
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

document.addEventListener('DOMContentLoaded', () => {
    // **重点：侧边栏切换功能**
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // 加载 JSON 数据并填充侧边栏
    loadJsonData().then(data => {
        if (data) {
            console.log('JSON Data successfully loaded:', data);
            populateSidebar(data);
        } else {
            console.log('Data was not loaded, sidebar will not be populated.');
            if (groupListElement) { // 确保元素存在再操作
                groupListElement.innerHTML = '<li>数据未能加载。</li>';
            }
        }
    }).catch(error => {
        console.error('Error during data loading or sidebar initialization:', error);
        if (groupListElement) {
            groupListElement.innerHTML = '<li>初始化数据失败，请稍后重试。</li>';
        }
        // 可以考虑在主要内容区显示更明显的错误信息
        if(wordDisplayAreaElement){
            wordDisplayAreaElement.innerHTML = '<p>页面初始化过程中发生错误，请刷新页面或稍后再试。</p>';
        }
    });
});