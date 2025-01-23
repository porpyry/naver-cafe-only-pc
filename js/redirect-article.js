"use strict";

(async () => {
    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }
    if (!options.newTabRedirectArticle) {
        return;
    }

    const info = PCArticleURLParser.getInfo(location.pathname, location.search);
    if (!info) {
        return;
    }

    const url = await PCArticleURLParser.getArticleOnlyURL(info)
    const isComplete = url === location.href; // oldPath가 존재하지 않음
    if (isComplete) {
        return addOriginalBackPage(info);
    }
    if (!url) {
        return;
    }

    if (history.length > 1) {
        return;
    }

    return location.replace(url);

    async function addOriginalBackPage(info) {
        // 마우스 뒤로가기 버튼으로 닫기
        if (history.length <= 1) {
            document.addEventListener("mouseup", (event) => {
                if (event.button === 3 && history.length <= 1) {
                    chrome.runtime.sendMessage(null, { type: "closeNewTabWithMouse3" });
                }
            });
        }

        // 1초 기다린 후 로딩 여부 확인
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (document.querySelector(".ArticleContainerWrap")) {
            return;
        }
        const { cafeId, articleId } = info;
        const pageStatus = await getPageStatus(cafeId, articleId);
        if (!pageStatus || pageStatus === 200) {
            return;
        }

        let cafeName;
        switch (pageStatus) {
            case 401: // no-login
                cafeName = await SessionCafeInfo.getCafeName(cafeId);
                writeMessage("로그인이 필요합니다.", `https://cafe.naver.com/${cafeName}/${articleId}`, "로그인하러 가기");
                break;
            case 404: // no-article
                cafeName = await SessionCafeInfo.getCafeName(cafeId);
                writeMessage("없는 게시글입니다.", `https://cafe.naver.com/${cafeName}`, "홈으로 가기");
                break;
        }

        function writeMessage(msg, linkUrl, linkText) {
            const app = document.querySelector("#app");
            if (!app) {
                return;
            }
            const div = document.createElement("div");
            div.innerHTML = `<p>${msg}</p><br><a href="${linkUrl}" style="all: revert;">${linkText}</a>`;
            app.insertBefore(div, app.firstChild);
        }
    }

    async function getPageStatus(cafeId, articleId) {
        try {
            const url = `https://apis.naver.com/cafe-web/cafe-articleapi/v3/cafes/${cafeId}/articles/${articleId}?query=&useCafeId=true&requestFrom=A`;
            const res = await fetch(url, { method: "HEAD", credentials: "include" });
            return res?.status; // 200: ok, 401: no-login, 404: no-article
        } catch (e) { console.error(e); }
    }
})();
