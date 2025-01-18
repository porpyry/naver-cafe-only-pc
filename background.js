"use strict";

try {
    importScripts("js/util/options.js");

    chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_AND_UNTRUSTED_CONTEXTS' });

    chrome.runtime.onInstalled.addListener(async (details) => {
        switch (details.reason) {
            case "install":
                await chrome.storage.sync.set({ options: new Options() });
                break;
            case "update":
                await updateVersion(details.previousVersion);
                await updateDefaultOptions();
                break;
        }
    });
} catch (e) { console.error(e); }

async function updateDefaultOptions() {
    const oldOptions = await Options.get();
    const newOptions = new Options();

    for (const option in newOptions) {
        if (option in oldOptions) {
            newOptions[option] = oldOptions[option];
        }
    }

    await chrome.storage.sync.set({ options: newOptions });
}

async function updateVersion(previousVersion) {
    if (previousVersion < '2.0.0') {
        const oldOptions = await chrome.storage.sync.get(null);
        await chrome.storage.sync.clear();
        await chrome.storage.sync.set({ options: oldOptions });
        await chrome.storage.local.clear();
    }
}
