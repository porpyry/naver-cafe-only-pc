"use strict";

(async () => {
    if (history.length > 1) {
        return;
    }

    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }
    if (!options.newTabOnlyArticle) {
        return;
    }

    const info = PCArticleURLParser.getInfo(g_initialPathname, g_initialSearch);
    if (!info) {
        return;
    }

    const url = await PCArticleURLParser.getArticleOnlyURL(info)
    if (!url) {
        return;
    }

    const isComplete = url === g_initialHref; // oldPath가 존재하지 않음
    if (isComplete) {
        checkPageValidity(document);
        addBackClickListener();
        return;
    }

    return location.replace(url);

    // 마우스 뒤로가기 버튼으로 닫기
    function addBackClickListener() {
        document.addEventListener("mouseup", onMouseUp);
    }

    function onMouseUp(event) {
        if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
            return;
        }
        if (event.button === 3 && history.length <= 1) {
            chrome.runtime.sendMessage(null, { type: "closeNewTabWithMouse3" });
        }
    }
})();
