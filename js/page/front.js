"use strict";

async function initFrontPage() {
    const options = await getOptions;

    if (options.EXP_ctrlclick) {
        EXP_fixCtrlClick();
    }



    function EXP_fixCtrlClick() {
        try {
            const a = document.querySelector("#button_mynews_alarm a.link_chatting");
            a.href = "https://section.cafe.naver.com/ca-fe/home/feed";

            const textNode = a.firstChild;
            if (textNode.nodeType === Node.TEXT_NODE) {
                makeClickShield(textNode);
            }
        } catch (e) { console.error(e); }
    }
}
