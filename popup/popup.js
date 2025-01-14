"use strict";

async function init() {
    const options = await chrome.storage.sync.get(null); // get all items

    // enable-app switch
    {
        const checkbox = document.querySelector('#enableSwitch');
        const contents = document.querySelector('#optionContents');
        if (!options[checkbox.name]) {
            contents.style.display = 'none';
        }
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                contents.style.display = 'block';
            } else {
                contents.style.display = 'none';
            }
        });
    }

    // checkbox options
    for (const wrapper of document.querySelectorAll('.option-checkbox')) {
        const checkbox = wrapper.querySelector('input[type=checkbox]');
        checkbox.checked = options[checkbox.name];
        checkbox.addEventListener('change', () => {
            saveOption(checkbox.name, checkbox.checked);
        });
    }
}

async function saveOption(key, value) {
    await chrome.storage.sync.set({ [key]: value });
}

document.addEventListener('DOMContentLoaded', init);
