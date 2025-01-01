"use strict";

const options = {};
const cafeInfo = new Map();

async function init() {
    Object.assign(options, await chrome.storage.sync.get(null));
    if (!options.enableApp) {
        return;
    }

    if (location.hostname === "cafe.naver.com") {
        if (options.MTP_article || options.CTA_board || options.CTA_article) {
            findCafeInfoInDocument();
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

function findCafeInfoInDocument() {
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
    cafeInfo.set(cafeName, cafeId);
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
    if (options.MTP_article || options.CTA_article) {
        const app = doc.querySelector("#app");
        if (app) {
            findNext(app, "Article", initArticle);
            if (options.CTA_advanced) {
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
                    anchor.href = cta_relatedLink(anchor.href);
                    anchor.target = "_self";
                    // clear weird listeners
                    anchor.parentNode.replaceChild(anchor.cloneNode(true), anchor);
                }
            }
        }
    });
}

function initArticleList(mainArea) {
    // list type
    for (const item of mainArea.querySelectorAll(".article-board .inner_list")) {
        for (const anchor of [
            item.querySelector("a.article"), // title
            item.querySelector("a.cmt") // comment
        ]) {
            if (anchor) {
                anchor.href = cta_relatedLink(anchor.href);
            }
        }
    }
    // album type
    for (const item of mainArea.querySelectorAll("ul.article-album-sub li")) {
        for (const anchor of [
            item.querySelector("a.album-img"), // image
            item.querySelector("a.tit"), // title
            item.querySelector("a.m-tcol-p") // comment
        ]) {
            if (anchor) {
                anchor.href = cta_relatedLink(anchor.href);
            }
        }
    }
    // details type
    for (const item of mainArea.querySelectorAll("ul.article-movie-sub .card_area")) {
        for (const anchor of [
            item.querySelector("a.tit"), // title
            item.querySelector("a.txt"), // content
            item.querySelector(".movie-img a") // image
        ]) {
            if (anchor) {
                anchor.href = cta_relatedLink(anchor.href);
            }
        }
    }
    // main page
    if (options.CTA_advanced) {
        for (const item of mainArea.querySelectorAll("ul.album-box li")) {
            let href = "";
            for (const anchor of [
                item.querySelector(".photo a"), // image
                item.querySelector(".tit a.m-tcol-c") // title
            ]) {
                if (anchor) {
                    anchor.href = cta_relatedLink(anchor.href) + "&boardtype=I";
                    href = anchor.href;
                    // clear weird listeners
                    anchor.removeAttribute("onclick");
                    anchor.parentNode.replaceChild(anchor.cloneNode(true), anchor);
                }
            }
            const a_comment = item.querySelector(".tit a.m-tcol-p");
            if (a_comment) {
                a_comment.href = href + "&commentFocus=true";
            }
        }
        // menu title
        for (const anchor of mainArea.querySelectorAll(".list-tit a")) {
            // clear weird listeners
            anchor.removeAttribute("onclick");
            anchor.parentNode.replaceChild(anchor.cloneNode(true), anchor);
        }
    }
}

function cta_relatedLink(href) {
    return cta_link("https://cafe.naver.com" + href)
}

function cta_link(href) {
    const url = new URL(href);
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
        cta_links_oglinks(links, oglinks);
        editProfileCard(articleWrap); // Other Extension - Naver Cafe Addon
        cta_relatedArticles(articleWrap);
        cta_popularArticles(articleWrap);
        if (options.CTA_advanced) {
            editPrevNextButtons(articleWrap);
            editCopyUrlButton(articleWrap); // Copy URL button (wheel click)
        }
    }

    async function findCafeInfoInArticle(articleWrap) {
        if (cafeInfo.size > 0) {
            return;
        }
        const btns = await findNext(articleWrap, "ArticleTopBtns");
        const a = btns?.querySelector(".right_area a");
        if (!a) {
            return;
        }
        const url = new URL(a.href);
        const cafeName = url.pathname.substring(1);
        const iframeLink = url.searchParams.get("iframe_url");
        if (!iframeLink) {
            return;
        }
        const iframeUrl = new URL(url.origin + url.pathname + iframeLink);
        let cafeId = iframeUrl.searchParams.get("search.clubid");
        if (!cafeId) {
            cafeId = iframeUrl.searchParams.get("clubid");
        }
        if (cafeName && cafeId) {
            cafeInfo.set(cafeName, cafeId);
        }
    }

    async function cta_relatedArticles(articleWrap) {
        const relatedArticles = await findChild(articleWrap, "RelatedArticles");
        const relatedArticlesList = await findChild(relatedArticles, "RelatedArticlesList");
        for (const anchor of relatedArticlesList.querySelectorAll(".tit_area a.tit")) {
            anchor.href = cta_link(anchor.href);
            whenElementChanged(anchor, (el) => {
                el.href = cta_link(el.href);
            });
        }
    }

    async function cta_popularArticles(articleWrap) {
        const popularArticles = await findChild(articleWrap, "PopularArticles");
        for (const anchor of popularArticles.querySelectorAll("li.list_item a.link")) {
            anchor.href = cta_link(anchor.href);
            // bug: cannot remove weird listeners
            whenElementChanged(anchor, (el) => {
                el.href = cta_link(el.href);
            });
        }
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
        await findCafeInfoInArticle(articleWrap);
        for (const link of links) {
            const href = cta_getArticleHref(link.href);
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
                const href = cta_getArticleHref(thumbnail.href);
                if (href) {
                    thumbnail.href = href;
                }
            }
            if (info) {
                const href = cta_getArticleHref(info.href);
                if (href) {
                    info.href = href;
                }
            }
        }
    }

    function cta_getArticleHref(href) {
        const [cafeId, articleId] = getIdsFromURL(new URL(href));
        if (cafeId && articleId) {
            return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
        }
    }

    // return [cafeId, articleId]
    function getIdsFromURL(url) {
        {
            const regexp = /^\/(?<cafeName>\w+)\/(?<articleId>\d+)/;
            const matches = url.pathname.match(regexp);
            if (matches) {
                const { cafeName, articleId } = matches.groups;
                if (cafeName && articleId) {
                    const cafeId = cafeInfo.get(cafeName);
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
                const iframeUrl = new URL(url.origin + url.pathname + decodeURIComponent(iframeLink));
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

    function editPrevNextButtons(articleWrap) {
        findChild(articleWrap, "btn_prev").then((prevBtn) => {
            const url = new URL(prevBtn.href);
            const iframeLink = url.searchParams.get("iframe_url");
            if (iframeLink) {
                prevBtn.href = cta_link(url.origin + url.pathname + iframeLink);
                // clear weird listeners
                prevBtn.parentNode.replaceChild(prevBtn.cloneNode(true), prevBtn);
            }
        });
        findChild(articleWrap, "btn_next").then((nextBtn) => {
            const url = new URL(nextBtn.href);
            const iframeLink = url.searchParams.get("iframe_url");
            if (iframeLink) {
                nextBtn.href = cta_link(url.origin + url.pathname + iframeLink);
                // clear weird listeners
                nextBtn.parentNode.replaceChild(nextBtn.cloneNode(true), nextBtn);
            }
        });
    }

    async function editCopyUrlButton(articleWrap) {
        const articleContent = await findNext(articleWrap, "ArticleContentBox");
        const buttonUrl = articleContent.querySelector("a.button_url")
        if (buttonUrl) {
            const loc = buttonUrl.ownerDocument.location;
            buttonUrl.href = loc.origin + loc.pathname;
        }
    }

    // 네이버 카페 애드온 (epcibdcgmbiimdleghmeldeopdjcaeic)
    async function editProfileCard(articleWrap) {
        const articleWriterProfile = articleWrap.querySelector(".article_writer .ArticleWriterProfile");
        const profileArea = await findNext(articleWriterProfile, "profileArea");
        for (const anchor of profileArea.querySelectorAll("li.recentArticleItem a")) {
            anchor.href = cta_link(anchor.href);
        }
        {
            const profileCardImage = profileArea.querySelector("img.profileCircle");
            const profileCardImageAnchor = document.createElement("a");
            const profileThumbAnchor = articleWrap.querySelector(".thumb_area a");
            profileCardImageAnchor.href = profileThumbAnchor.href;
            profileCardImage.parentNode.insertBefore(profileCardImageAnchor, profileCardImage);
            profileCardImageAnchor.appendChild(profileCardImage);
        }
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
    // todo /member/
}

// Utils
// from 'parent', find or observe 'className' (direct) child.
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

function findChild(parent, className) {
    return new Promise((resolve) => {
        const foundChild = parent.querySelector(`.${className}`);
        if (foundChild) {
            resolve(foundChild);
            return;
        }
        new MutationObserver((mutations, observer) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.classList?.contains(className)) {
                        resolve(node);
                        observer.disconnect();
                        return;
                    }
                }
            }
        }).observe(parent, { childList: true, subtree: true });
    });
}

function whenElementChanged(element, callback) {
    new MutationObserver((mutations, _) => {
        if (mutations.length > 0) {
            callback(element);
        }
    }).observe(element, { characterData: true, subtree: true });
}

init();
