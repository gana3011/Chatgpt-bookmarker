console.log("ChatGPT Bookmarker script loaded");

function addBookmarkButtons() {
  const messages = document.querySelectorAll('[data-message-author-role="assistant"]');

  messages.forEach((block) => {
    const messageId = block.getAttribute('data-message-id');
    if (!messageId || block.querySelector('.bookmark-btn')) return;

    const btn = document.createElement('button');
    btn.textContent = '🔖 Bookmark';
    btn.className = 'bookmark-btn';
    btn.style.margin = '10px';
    btn.style.cursor = 'pointer';

    btn.onclick = () => {
      const preview = block.innerText.slice(0, 200);
      const bookmarks = JSON.parse(localStorage.getItem('chatgptBookmarks') || '[]');
      bookmarks.push({ id: messageId, preview });
      localStorage.setItem('chatgptBookmarks', JSON.stringify(bookmarks));
      alert('Bookmarked!');
    };

    block.appendChild(btn);
  });
}

const observer = new MutationObserver(addBookmarkButtons);
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener('load', addBookmarkButtons);