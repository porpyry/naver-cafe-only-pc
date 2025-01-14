"use strict";

async function initMemberPage(memberProfile) {
    const doc = memberProfile.ownerDocument;
    const profile = await watchSelector(memberProfile, ".sub_tit_profile");

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

            const nick = profile.querySelector("button.nick_btn");
            if (nick) {
                const name = nick.textContent.trim();
                document.title = `${name} : ${cafeTitle} : 네이버 카페`;
            }
        } catch (e) { console.error(e); }
    }
}

async function initMemberTable(tbody) {
    const options = await getOptions;

    const doc = tbody.ownerDocument;

    DEF_cleanUpUrl(doc);

    if (options.PTA_changelink) {
        PTA_changeLinks();
    }



    async function PTA_changeLinks() {
        try {
            for (const item of tbody.querySelectorAll("td.td_article")) {
                const aItem = item.querySelector("a.board-list");
                if (aItem) {
                    // 댓글 탭
                    const aUrl = await getPTAUrlFromUrl(aItem.href);
                    if (aUrl) {
                        aItem.href = aUrl;
                    }
                } else {
                    // 그 외 탭
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
            }
        } catch (e) { console.error(e); }
    }
}
