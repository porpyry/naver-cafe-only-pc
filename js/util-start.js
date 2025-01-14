"use strict";

const g_cafeName = getUrlInfo(location.href)?.cafeName;

const getOptions = chrome.storage.sync.get(null);

const Session = (() => {
    let cafeNameToId, cafeIdToTitle, cafeIdToName;
    let gettingCafeInfo = null;
    const gettingSession = chrome.storage.session.get(["cafeNameToId", "cafeIdToTitle", "cafeIdToName"])
        .then((items) => {
            cafeNameToId = items.cafeNameToId;
            if (!cafeNameToId) {
                cafeNameToId = {};
            }
            cafeIdToTitle = items.cafeIdToTitle;
            if (!cafeIdToTitle) {
                cafeIdToTitle = {};
            }
            cafeIdToName = items.cafeIdToName;
            if (!cafeIdToName) {
                cafeIdToName = {};
            }
        });
    return { getCafeId, getCafeTitle, getCafeName };

    async function getCafeId(cafeName) {
        let cafeId = cafeNameToId?.[cafeName];
        if (cafeId) {
            return cafeId;
        }

        await gettingSession;

        cafeId = cafeNameToId[cafeName];
        if (cafeId) {
            return cafeId;
        }

        if (!gettingCafeInfo) {
            gettingCafeInfo = getCafeInfoByName(cafeName);
        }
        await gettingCafeInfo;

        cafeId = cafeNameToId[cafeName];
        if (cafeId) {
            return cafeId;
        }
    }

    async function getCafeTitle(cafeId) {
        let cafeTitle = cafeIdToTitle?.[cafeId];
        if (cafeTitle) {
            return cafeTitle;
        }

        await gettingSession;

        cafeTitle = cafeIdToTitle[cafeId];
        if (cafeTitle) {
            return cafeTitle;
        }

        if (!gettingCafeInfo) {
            gettingCafeInfo = getCafeInfoById(cafeId);
        }
        await gettingCafeInfo;

        cafeTitle = cafeIdToTitle[cafeId];
        if (cafeTitle) {
            return cafeTitle;
        }
    }

    async function getCafeName(cafeId) {
        let cafeName = cafeIdToName?.[cafeId];
        if (cafeName) {
            return cafeName;
        }

        await gettingSession;

        cafeName = cafeIdToName[cafeId];
        if (cafeName) {
            return cafeName;
        }

        if (!gettingCafeInfo) {
            gettingCafeInfo = getCafeInfoById(cafeId);
        }
        await gettingCafeInfo;

        cafeName = cafeIdToName[cafeId];
        if (cafeName) {
            return cafeName;
        }
    }

    // 링크는 개발자 도구 > Network 에서 확인할 수 있음
    async function getCafeInfoByName(cafeName) {
        return getCafeInfo(`https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cluburl=${cafeName}`);
    }

    async function getCafeInfoById(cafeId) {
        return getCafeInfo(`https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cafeId=${cafeId}`);
    }

    async function getCafeInfo(url) {
        try {
            const res = await fetch(url);
            const json = await res.json();
            const cafeInfo = json?.message?.result?.cafeInfoView;
            if (!cafeInfo) {
                return;
            }
            const cafeId = cafeInfo.cafeId; // 27842958
            const cafeName = cafeInfo.cafeUrl; // "steamindiegame"
            const cafeTitle = cafeInfo.cafeName; // "왁물원 :: 종합 거시기 스트리머 우왁굳 팬카페"

            await gettingSession;
            cafeNameToId[cafeName] = cafeId;
            cafeIdToTitle[cafeId] = cafeTitle;
            cafeIdToName[cafeId] = cafeName;

            chrome.storage.session.set({ cafeNameToId, cafeIdToTitle, cafeIdToName });
        } catch (e) {
            console.error(e);
        } finally {
            gettingCafeInfo = null;
        }
    }
})();

// ok         = 200
// no-login   = 401
// no-article = 404
async function getPageStatus(cafeId, articleId) {
    try {
        const url = `https://apis.naver.com/cafe-web/cafe-articleapi/v3/cafes/${cafeId}/articles/${articleId}?query=&useCafeId=true&requestFrom=A`;
        const res = await fetch(url, { method: "HEAD", credentials: "include" });
        return res?.status;
    } catch (e) { console.error(e); }
}

// url: href | URL
// return: { type, ... }
function getMobileUrlInfo(url) {
    if (typeof url === "string") {
        try {
            url = new URL(url);
        } catch (e) {
            console.error(e);
            return;
        }
    }

    // { type: "home", cafeName, tab }
    {
        const regexp = /^(\/ca-fe)?\/(?<cafeName>\w+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeName } = matches.groups;
            const tab = url.searchParams.get("tab");
            return { type: "home", cafeName, tab };
        }
    }

    // { type: "board", cafeId, menuId }
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/menus\/(?<menuId>\d+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId, menuId } = matches.groups;
            return { type: "board", cafeId, menuId };
        }
    }

    // { type: "article1", cafeName, articleId }
    {
        const regexp = /^\/(?<cafeName>\w+)\/(?<articleId>\d+)$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeName, articleId } = matches.groups;
            return { type: "article1", cafeName, articleId };
        }
    }
    {
        const regexp = /^\/ca-fe\/(?<cafeName>\w+)\/(?<articleId>\d+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeName, articleId } = matches.groups;
            return { type: "article1", cafeName, articleId };
        }
    }
    const useCafeId = url.searchParams.get("useCafeId")?.toLowerCase();
    if (useCafeId === "false") {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeName>\w+)\/articles\/(?<articleId>\d+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeName, articleId } = matches.groups;
            return { type: "article1", cafeName, articleId };
        }
    }

    // { type: "article2", cafeId, articleId }
    if (!useCafeId || useCafeId === "true") {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/articles\/(?<articleId>\d+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId, articleId } = matches.groups;
            return { type: "article2", cafeId, articleId };
        }
    }

    // { type: "member", cafeId, memberCode, tab }
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/members\/(?<memberCode>[\w-]+)(\/(?<tab>[\w-]+))?\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId, memberCode, tab } = matches.groups;
            switch (tab) {
                case undefined:
                case "articles":
                case "commented-articles":
                case "favorite-articles":
                case "comments":
                    return { type: "member", cafeId, memberCode, tab };
            }
        }
    }

    // { type: "search", cafeId }
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/search\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId } = matches.groups;
            return { type: "search", cafeId };
        }
    }
}

function getMTPUrl(info/* mobileUrlInfo */) {
    switch (info.type) {
        case "home": // { cafeName, tab } (인기글 리다이렉트는 비효율적)
            return `https://cafe.naver.com/${info.cafeName}`;
        case "board": // { cafeId, menuId }
            return `https://cafe.naver.com/ArticleList.nhn?search.clubid=${info.cafeId}&search.menuid=${info.menuId}`;
        case "article1": // { cafeName, articleId }
            return `https://cafe.naver.com/${info.cafeName}/${info.articleId}`;
        case "article2": // { cafeId, articleId }
            return `https://cafe.naver.com/ArticleRead.nhn?clubid=${info.cafeId}&articleid=${info.articleId}`;
        case "member": // { cafeId, memberCode, tab }
            return `https://cafe.naver.com/ca-fe/cafes/${info.cafeId}/members/${info.memberCode}?tab=${getMemberTab(info.tab)}`;
        case "search": // { cafeId }
            return `https://cafe.naver.com/ArticleSearchList.nhn?search.clubid=${info.cafeId}`;
    }

    function getMemberTab(tab) {
        switch (tab) {
            case undefined:
            case "articles":
                return "articles";
            case "commented-articles":
                return "commentedArticles";
            case "favorite-articles":
                return "likedArticles";
            case "comments":
                return "comments";
        }
        return "";
    }
}

// url: href | URL
// return: { type, ... }
function getUrlInfo(url) {
    if (typeof url === "string") {
        try {
            url = new URL(url);
        } catch (e) {
            console.error(e);
            return;
        }
    }

    // { type: "home", cafeName }
    // { type: "iframe", cafeName, iframeInfo } (iframeInfo.type = *.nhn)
    {
        const regexp = /^\/(?<cafeName>\w+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeName } = matches.groups;
            const iframeUrl = getIframeUrl();
            if (iframeUrl) {
                return { type: "iframe", cafeName, iframeInfo: getUrlInfo(iframeUrl) };
            } else {
                return { type: "home", cafeName };
            }
        }
    }

    // { type: "home-nhn", cafeId }
    {
        const regexp = /^\/MyCafeIntro.nhn$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const cafeId = url.searchParams.get("clubid");
            return { type: "home-nhn", cafeId };
        }
    }

    // { type: "board-nhn", cafeId, menuId, search }
    {
        const regexp = /^\/ArticleList.nhn$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const cafeId = url.searchParams.get("search.clubid");
            const menuId = url.searchParams.get("search.menuid");
            return { type: "board-nhn", cafeId, menuId, search: url.search/*additional*/ };
        }
    }

    // { type: "article", cafeName, articleId }
    {
        const regexp = /^\/(?<cafeName>\w+)\/(?<articleId>\d+)$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeName, articleId } = matches.groups;
            return { type: "article", cafeName, articleId };
        }
    }

    // { type: "article-nhn", cafeId, articleId, search }
    {
        const regexp = /^(\/ca-fe)?\/ArticleRead.nhn\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const cafeId = url.searchParams.get("clubid");
            const articleId = url.searchParams.get("articleid");
            return { type: "article-nhn", cafeId, articleId, search: url.search/*additional*/ };
        }
    }

    // { type: "search-nhn", cafeId }
    {
        const regexp = /^\/ArticleSearchList.nhn$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const cafeId = url.searchParams.get("search.clubid");
            return { type: "search-nhn", cafeId };
        }
    }

    // { type: "popular-top", cafeId, tab }
    {
        const regexp = /^\/ca-fe\/cafes\/(?<cafeId>\d+)\/popular(\/(?<tab>\w+))?\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId, tab } = matches.groups;
            switch (tab) {
                case undefined:
                case "comment":
                case "like":
                    return { type: "popular-top", cafeId, tab };
            }
        }
    }

    // { type: "article-top", cafeId, articleId, search }
    {
        const regexp = /^\/ca-fe\/cafes\/(?<cafeId>\d+)\/articles\/(?<articleId>\d+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId, articleId } = matches.groups;
            return { type: "article-top", cafeId, articleId, search: url.search/*additional*/ };
        }
    }

    // { type: "member-top", cafeId, memberCode, tab }
    {
        const regexp = /^\/ca-fe\/cafes\/(?<cafeId>\d+)\/members\/(?<memberCode>[\w-]+)\/?$/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId, memberCode } = matches.groups;
            const tab = url.searchParams.get("tab");
            switch (tab) {
                case null:
                case "articles":
                case "commentedArticles":
                case "likedArticles":
                case "comments":
                    return { type: "member-top", cafeId, memberCode, tab };
            }
        }
    }

    // { type: "cc", uInfo }
    if (url.hostname === "cc.naver.com" && url.pathname === "/cc") {
        const u = url.searchParams.get("u");
        if (u) {
            const uUrl = decodeURIComponent(u);
            if (uUrl) {
                return { type: "cc", uInfo: getUrlInfo(uUrl) };
            }
        }
    }

    function getIframeUrl() {
        let rel = url.searchParams.get("iframe_url");
        if (!rel) {
            rel = url.searchParams.get("iframe_url_utf8");
            if (rel) {
                rel = decodeURIComponent(rel);
            }
        }
        if (rel) {
            return new URL(rel, url.origin);
        }
    }
}

async function getPTAUrl(info/*pcUrlInfo*/) {
    switch (info.type) {
        // { cafeName, articleId } /(cafeName)/(articleId)
        case "article": {
            const cafeId = await Session.getCafeId(info.cafeName);
            if (!cafeId) {
                return;
            }
            return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${info.articleId}`;
        }

        // { cafeId, articleId, search } /ArticleRead.nhn
        case "article-nhn": {
            const searchParams = new URLSearchParams(info.search);
            searchParams.delete("clubid");
            searchParams.delete("articleid");
            let search = searchParams.toString();
            if (searchParams.size > 0) {
                search = "?" + search;
            }
            return `https://cafe.naver.com/ca-fe/cafes/${info.cafeId}/articles/${info.articleId}${search}`;
        }

        // { cafeId, articleId, search } /ca-fe/cafes/(cafeId)/articles/(articleId)
        case "article-top": {
            const searchParams = new URLSearchParams(info.search);
            searchParams.delete("oldPath");
            let search = searchParams.toString();
            if (searchParams.size > 0) {
                search = "?" + search;
            }
            return `https://cafe.naver.com/ca-fe/cafes/${info.cafeId}/articles/${info.articleId}${search}`;
        }

        // { cafeName, iframeInfo } /(cafeName)?iframe_url(_utf8)=
        case "iframe": {
            const type = info.iframeInfo?.type;
            if (type !== "article-nhn" && type !== "article-top") {
                return;
            }
            return await getPTAUrl(info.iframeInfo);
        }

        // { uInfo }
        case "cc": {
            const type = info.uInfo?.type;
            if (type !== "article-nhn" && type !== "article-top") {
                return;
            }
            return await getPTAUrl(info.uInfo);
        }
    }
}
