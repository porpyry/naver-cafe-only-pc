"use strict";

async function initBoardPage(doc) {
    const options = await getOptions;

    const mainArea = doc.body.querySelector("#main-area");

    DEF_cleanUpUrl(doc);

    if (options.PTA_changelink) {
        PTA_changeLinks();
    }



    async function PTA_changeLinks() {
        // 목록형
        try {
            for (const item of mainArea.querySelectorAll(".article-board .inner_list")) {
                const aTitle = item.querySelector("a.article");
                if (!aTitle) {
                    continue;
                }

                const aUrl = await getPTAUrlFromUrl(aTitle.href);
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

        // 앨범형
        try {
            for (const item of mainArea.querySelectorAll("ul.article-album-sub li")) {
                const aTitle = item.querySelector("a.tit");
                if (!aTitle) {
                    continue;
                }

                const aUrl = await getPTAUrlFromUrl(aTitle.href);
                if (!aUrl) {
                    continue;
                }

                aTitle.href = aUrl;

                const aImage = item.querySelector("a.album-img");
                if (aImage) {
                    aImage.href = aUrl;
                }

                const aComment = item.querySelector("a.m-tcol-p");
                if (aComment) {
                    aComment.href = searchParamSet(aUrl, "commentFocus", true);
                }
            }
        } catch (e) { console.error(e); }

        // 카드형
        try {
            for (const item of mainArea.querySelectorAll("ul.article-movie-sub .card_area")) {
                const aTitle = item.querySelector("a.tit");
                if (!aTitle) {
                    continue;
                }

                const aUrl = await getPTAUrlFromUrl(aTitle.href);
                if (!aUrl) {
                    continue;
                }

                aTitle.href = aUrl;

                const aImage = item.querySelector(".movie-img a");
                if (aImage) {
                    aImage.href = aUrl;
                }

                const aContent = item.querySelector("a.txt");
                if (aContent) {
                    aContent.href = aUrl;
                }
            }
        } catch (e) { console.error(e); }
    }
}
