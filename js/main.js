"use strict";

window.addEventListener("DOMContentLoaded", async () => {
    const options = await getOptions;

    if (!options.enableApp) {
        return;
    }

    return init();



    function init() {
        const info = getUrlInfo(location.href);
        if (!info) {
            return;
        }

        // initDocument(document);

        switch (info.type) {
            case "home": // .../cafeName
            case "article": // .../cafeName/articleId
            case "iframe": // .../cafeName?iframe_url=/...
                return initFront();
            case "popular-top": // .../ca-fe/cafes/cafeId/popular
                return initPopular(document);
            case "article-top": // .../ca-fe/cafes/cafeId/articles/articleId
                return initArticle(document);
            case "member-top": // .../ca-fe/cafes/cafeId/members/memberCode
                return initMember(document);
        }
    }

    function initFront() {
        initFrontPage();

        watchIframeDocument((doc) => {
            try {
                const info = getUrlInfo(doc.URL);
                if (!info) {
                    return;
                }

                // initDocument(doc);

                switch (info.type) {
                    case "home-nhn":
                        return initHomePage(doc);
                    case "popular-top":
                        return initPopular(doc);
                    case "board-nhn":
                        return initBoardPage(doc);
                    case "article-nhn":
                    case "article-top":
                        return initArticle(doc);
                    case "member-top":
                        return initMember(doc);
                    case "search-nhn":
                        return initSearchPage(doc);
                    default:
                        DEF_cleanUpUrl(doc);
                        return;
                }
            } catch (e) { console.error(e); }
        });
    }

    function watchIframeDocument(callback) {
        const iframe = document.querySelector("#cafe_main");
        if (!iframe) {
            return;
        }

        // 내부 프레임의 페이지가 변경될 때마다 호출된다.
        iframe.addEventListener("load", (event) => {
            callback(event.target.contentDocument);
        });

        // 이미 로딩이 완료된 경우 즉시 실행한다.
        if (iframe.contentDocument?.readyState === "complete"
            && iframe.contentWindow.location.hostname !== "") {
            callback(iframe.contentDocument);
        }
    }

    async function initPopular(doc) {
        const app = await getApp(doc);

        // 게시글
        watchingChild(app, ".Article", async (article) => {
            const container = await watchSelector(article, ".ArticleContainerWrap");
            initArticlePage(container);
        });

        // 인기글 목록
        watchingChild(app, "section.layout_content", initPopularInner);
    }

    function initPopularInner(section) {
        const doc = section.ownerDocument;

        initPopularPage(doc);

        // 페이지 변경 감지
        const pageChangeObserver = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches("tr")) {
                        initPopularTable(node.parentElement);
                        return; // fire once
                    }
                }
            }
        });

        // 탭 변경
        watchingChild(section, "div:has(> .ArticleBoard)", async (div) => {
            const table = div.querySelector(".article-board table");
            const tbody = await watchSelector(table, "tbody");

            initPopularTable(tbody);

            // 페이지 변경
            pageChangeObserver.disconnect();
            pageChangeObserver.observe(tbody, { childList: true });
        });
    }

    async function initArticle(doc) {
        const app = await getApp(doc);
        const article = await watchSelector(app, ".Article");
        const container = await watchSelector(article, ".ArticleContainerWrap");
        initArticlePage(container);
    }

    async function initMember(doc) {
        const app = await getApp(doc);
        const memberProfile = await watchSelector(app, ".MemberProfile");

        initMemberPage(memberProfile);

        const articleBoard = memberProfile.querySelector(".article-board");

        // 페이지 변경 감지
        const pageChangeObserver = new MutationObserver((mutationList) => {
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches("tr")) {
                        initMemberTable(node.parentElement);
                        return; // fire once
                    }
                }
            }
        });

        // 탭 변경
        watchingChild(articleBoard, "table", (table) => {
            const tbody = table.querySelector("tbody");
            initMemberTable(tbody);

            // 페이지 변경
            pageChangeObserver.disconnect();
            pageChangeObserver.observe(tbody, { childList: true });
        });
    }
});
