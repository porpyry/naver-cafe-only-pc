"use strict";

chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

const defaultOptions = {
    enableApp: true,
    MTP_redirect: true,
    MTP_changelink: true,
    PTA_redirect: true,
    PTA_changelink: true,
    CON_prevnextkey: true,
    CON_inputkey: true,
    CON_favoriteorder: true,
    CON_defaultnewtab: true,
    CON_accessibility: true,
    EXP_ctrlclick: false,
    EXP_smoothapp: false
};

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.storage.sync.set(defaultOptions);
    }
    if (details.reason === "update") {
        updateDefaultOptions();
        versionUpdate(details.previousVersion);
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

function versionUpdate(previousVersion) {
    if (previousVersion <= '1.2.4') {
        chrome.storage.local.clear();
    }
}
