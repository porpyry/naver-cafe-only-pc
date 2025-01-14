"use strict";

async function initArticlePage(container) {
    const options = await getOptions;

    const doc = container.ownerDocument;

    DEF_cleanUpUrl(doc);
    DEF_setTitle();

    if (options.MTP_changelink || options.PTA_changelink) {
        MTP_PTA_changeLinks();
    }

    if (options.PTA_changelink) {
        PTA_removeOldPath();
        PTA_prevNextBtns();
    }

    if (options.EXP_ctrlclick) {
        EXP_fixCtrlClick();
    }

    watchRelatedArticles((a) => {
        DEF_fixRelatedArticles(a);

        if (options.PTA_changelink) {
            PTA_relatedArticles(a);
        }
    });

    watchPopularArticles((a) => {
        if (options.PTA_changelink) {
            PTA_popularArticles(a);
        }
    });

    watchProfileCard((profileArea) => {
        DEF_fixProfileCard(profileArea);

        if (options.PTA_changelink) {
            PTA_profileCard(profileArea);
        }
    })



    async function watchRelatedArticles(onUpdate) {
        try {
            const div = container.querySelector(".RelatedArticlesTab");
            const ul = await watchSelector(div, "ul.RelatedArticlesList");
            const observer = new MutationObserver(run); // 페이지 변경 감지
            run();
            async function run() {
                // 감지 중단
                observer.disconnect();

                const items = ul.querySelectorAll(".tit_area > a.tit");
                for (const a of items) {
                    onUpdate(a);
                }

                // 감지 재개
                for (const a of items) {
                    observer.observe(a, { attributes: true, attributeFilter: ["href"] });
                }
            }
        } catch (e) { console.error(e); }
    }

    async function watchPopularArticles(onUpdate) {
        try {
            const div = container.querySelector(".RelatedArticles").parentElement;
            const popularArticles = await watchSelector(div, ".PopularArticles");
            const observer = new MutationObserver(run); // 페이지 변경 감지
            run();
            async function run() {
                // 감지 중단
                observer.disconnect();

                const items = popularArticles.querySelectorAll("a.link");
                for (const a of items) {
                    onUpdate(a);
                }

                // 감지 재개
                for (const a of items) {
                    observer.observe(a, { attributes: true, attributeFilter: ["href"] });
                }
            }
        } catch (e) { console.error(e); }
    }

    async function watchProfileCard(onUpdate) {
        const articleWriterProfile = container.querySelector(".ArticleWriterProfile");
        const profileArea = await Promise.race([
            watchSelector(articleWriterProfile, ".profileArea"),
            new Promise((resolve) => setTimeout(resolve, 5000, null))
        ]);
        if (!profileArea) {
            return;
        }
        onUpdate(profileArea);
    }

    function DEF_setTitle() {
        try {
            if (doc !== document) {
                return;
            }

            const title = container.querySelector(".title_text");
            if (title) {
                document.title = `${title.textContent} : 네이버 카페`;
            }
        } catch (e) { console.error(e); }
    }

    function DEF_fixRelatedArticles(a) {
        try {
            addCategoryToLink(a);
            addLinkToCommentNum(a);

            // 말머리 클릭 안 되는 버그 수정
            function addCategoryToLink(a) {
                let category = a.querySelector("em.category");
                if (category) {
                    category.remove();
                }
                category = a.parentElement.querySelector("em.category");
                if (category) {
                    category.style.display = null;
                    a.insertBefore(category.cloneNode(true), a.firstChild);
                    category.style.display = "none";
                }
            }

            // 댓글 숫자 부분 링크 수정
            function addLinkToCommentNum(a) {
                const num = a.parentElement.querySelector("span.num");
                if (!num) {
                    return;
                }
                const textNode = num.childNodes[1];
                if (textNode?.nodeType !== Node.TEXT_NODE) {
                    return;
                }
                const aNum = doc.createElement("a");
                aNum.href = searchParamSet(a.href, "commentFocus", true);;
                textNode.parentNode.insertBefore(aNum, textNode);
                aNum.appendChild(textNode);
            }
        } catch (e) { console.error(e); }
    }

    function DEF_fixProfileCard(profileArea) {
        // 프로필 사진에 링크 추가
        const url = container.querySelector(".thumb_area a").href;
        const profileThumb = profileArea.querySelector("img.profileCircle");
        if (profileThumb.parentElement.matches("a")) {
            return;
        }
        const a = doc.createElement("a");
        a.href = url;
        profileThumb.parentNode.insertBefore(a, profileThumb);
        a.appendChild(profileThumb);
    }

    async function MTP_PTA_changeLinks() {
        // 순서대로 실행되어야 함
        if (options.MTP_changelink) {
            await MTP_changeLinks();
        }
        if (options.PTA_changelink) {
            await PTA_changeLinks();
        }
    }

    async function MTP_changeLinks() {
        try {
            for (const a of container.querySelectorAll("a.se-link")) {
                if (!a?.href.includes("m.cafe.naver.com")) {
                    continue;
                }

                const pUrl = getMTPUrlFromUrl(a.href);
                if (!pUrl) {
                    continue;
                }

                const isSameLink = a.textContent === a.href;
                a.href = pUrl;
                if (isSameLink) {
                    a.textContent = pUrl;
                }
            }
            for (const oglink of container.querySelectorAll(".se-module-oglink")) {
                const aInfo = oglink.querySelector("a.se-oglink-info");
                if (!aInfo?.href.includes("m.cafe.naver.com")) {
                    continue;
                }

                const pUrl = getMTPUrlFromUrl(aInfo.href);
                if (!pUrl) {
                    continue;
                }

                aInfo.href = pUrl;

                const p = aInfo.querySelector("p.se-oglink-url");
                if (p?.textContent === "m.cafe.naver.com") {
                    p.textContent = "cafe.naver.com";
                }

                const aThumb = oglink.querySelector("a.se-oglink-thumbnail");
                if (aThumb) {
                    aThumb.href = pUrl;
                }
            }
        } catch (e) { console.error(e); }
    }

    async function PTA_changeLinks() {
        try {
            for (const a of container.querySelectorAll("a.se-link")) {
                if (!a?.href.includes("cafe.naver.com")) {
                    continue;
                }

                let aUrl = await getPTAUrlFromUrl(a.href);
                if (!aUrl) {
                    continue;
                }
                aUrl = aUrl.split("?")[0];

                const isSameLink = a.textContent === a.href;
                a.href = aUrl;
                if (isSameLink) {
                    a.textContent = aUrl;
                }
            }
            for (const oglink of container.querySelectorAll(".se-module-oglink")) {
                const aInfo = oglink.querySelector("a.se-oglink-info");
                if (!aInfo?.href.includes("cafe.naver.com")) {
                    continue;
                }

                let aUrl = await getPTAUrlFromUrl(aInfo.href);
                if (!aUrl) {
                    continue;
                }
                aUrl = aUrl.split("?")[0];

                aInfo.href = aUrl;

                const aThumb = oglink.querySelector("a.se-oglink-thumbnail"); // a1.href == a2.href
                if (aThumb) {
                    aThumb.href = aUrl;
                }
            }
        } catch (e) { console.error(e); }
    }

    function PTA_removeOldPath() {
        try {
            const url = new URL(doc.URL);
            if (url.searchParams.has("oldPath")) {
                url.searchParams.delete("oldPath");
                doc.defaultView.history.replaceState(null, "", url)
            }
        } catch (e) { console.error(e); }
    }

    function PTA_prevNextBtns() {
        try {
            const rightArea = container.querySelector(".ArticleTopBtns .right_area");
            const callback = async (a) => {
                const aUrl = await getPTAUrlFromUrl(a.href);
                if (aUrl) {
                    a.href = aUrl;
                }
            };
            watchSelector(rightArea, "a.btn_prev").then(callback);
            watchSelector(rightArea, "a.btn_next").then(callback);
        } catch (e) { console.error(e); }
    }

    async function PTA_relatedArticles(a) {
        try {
            const aUrl = await getPTAUrlFromUrl(a.href);
            if (aUrl && (a.href !== aUrl)) {
                a.href = aUrl;
            }

            // 댓글 숫자
            const aNum = a.parentElement.querySelector("span.num a");
            if (aNum) {
                aNum.href = searchParamSet(aUrl, "commentFocus", true);;
            }
        } catch (e) { console.error(e); }
    }

    async function PTA_popularArticles(a) {
        try {
            const aUrl = await getPTAUrlFromUrl(a.href);
            if (aUrl && (a.href !== aUrl)) {
                a.href = aUrl;
            }
        } catch (e) { console.error(e); }
    }

    // 네이버 카페 애드온 (epcibdcgmbiimdleghmeldeopdjcaeic)
    async function PTA_profileCard(profileArea) {
        try {
            // 최근 글 목록
            for (const a of profileArea.querySelectorAll("li.recentArticleItem a")) {
                const aUrl = await getPTAUrlFromUrl(a.href);
                if (aUrl) {
                    a.href = aUrl;
                }
            }
        } catch (e) { console.error(e); }
    }

    function EXP_fixCtrlClick() {
        try {
            // 우측 상단 이전글·다음글·목록 버튼
            const topRightArea = container.querySelector(".ArticleTopBtns .right_area");
            watchSelector(topRightArea, "a.btn_prev").then(createClickShield);
            watchSelector(topRightArea, "a.btn_next").then(createClickShield);
            for (const a of topRightArea.querySelectorAll("a")) {
                if (a.textContent.includes("목록")) {
                    createClickShield(a);
                }
            }

            // 우측 하단 목록 버튼
            const bottomRightArea = container.querySelector(".ArticleBottomBtns .right_area");
            for (const a of bottomRightArea.querySelectorAll("a")) {
                if (a.textContent.includes("목록")) {
                    createClickShield(a);
                }
            }

            // 복사 버튼
            const aCopy = container.querySelector("a.button_url")
            if (aCopy) {
                const textNode = aCopy.firstChild;
                if (textNode?.nodeType === Node.TEXT_NODE) {
                    makeClickShield(textNode, true);
                }
            }
        } catch (e) { console.error(e); }

        // 하단 관련글·인기글
        try {
            const relatedArticles = container.querySelector(".RelatedArticlesTab");
            watchSelector(relatedArticles, "ul.RelatedArticlesList").then((ul) => {
                for (const a of ul.querySelectorAll("a.tit")) {
                    makeClickShield(a.querySelector("span"));
                }
            });
            const div = container.querySelector(".RelatedArticles").parentElement;
            watchSelector(div, ".PopularArticles").then((popularArticles) => {
                for (const a of popularArticles.querySelectorAll("a.link")) {
                    createClickShield(a);
                }
            });
        } catch (e) { console.error(e); }
    }
}
