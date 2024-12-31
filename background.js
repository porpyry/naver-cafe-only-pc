"use strict";

// sync : options
// local : cafe name -> cafe id map

const defaultOptions = {
    enableApp: true,
    // Mobile link To PC link
    MTP_redirect: true,
    MTP_article: true,
    // Cafe link To Article link
    CTA_board: true,
    CTA_article: true
};

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        chrome.storage.sync.set(defaultOptions);
    }
    if (details.reason === "update") {
        updateDefaultOptions();
    }
});

async function updateDefaultOptions() {
    const allItems = await chrome.storage.sync.get(null);
    const validKeys = Object.keys(defaultOptions);
    const validItems = await chrome.storage.sync.get(validKeys);
    const addedItems = {};
    for (const key of validKeys) {
        if (!(key in validItems)) {
            addedItems[key] = defaultOptions[key];
        }
    }
    chrome.storage.sync.set(addedItems);
    const removedKeys = [];
    for (const key in allItems) {
        if (!(key in validItems)) {
            removedKeys.push(key);
        }
    }
    chrome.storage.sync.remove(removedKeys);
}
