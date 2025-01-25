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

    const info = PCArticleURLParser.getInfo(location.pathname, location.search);
    if (!info) {
        return;
    }

    const url = await PCArticleURLParser.getArticleOnlyURL(info)
    if (!url) {
        return;
    }

    const isComplete = url === location.href; // oldPath가 존재하지 않음
    if (isComplete) {
        return addBackClickListener();
    }

    return location.replace(url);

    // 마우스 뒤로가기 버튼으로 닫기
    function addBackClickListener() {
        document.addEventListener("mouseup", (event) => {
            if (event.button === 3 && history.length <= 1) {
                chrome.runtime.sendMessage(null, { type: "closeNewTabWithMouse3" });
            }
        });
    }
})();
