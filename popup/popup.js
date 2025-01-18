"use strict";

document.addEventListener("DOMContentLoaded", async () => {
    const options = await Options.get();

    initCheckbox();
    initSubmenu();

    function initCheckbox() {
        for (const wrapper of document.querySelectorAll(".option-checkbox")) {
            const checkbox = wrapper.querySelector("input[type=checkbox]");
            checkbox.checked = options[checkbox.name];
            checkbox.addEventListener("change", onChange);
        }

        function onChange() {
            saveOption(this.name, this.checked);
        }

        function saveOption(key, value) {
            options[key] = value;
            chrome.storage.sync.set({ options });
        }
    }

    function initSubmenu() {
        for (const wrapper of document.querySelectorAll(".submenu")) {
            const parentName = wrapper.dataset.parent;
            const parentCheckbox = document.querySelector(`input[type=checkbox][name=${parentName}]`);
            hideByCheckbox(parentCheckbox, wrapper);
        }

        function hideByCheckbox(checkbox, target) {
            if (!checkbox.checked) {
                target.classList.add("hidden");
            }
            checkbox.addEventListener("change", onChange);

            function onChange() {
                if (this.checked) {
                    target.classList.remove("hidden");
                } else {
                    target.classList.add("hidden");
                }
            }
        }
    }
});
