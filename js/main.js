"use strict";

(async () => {
    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }

    const items = filterItems(
        g_isNewCafe ?
            [
                OnFoundNewCafe.getIndex(options)
            ] :
            [
                OnFoundArticle.getIndex(options),
                OnFoundArticleList.getIndex(options),
                OnFoundArticleSearchList.getIndex(options),
                OnFoundCafe.getIndex(options),
                OnFoundCafeIntro.getIndex(options),
                OnFoundDocument.getIndex(options),
                OnFoundMember.getIndex(options),
                OnFoundPopular.getIndex(options)
            ]
    );
    if (items.length === 0) {
        return;
    }

    const monitor = new Monitor(options);
    for (const { key, func } of items) {
        monitor.on(key, func);
    }
    monitor.ready();

    window.addEventListener("DOMContentLoaded", () => {
        if (g_isNewCafe) {
            monitor.call("new-cafe.document", document);
        } else {
            monitor.call("document", document);
        }
    });

    function filterItems(indexList) {
        const items = [];
        for (const index of indexList) {
            for (const [key, func, isValid] of index) {
                if (!func) {
                    throw new Error(`NaverCafeOnlyPC: Invalid function at key: ${key}`);
                }
                if (isValid) {
                    items.push({ key, func });
                }
            }
        }
        return items;
    }
})();
