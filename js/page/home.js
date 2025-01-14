"use strict";

async function initHomePage(doc) {
    const options = await getOptions;

    const mainArea = doc.body.querySelector("#main-area");
    const basisElement = mainArea.querySelector("#basisElement");

    DEF_cleanUpUrl(doc);

    if (options.PTA_changelink) {
        PTA_changeLinks();
    }

    if (options.EXP_ctrlclick) {
        EXP_fixCtrlClick();
    }



    async function PTA_changeLinks() {
        // 게시글 (목록형)
        try {
            for (const item of basisElement.querySelectorAll("table.board-box .inner_list")) {
                const aTitle = item.querySelector("a.article");
                if (!aTitle) {
                    continue;
                }

                let aUrl = await getPTAUrlFromUrl(aTitle.href);
                if (!aUrl) {
                    continue;
                }

                aTitle.href = aUrl;

                const aComment = item.querySelector("a.cmt");
                if (aComment) {
                    aComment.href = searchParamSet(aUrl, "commentFocus", true);
                }
            }
        } catch (e) { console.error(e); }

        // 게시글 (앨범형)
        try {
            for (const item of basisElement.querySelectorAll("ul.album-box li")) {
                const aTitle = item.querySelector(".tit a.m-tcol-c");
                if (!aTitle) {
                    continue;
                }

                let aUrl = await getPTAUrlFromUrl(aTitle.href);
                if (!aUrl) {
                    continue;
                }
                aUrl = searchParamSet(aUrl, "boardtype", "I");

                aTitle.href = aUrl;

                const aImage = item.querySelector(".photo a");
                if (aImage) {
                    aImage.href = aUrl;
                }

                const aComment = item.querySelector(".tit a.m-tcol-p");
                if (aComment) {
                    aComment.href = searchParamSet(aUrl, "commentFocus", true);
                }
            }
        } catch (e) { console.error(e); }
    }

    function EXP_fixCtrlClick() {
        try {
            // 게시판 타이틀, 더보기 버튼
            for (const a of basisElement.querySelectorAll(".list-tit a")) {
                a.removeAttribute("onclick");
                if (a.parentElement.tagName === "H3") {
                    const textNode = a.firstChild;
                    if (textNode.nodeType === Node.TEXT_NODE) {
                        makeClickShield(textNode);
                    }
                } else {
                    createClickShield(a);
                }
            }

            // 게시글 (목록형)
            for (const item of basisElement.querySelectorAll("table.board-box .inner_list")) {
                const aTitle = item.querySelector("a.article");
                if (aTitle) {
                    aTitle.removeAttribute("onclick");
                    makeClickShield(aTitle.querySelector("span.inner"));
                }

                const aComment = item.querySelector("a.cmt");
                if (aComment) {
                    aComment.removeAttribute("onclick");

                    // [, em, ] 묶기
                    if (!aComment.querySelector("span")) {
                        const span = doc.createElement("span");
                        span.append(...aComment.childNodes);
                        aComment.appendChild(span);
                        makeClickShield(span);
                    }
                }
            }

            // 게시글 (앨범형)
            for (const item of basisElement.querySelectorAll("ul.album-box li")) {
                const aTitle = item.querySelector(".tit a.m-tcol-c");
                if (aTitle) {
                    aTitle.removeAttribute("onclick");
                    makeClickShield(aTitle.querySelector("span.inner"));
                }

                const aImage = item.querySelector(".photo a");
                if (aImage) {
                    aImage.removeAttribute("onclick");
                    createClickShield(aImage);
                }
            }
        } catch (e) { console.error(e); }
    }
}
