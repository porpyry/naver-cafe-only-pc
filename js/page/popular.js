"use strict";

function initPopularPage(doc) {

    DEF_setTitle();



    async function DEF_setTitle() {
        try {
            if (doc !== document) {
                return;
            }

            const info = await getUrlInfo(doc.URL);
            const cafeId = info?.cafeId;
            if (!cafeId) {
                return;
            }

            const cafeTitle = await Session.getCafeTitle(cafeId);
            document.title = `인기글,${cafeTitle} : 네이버 카페`;
        } catch (e) { console.error(e); }
    }
}

async function initPopularTable(tbody) {
    const options = await getOptions;

    const doc = tbody.ownerDocument;

    DEF_cleanUpUrl(doc);

    if (options.EXP_ctrlclick) {
        EXP_fixCtrlClick();
    }



    function EXP_fixCtrlClick() {
        try {
            for (const item of tbody.querySelectorAll(".inner_list")) {
                const aTitle = item.querySelector("a.article");
                if (aTitle) {
                    const textNode = aTitle.firstChild;
                    if (textNode?.nodeType === Node.TEXT_NODE) {
                        makeClickShield(textNode, true); // default: smooth
                    }
                }

                const aComment = item.querySelector("a.cmt");
                if (aComment) {
                    // [, em, ] 묶기
                    if (!aComment.querySelector("span")) {
                        const span = doc.createElement("span");
                        span.append(...aComment.childNodes);
                        aComment.appendChild(span);
                        makeClickShield(span, true); // default: smooth
                    }
                }
            }
        } catch (e) { console.error(e); }
    }
}
