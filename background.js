// Initialize extension state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ enabled: true });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getState') {
    chrome.storage.local.get('enabled', (data) => {
      sendResponse({ enabled: data.enabled !== false });
    });
    return true;
  }
  if (msg.type === 'setState') {
    chrome.storage.local.set({ enabled: msg.enabled });
    // Notify all tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'toggle', enabled: msg.enabled }).catch(() => {});
        }
      });
    });
  }
});
