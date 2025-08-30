// Polyfill: use browser.* if available, else chrome.*
if (typeof browser === "undefined") {
  var browser = chrome;
}

console.log("ChatGPT Bookmarker script loaded");

function getTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

// Listen for messages from popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getTheme") {
    sendResponse({ theme: getTheme() });
  }
});

function addBookmarkButtons() {
  const selectors = [
    '[data-message-author-role="assistant"]',
    '[data-testid*="conversation-turn"]:has([data-message-author-role="assistant"])',
    '.group:has([data-message-author-role="assistant"])',
    '[data-message-id]'
  ];

  let messages = [];
  for (const selector of selectors) {
    messages = document.querySelectorAll(selector);
    if (messages.length > 0) break;
  }

  messages.forEach((block) => {
    const messageId =
      block.getAttribute("data-message-id") ||
      block.querySelector("[data-message-id]")?.getAttribute("data-message-id");

    if (!messageId || block.querySelector(".bookmark-img")) return;

    const theme = getTheme();
    const img = document.createElement("img");
    img.src = browser.runtime.getURL(
      theme === "light" ? "assets/bookmark-light.svg" : "assets/bookmark-dark.svg"
    );
    img.className = "bookmark-img";
    img.style.margin = "10px";
    img.style.height = "16px";
    img.style.width = "16px";
    img.alt = "Bookmark icon";
    img.style.cursor = "pointer";
    img.style.position = "relative";
    img.style.zIndex = "1000";

    img.onclick = () => {
      const preview = block.innerText.slice(0, 100);
      const chatUrl = window.location.href;

      browser.storage.local.get("chatgptBookmarks").then((data) => {
        const bookmarks = data.chatgptBookmarks || [];
        bookmarks.push({ id: messageId, preview, url: chatUrl });

        browser.storage.local.set({ chatgptBookmarks: bookmarks }).then(() => {
          alert("Bookmarked!");
        });
      });
    };

    block.appendChild(img);
  });
}

function checkForPendingScroll() {
  browser.storage.local.get("pendingScroll").then((data) => {
    const pending = data.pendingScroll;
    if (pending && pending.url === window.location.href) {
      console.log("Found pending scroll for message:", pending.messageId);

      if (Date.now() - pending.timestamp < 30000) {
        setTimeout(() => {
          findAndScrollToMessage(pending.messageId);
          browser.storage.local.remove("pendingScroll");
        }, 2000);
      } else {
        console.log("Pending scroll request too old, ignoring");
        browser.storage.local.remove("pendingScroll");
      }
    }
  });
}

function findAndScrollToMessage(messageId, attempts = 0) {
  const el = document.querySelector('[data-message-id="' + messageId + '"]');
  if (el) {
    console.log("Message found, scrolling...");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } else if (attempts < 60) {
    window.scrollBy(0, 300);
    setTimeout(() => findAndScrollToMessage(messageId, attempts + 1), 500);
  } else {
    if (attempts === 60) {
      window.scrollTo(0, 0);
      setTimeout(() => findAndScrollToMessage(messageId, 61), 1000);
    } else if (attempts < 120) {
      window.scrollBy(0, 200);
      setTimeout(() => findAndScrollToMessage(messageId, attempts + 1), 300);
    } else {
      alert("Message not found. The conversation might have been modified or the message may no longer exist.");
    }
  }
}

const observer = new MutationObserver(() => {
  setTimeout(addBookmarkButtons, 100);
  const theme = getTheme();
  browser.storage.local.set({ chatgptTheme: theme });
});

observer.observe(document.body, { childList: true, subtree: true });
observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

window.addEventListener("load", () => {
  setTimeout(addBookmarkButtons, 1000);
  setTimeout(addBookmarkButtons, 3000);
  setTimeout(addBookmarkButtons, 5000);
  setTimeout(checkForPendingScroll, 2000);
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    addBookmarkButtons();
    setTimeout(checkForPendingScroll, 1000);
  });
} else {
  addBookmarkButtons();
  setTimeout(checkForPendingScroll, 1000);
}
