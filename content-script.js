"use strict";

const options = {};
const nameIdMap = {};

async function init() {
    Object.assign(options, await chrome.storage.sync.get(null));
    if (!options.enableApp) {
        return;
    }

    findCafeInfo();

    if (location.hostname === "cafe.naver.com") {
        if (options.MTP_article || options.CTA_board || options.CTA_article) {
            initCafe(document);
            observeMainDocument(initCafe);
        }
    }
    if (location.hostname === "m.cafe.naver.com") {
        if (options.MTP_redirect) {
            initCafeMobile();
        }
    }
}

function findCafeInfo() {
    const a_id = document.querySelector("#front-cafe a");
    if (!a_id) {
        return;
    }
    const url = new URL("https://cafe.naver.com" + a_id.href);
    const cafeId = url.searchParams.get("clubid");
    if (!cafeId) {
        return;
    }
    const a_name = document.querySelector("footer.footer a.cafe_link");
    if (!a_name) {
        return;
    }
    const linkText = a_name.textContent;
    const cafeName = linkText.substring(linkText.lastIndexOf("/") + 1);
    if (!cafeName) {
        return;
    }
    const items = {};
    items[cafeName] = cafeId;
    chrome.storage.local.set(items);
}

function observeMainDocument(callback) {
    const mainFrame = document.getElementById("cafe_main");
    if (!mainFrame) {
        return;
    }
    mainFrame.addEventListener("load", (event) => {
        callback(event.target.contentDocument);
    });
    if (mainFrame.contentDocument?.readyState === "complete") {
        callback(mainFrame.contentDocument);
    }
}

function initCafe(doc) {
    if (options.MTP_article || options.CTA_article || options.CTA_board) {
        const app = doc.querySelector("#app");
        if (app) {
            if (options.MTP_article || options.CTA_article) {
                findNext(app, "Article", initArticle);
            }
            if (options.CTA_board) {
                findNext(app, "MemberProfile", initMemberProfile);
            }
            return;
        }
    }
    if (options.CTA_board) {
        const mainArea = doc.querySelector("#main-area");
        if (mainArea) {
            initArticleList(mainArea);
        }
        return;
    }
}

function initCafeMobile() {
    redirectToPC();
}

async function initMemberProfile(memberProfile) {
    const articleBoard = await findNext(memberProfile, "article-board");
    findNextTag(articleBoard, "TABLE", (table) => {
        for (const item of table.querySelectorAll(".inner_list")) {
            for (const anchor of [
                item.querySelector("a.article"), // title
                item.querySelector("a.cmt") // comment
            ]) {
                if (anchor) {
                    anchor.href = cta_link(anchor.href);
                }
            }
        }
    });
}

function initArticleList(mainArea) {
    for (const item of mainArea.querySelectorAll(".article-board .inner_list")) {
        for (const anchor of [
            item.querySelector("a.article"), // title
            item.querySelector("a.cmt") // comment
        ]) {
            if (anchor) {
                anchor.href = cta_link(anchor.href);
            }
        }
    }
    for (const item of mainArea.querySelectorAll("ul.article-album-sub li")) {
        for (const anchor of [
            item.querySelector("a.album-img"), // image
            item.querySelector("a.tit"), // title
            item.querySelector("a.m-tcol-p") // comment
        ]) {
            if (anchor) {
                anchor.href = cta_link(anchor.href);
            }
        }
    }
    for (const item of mainArea.querySelectorAll("ul.album-box li")) {
        let href = "";
        for (const anchor of [
            item.querySelector(".photo a"), // image
            item.querySelector(".tit a.m-tcol-c") // title
        ]) {
            if (anchor) {
                anchor.href = cta_link(anchor.href) + "&boardtype=I";
                href = anchor.href;
            }
        }
        const a_comment = item.querySelector(".tit a.m-tcol-p");
        if (a_comment) {
            a_comment.href = href + "&commentFocus=true";
        }
    }
    for (const item of mainArea.querySelectorAll("ul.article-movie-sub .card_area")) {
        for (const anchor of [
            item.querySelector("a.tit"), // title
            item.querySelector("a.txt"), // content
            item.querySelector(".movie-img a") // image
        ]) {
            if (anchor) {
                anchor.href = cta_link(anchor.href);
            }
        }
    }
}

function cta_link(href) {
    const url = new URL("https://cafe.naver.com" + href);
    const cafeId = url.searchParams.get("clubid");
    const articleId = url.searchParams.get("articleid");
    if (cafeId && articleId) {
        return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${url.search}`;
    }
}

async function initArticle(article) {
    const articleWrap = await findNext(article, "article_wrap");
    const links = articleWrap.querySelectorAll("a.se-link");
    const oglinks = articleWrap.querySelectorAll(".se-module-oglink");

    // change mobile link to PC
    if (options.MTP_article) {
        remove_m_fromLinks(links);
        remove_m_fromOglinks(oglinks);
    }

    // change cafe link to article link (cta)
    if (options.CTA_article) {
        await cta_links_oglinks(links, oglinks);
    }

    function remove_m_fromLinks(links) {
        for (const link of links) {
            link.href = remove_m(link.href);
            if (link.textContent.includes("m.cafe.naver.com")) {
                link.textContent = remove_m(link.href);
            }
        }
    }

    function remove_m_fromOglinks(oglinks) {
        for (const oglink of oglinks) {
            const thumbnail = oglink.querySelector("a.se-oglink-thumbnail");
            const info = oglink.querySelector("a.se-oglink-info");
            const infoUrl = info?.querySelector("p.se-oglink-url");
            if (thumbnail) thumbnail.href = remove_m(thumbnail.href);
            if (info) info.href = remove_m(info.href);
            if (infoUrl) infoUrl.textContent = remove_m(infoUrl.textContent);
        }
    }

    function remove_m(text) {
        return text.replace("m.cafe.naver.com", "cafe.naver.com");
    }

    async function cta_links_oglinks(links, oglinks) {
        for (const link of links) {
            const href = await cta_getArticleHref(link.href);
            if (href) {
                if (link.textContent === link.href) {
                    link.textContent = href;
                }
                link.href = href;
            }
        }
        for (const oglink of oglinks) {
            const thumbnail = oglink.querySelector("a.se-oglink-thumbnail");
            const info = oglink.querySelector("a.se-oglink-info");
            if (thumbnail) {
                const href = await cta_getArticleHref(thumbnail.href);
                if (href) {
                    thumbnail.href = href;
                }
            }
            if (info) {
                const href = await cta_getArticleHref(info.href);
                if (href) {
                    info.href = href;
                }
            }
        }
    }

    async function cta_getArticleHref(href) {
        const [cafeId, articleId] = await getIdsFromURL(new URL(href));
        if (cafeId && articleId) {
            return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
        }
    }
}

// return [cafeId, articleId]
async function getIdsFromURL(url) {
    {
        const regexp = /^\/(?<cafeName>\w+)\/(?<articleId>\d+)/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeName, articleId } = matches.groups;
            if (cafeName && articleId) {
                const cafeId = await getCafeId(cafeName);
                if (cafeId) {
                    return [cafeId, articleId];
                }
            }
        }
    }
    if (url.pathname === "/ArticleRead.nhn") {
        const cafeId = url.searchParams.get("clubid");
        const articleId = url.searchParams.get("articleid");
        if (cafeId && articleId) {
            return [cafeId, articleId];
        }
    }
    {
        const iframeLink = url.searchParams.get("iframe_url_utf8");
        if (iframeLink) {
            const iframeUrl = new URL(url.origin + url.pathname + decodeURL(iframeLink));
            const cafeId = iframeUrl.searchParams.get("clubid");
            const articleId = iframeUrl.searchParams.get("articleid");
            if (cafeId && articleId) {
                return [cafeId, articleId];
            }
        }
    }
    {
        const regexp = /^\/ca-fe\/cafes\/(?<cafeId>\w+)\/articles\/(?<articleId>\d+)/;
        const matches = url.pathname.match(regexp);
        if (matches) {
            const { cafeId, articleId } = matches.groups;
            if (cafeId && articleId) {
                return [cafeId, articleId];
            }
        }
    }
    return [undefined, undefined];
}

async function getCafeId(cafeName) {
    if (cafeName in nameIdMap) {
        return nameIdMap[cafeName];
    }
    const items = await chrome.storage.local.get(cafeName);
    const cafeId = items[cafeName];
    if (cafeId) {
        nameIdMap[cafeName] = cafeId;
        return cafeId;
    }
}

function redirectToPC() {
    // cafeName
    {
        const regexp = /^\/(ca-fe\/)?(?<cafeName>\w+)\/?$/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeName } = matches.groups;
            if (cafeName) {
                return location.replace(`https://cafe.naver.com/${cafeName}`);
            }
        }
    }
    // cafeId, menuId
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/menus\/(?<menuId>\d+)/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeId, menuId } = matches.groups;
            if (cafeId && menuId) {
                return location.replace(`https://cafe.naver.com/ArticleList.nhn?search.clubid=${cafeId}&search.menuid=${menuId}`);
            }
        }
    }
    // cafeId, articleId
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/articles\/(?<articleId>\d+)/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeId, articleId } = matches.groups;
            if (cafeId && articleId) {
                return location.replace(`https://cafe.naver.com/ArticleRead.nhn?clubid=${cafeId}&articleid=${articleId}`);
            }
        }
    }
    // cafeName, articleId
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeName>\w+)\/articles\/(?<articleId>\d+)/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeName, articleId } = matches.groups;
            if (cafeName && articleId) {
                return location.replace(`https://cafe.naver.com/${cafeName}/${articleId}`);
            }
        }
    }
    //todo /member/
}

// Utils
// from 'parent', find or observe 'className' child.
// when the child is found or already exists, call callback(child)
// callback will not be disconnected after child is found.
// if callback is undefined, return a Promise that observes once.
function findNext(parent, className, callback) {
    if (callback) {
        return run(callback);
    }
    return new Promise((resolve) => run(resolve));

    function run(callbackOrResolve) {
        const findChild = () => {
            let foundChild;
            for (const child of parent.children) {
                if (child.classList.contains(className)) {
                    foundChild = child;
                    break;
                }
            }
            if (foundChild) {
                callbackOrResolve(foundChild);
            }
            return foundChild;
        };
        if (!findChild() || callback) {
            new MutationObserver((mutations, observer) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.classList?.contains(className)) {
                            if (findChild()) {
                                if (!callback) {
                                    observer.disconnect();
                                }
                                return;
                            }
                        }
                    }
                }
            }).observe(parent, { childList: true });
        }
    };
}

// tagName: all capital
function findNextTag(parent, tagName, callback) {
    if (callback) {
        return run(callback);
    }
    return new Promise((resolve) => run(resolve));

    function run(callbackOrResolve) {
        const findChild = () => {
            let foundChild;
            for (const child of parent.children) {
                if (child.tagName === tagName) {
                    foundChild = child;
                    break;
                }
            }
            if (foundChild) {
                callbackOrResolve(foundChild);
            }
            return foundChild;
        };
        if (!findChild() || callback) {
            new MutationObserver((mutations, observer) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.tagName === tagName) {
                            if (findChild()) {
                                if (!callback) {
                                    observer.disconnect();
                                }
                                return;
                            }
                        }
                    }
                }
            }).observe(parent, { childList: true });
        }
    };
}

init();
