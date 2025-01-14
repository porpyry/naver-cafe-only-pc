"use strict";

async function initSearchPage(doc) {
    const options = await getOptions;

    const mainArea = doc.body.querySelector("#main-area");

    DEF_cleanUpUrl(doc);

    if (options.PTA_changelink) {
        PTA_changeLinks();
    }



    async function PTA_changeLinks() {
        try {
            for (const item of mainArea.querySelectorAll(".inner_list")) {
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

                const aContents = item.querySelector("a.link_contents");
                if (aContents) {
                    aContents.href = aUrl;
                }
            }
        } catch (e) { console.error(e); }
    }
}
