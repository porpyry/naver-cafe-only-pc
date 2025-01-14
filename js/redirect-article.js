"use strict";

(async () => {
    const options = await getOptions;

    if (!options.enableApp) {
        return;
    }
    if (!(options.PTA_redirect || options.PTA_changelink)) {
        return;
    }

    const pInfo = getUrlInfo(location.href);
    if (!pInfo) {
        return;
    }

    // { type: "article-top", cafeId, articleId, search }
    if (isCompletePage(pInfo)) {
        // 뒤로가기 했을 때 원래 페이지 나타나게 하기
        const { cafeId, articleId } = pInfo;
        checkPageStatus(cafeId, articleId).then((pageStatus) => {
            processCompletePage(cafeId, articleId, pageStatus);
        })
        return;
    }

    // 새 탭에서만 리다이렉트
    if (history.length > 1) {
        return;
    }
    if (!options.PTA_redirect) {
        return;
    }

    const aUrl = await getPTAUrl(pInfo);
    if (!aUrl) {
        return;
    }

    location.replace(aUrl);
    return;



    function isCompletePage(info) {
        if (info.type === "article-top") {
            const hasOldPath = new URLSearchParams(info.search).has("oldPath");
            if (!hasOldPath) {
                return true;
            }
        }
        return false;
    }

    async function checkPageStatus(cafeId, articleId) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                if (document.querySelector(".ArticleContainerWrap")) {
                    resolve();
                    return;
                }
                const pageStatus = await getPageStatus(cafeId, articleId);
                resolve(pageStatus);
            }, 1000);
        });
    }

    async function processCompletePage(cafeId, articleId, pageStatus) {
        switch (pageStatus) {
            case 401: // no-login
                writeMessage("로그인이 필요합니다. 뒤로가기를 눌러주세요.");
                break;
            case 404: // no-article
                writeMessage("없는 게시글입니다. 뒤로가기를 눌러주세요.");
                break;
        }

        if (history.length === 1) {
            const cafeName = await Session.getCafeName(cafeId);
            if (cafeName) {
                switch (pageStatus) {
                    default: // ok
                    case 401: // no-login
                        history.replaceState({ NCOP_PAGE: `https://cafe.naver.com/${cafeName}/${articleId}` }, "");
                        break;
                    case 404: // no-article
                        history.replaceState({ NCOP_PAGE: `https://cafe.naver.com/${cafeName}` }, "");
                        break;
                }
                history.pushState(null, "");
            }
        }

        window.addEventListener("popstate", (event) => {
            const url = event?.state?.NCOP_PAGE;
            if (url) {
                location.replace(url);
            }
        });

        function writeMessage(msg) {
            const app = document.querySelector("#app");
            if (app) {
                const textNode = document.createTextNode(msg);
                app.insertBefore(textNode, app.firstChild);
            }
        }
    }
})();
