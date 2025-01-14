"use strict";

// 트리에서 해당하는 요소가 있으면 리졸브하고, 없으면 기다렸다가 리졸브한다.
// subtree 가 true 면 자손 중에서, false 면 자식 중에서 검색한다.
// condition: (el) => boolean 이 주어지면, true 가 나올 때까지 계속 탐색한다.
async function watchSelector(parent, selectors, subtree = false, condition) {
    return new Promise((resolve) => {
        const found = parent.querySelector((subtree ? "" : ":scope > ") + selectors);
        if (found) {
            if (!condition || condition(found)) {
                return resolve(found);
            }
        }

        new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches(selectors)) {
                        if (!condition || condition(node)) {
                            resolve(node);
                            observer.disconnect();
                            return;
                        }
                    }
                }
            }
        }).observe(parent, { childList: true, subtree });
    });
}

// 자식 중에서 해당하는 요소가 나타날 때마다 콜백을 호출한다.
// 해당하는 요소가 이미 존재한다면 바로 한 번 호출한다.
// callback: (foundElement) => any
function watchingChild(parent, selectors, callback) {
    new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && node.matches(selectors)) {
                    callback(node);
                }
            }
        }
    }).observe(parent, { childList: true });

    const found = parent.querySelector(":scope > " + selectors);
    if (found) {
        callback(found);
    }
}

// 로딩 속도가 느리면 비어있는 임시 app 이 먼저 찾아질 수 있다.
async function getApp(doc) {
    return watchSelector(doc.body, "#app", false, el => el.firstChild !== null);
}

function getMTPUrlFromUrl(url) {
    const mInfo = getMobileUrlInfo(url);
    if (mInfo) {
        return getMTPUrl(mInfo);
    }
}

async function getPTAUrlFromUrl(url) {
    const pInfo = getUrlInfo(url);
    if (pInfo) {
        return await getPTAUrl(pInfo);
    }
}

function searchParamSet(url, param, value) {
    url = new URL(url);
    url.searchParams.set(param, value);
    return url.href;
}

function createClickShield(a, mod) {
    if (a?.classList.contains("NCOP_CSR")) { // Click Shield Relative
        return;
    }
    a.classList.add("NCOP_CSR");
    const span = a.ownerDocument.createElement("span");
    span.classList.add("NCOP_CSA"); // Click Shield Alsolute
    span.addEventListener("click", (event) => {
        if (mod && !(event.ctrlKey || event.shiftKey)) {
            return;
        }
        event.stopPropagation();
    });
    a.appendChild(span);
}

function makeClickShield(node, mod) {
    let span;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
        span = node;
    }
    if (node.nodeType === Node.TEXT_NODE) {
        span = node.ownerDocument.createElement("span");
        node.parentNode.insertBefore(span, node);
        span.appendChild(node);
    }
    if (span?.classList.contains("NCOP_CSS")) { // Click Shield Span
        return;
    }
    span.classList.add("NCOP_CSS");
    span.addEventListener("click", (event) => {
        if (mod && !(event.ctrlKey || event.shiftKey)) {
            return;
        }
        event.stopPropagation();
    });
}

function DEF_cleanUpUrl(doc) {
    try {
        if (doc === document) {
            return;
        }

        if (!g_cafeName) {
            return;
        }

        const url = new URL(doc.URL);
        const info = getUrlInfo(url); // nullable
        const cUrl = getCleanUrl(info);
        if (!cUrl) {
            return;
        }

        if (location.href !== cUrl) {
            history.replaceState(null, "", cUrl);
        }

        function getCleanUrl(info) {
            switch (info?.type) {
                default:         // { type: ? }
                case "home-nhn": // { type: "home-nhn", cafeId }
                    return `https://cafe.naver.com/${g_cafeName}`;

                case "article-nhn": // { type: "article-nhn", cafeId, articleId, search }
                case "article-top": // { type: "article-top", cafeId, articleId, search }
                    return `https://cafe.naver.com/${g_cafeName}/${info.articleId}`;

                case "popular-top":  // { type: "popular-top", cafeId, tab }
                case "board-nhn":    // { type: "board-nhn", cafeId, menuId, search }
                case "search-nhn":   // { type: "search-nhn", cafeId }
                case "member-top": { // { type: "member-top", cafeId, memberCode, tab }
                    const iframeUrl = encodeURIComponent(url.pathname + url.search);
                    return `https://cafe.naver.com/${g_cafeName}?iframe_url_utf8=${iframeUrl}`;
                }
            }
        }
    } catch (e) { console.error(e); }
}
