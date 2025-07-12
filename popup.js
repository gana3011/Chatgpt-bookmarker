document.addEventListener('DOMContentLoaded', () => {
  const list = document.getElementById('bookmarkList');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.executeScript(
      tabs[0].id,
      { code: 'localStorage.getItem("chatgptBookmarks")' },
      (results) => {
        const bookmarks = JSON.parse(results[0] || '[]');
        list.innerHTML = '';

        bookmarks.forEach((bookmark) => {
          const li = document.createElement('li');
          li.textContent = bookmark.preview;

          const btn = document.createElement('button');
          btn.textContent = 'Go';
          btn.onclick = () => {
  chrome.tabs.executeScript(tabs[0].id, {
    code: `
      function findAndScrollToMessage(messageId, attempts = 0) {
        const el = document.querySelector('[data-message-id="' + messageId + '"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.outline = '3px solid gold';
          setTimeout(() => el.style.outline = '', 3000);
        } else if (attempts < 20) {
          window.scrollBy(0, 200); // Try loading more of the page
          setTimeout(() => findAndScrollToMessage(messageId, attempts + 1), 300);
        } else {
          alert("Message not found after trying. Scroll manually to load more of the conversation.");
        }
      }
      findAndScrollToMessage("${bookmark.id}");
    `
  });
};


          li.appendChild(btn);
          list.appendChild(li);
        });

        if (bookmarks.length === 0) {
          list.innerHTML = '<li>No bookmarks yet.</li>';
        }
      }
    );
  });
});