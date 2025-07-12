document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("clearAllBtn").onclick = () => {
    if (confirm("Are you sure you want to delete all bookmarks?")) {
      chrome.storage.local.set({ chatgptBookmarks: [] }, () => {
        document.getElementById("bookmarkList").innerHTML =
          "<li>No bookmarks yet.</li>";
      });
    }
  };

  const list = document.getElementById("bookmarkList");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.storage.local.get({ chatgptBookmarks: [] }, (data) => {
      const bookmarks = data.chatgptBookmarks;
      list.innerHTML = "";

      bookmarks.forEach((bookmark) => {
        const li = document.createElement("li");
        li.textContent = bookmark.preview;

        li.textContent = bookmark.preview;

        const goBtn = document.createElement("button");
        goBtn.textContent = "Go";
        goBtn.style.marginLeft = "10px";

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Clear";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.onclick = () => {
          const newBookmarks = bookmarks.filter(
            (b) => b.id !== bookmark.id || b.url !== bookmark.url
          );
          chrome.storage.local.set({ chatgptBookmarks: newBookmarks }, () => {
            li.remove();
            if (newBookmarks.length === 0) {
              list.innerHTML = "<li>No bookmarks yet.</li>";
            }
          });
        };

        goBtn.onclick = () => {
          chrome.tabs.query({ url: bookmark.url }, (existingTabs) => {
            const scrollScript = `
                function findAndScrollToMessage(messageId, attempts = 0) {
                  const el = document.querySelector('[data-message-id="' + messageId + '"]');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.outline = '3px solid gold';
                    setTimeout(() => el.style.outline = '', 3000);
                  } else if (attempts < 20) {
                    window.scrollBy(0, 200);
                    setTimeout(() => findAndScrollToMessage(messageId, attempts + 1), 300);
                  } else {
                    alert("Message not found after trying.");
                  }
                }
                findAndScrollToMessage("${bookmark.id}");
              `;

            if (existingTabs.length > 0) {
              chrome.tabs.update(existingTabs[0].id, { active: true });
              chrome.tabs.executeScript(existingTabs[0].id, {
                code: scrollScript,
              });
            } else {
              chrome.tabs.create({ url: bookmark.url }, (newTab) => {
                chrome.tabs.onUpdated.addListener(function waitForLoad(
                  tabId,
                  info
                ) {
                  if (tabId === newTab.id && info.status === "complete") {
                    chrome.tabs.onUpdated.removeListener(waitForLoad);
                    chrome.tabs.executeScript(newTab.id, {
                      code: scrollScript,
                    });
                  }
                });
              });
            }
          });
        };

        li.appendChild(goBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
      });

      if (bookmarks.length === 0) {
        list.innerHTML = "<li>No bookmarks yet.</li>";
      }
    });
  });
});
