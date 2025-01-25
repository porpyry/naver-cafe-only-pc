"use strict";

/** @this {HTMLElement} */
function openInBackgroundListener(event) {
    if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
        return;
    }
    let url;
    switch (this.tagName) {
        case "A":
            url = this.href;
            break;
        case "SPAN":
            if (this.parentElement.tagName !== "A") {
                return;
            }
            url = this.parentElement.href;
            break;
        default:
            return;
    }
    event.preventDefault();
    chrome.runtime.sendMessage(null, { type: "cafeDefaultBackground", url });
}

function createClickShieldBox(a, passDefault) {
    if (!a) {
        return;
    }
    if (a.classList.contains("NCOP_CSR")) { // Click Shield Relative
        return a.querySelector("span.NCOP_CSA");
    }
    a.classList.add("NCOP_CSR");
    const span = a.ownerDocument.createElement("span");
    span.classList.add("NCOP_CSA"); // Click Shield Absolute
    span.addEventListener("click", (event) => {
        if (passDefault && !(event.altKey || event.ctrlKey || event.shiftKey || event.metaKey)) {
            return;
        }
        event.stopPropagation();
    });
    a.appendChild(span);
    return span;
}

function createClickShieldSpan(spanOrText, passDefault) {
    if (!spanOrText) {
        return;
    }
    let span;
    if (spanOrText.nodeType === Node.ELEMENT_NODE && spanOrText.tagName === "SPAN") {
        span = spanOrText;
    } else if (spanOrText.nodeType === Node.TEXT_NODE) {
        span = spanOrText.ownerDocument.createElement("span");
        spanOrText.parentNode.insertBefore(span, spanOrText);
        span.appendChild(spanOrText);
    } else {
        return;
    }
    if (span.classList.contains("NCOP_CSS")) { // Click Shield Span
        return span;
    }
    span.classList.add("NCOP_CSS");
    span.addEventListener("click", (event) => {
        if (passDefault && !(event.altKey || event.ctrlKey || event.shiftKey || event.metaKey)) {
            return;
        }
        event.stopPropagation();
    });
    return span;
}

function setSearchParam(url, param, value) {
    url = new URL(url);
    url.searchParams.set(param, value);
    return url.href;
}

function setCommentFocused(url) {
    return setSearchParam(url, "commentFocus", true);
}

function groupChildrenWithSpan(parent) {
    if (!parent) {
        return;
    }
    let span = parent.querySelector("span.NCOP_GroupSpan");
    if (span) {
        return span;
    }
    span = parent.ownerDocument.createElement("span");
    span.classList.add("NCOP_GroupSpan");
    span.append(...parent.childNodes);
    parent.appendChild(span);
    return span;
}

function isIframeDocumentLoaded(iframe) {
    return iframe
        && iframe.contentDocument?.readyState === "complete"
        && iframe.contentWindow.location?.hostname;
}

function replaceHrefToArticleOnly(a) {
    if (!a) {
        return;
    }
    const matches = a.pathname.match(PCArticleURLParser.RE_ARTICLE_NHN);
    if (matches) {
        const searchParams = new URLSearchParams(a.search);
        const cafeId = searchParams.get("clubid");
        const articleId = searchParams.get("articleid");
        if (cafeId && articleId) {
            searchParams.delete("clubid");
            searchParams.delete("articleid");
            const newSearch = searchParams.size > 0 ? "?" + searchParams.toString() : "";
            a.href = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${newSearch}`;
        }
    }
}

async function cleanUpUrlForRefresh(pathname, search) {
    let url;
    const info = PCURLParser.getIframeUrlInfo(pathname, search);
    switch (info?.type) {
        case "cafe-intro":
            {
                const cafeName = await SessionCafeInfo.getCafeName(info.cafeId);
                if (cafeName) {
                    url = `https://cafe.naver.com/${cafeName}`;
                }
            } break;
        case "app.article":
            {
                const cafeName = await SessionCafeInfo.getCafeName(info.cafeId);
                if (cafeName) {
                    url = `https://cafe.naver.com/${cafeName}/${info.articleId}`;
                }
            } break;
        default:
            {
                let cafeName;
                if (info.cafeId) {
                    cafeName = await SessionCafeInfo.getCafeName(info.cafeId);
                } else {
                    cafeName = tryFindCafeNameFromUrl();
                }
                if (cafeName) {
                    const iframeUrl = (pathname + search).replaceAll("&", "%26").replaceAll("#", "%23");
                    url = `https://cafe.naver.com/${cafeName}?iframe_url=${iframeUrl}`; // or iframe_url_utf8=encodeURIComponent(pathname + search)
                }
            } break;
    }
    if (url && location.href !== url) {
        history.replaceState(null, "", url);
    }
}

function tryFindCafeNameFromUrl() {
    const matches = location.pathname.match(/^\/(?<cafeName>\w+)(\/|\.cafe)?$/);
    if (matches) {
        const { cafeName } = matches.groups;
        return cafeName;
    }
}

function preventDefaultFunction(event) {
    event.preventDefault();
}

// 게시글 단독 페이지일 때만 실행시킬 것
async function checkArticleStatus(cafeId, articleId) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 기다린 후 로딩 여부 확인
    if (document.querySelector(".ArticleContainerWrap")) {
        return;
    }
    const pageStatus = await getPageStatus(cafeId, articleId);
    if (!pageStatus || pageStatus === 200) {
        return;
    }
    let cafeName;
    switch (pageStatus) {
        case 401: // no-login
            cafeName = await SessionCafeInfo.getCafeName(cafeId);
            appWriteMessage("로그인이 필요합니다.", `https://cafe.naver.com/${cafeName}/${articleId}`, "로그인하러 가기");
            break;
        case 404: // no-article
            cafeName = await SessionCafeInfo.getCafeName(cafeId);
            appWriteMessage("없는 게시글입니다.", `https://cafe.naver.com/${cafeName}`, "홈으로 가기");
            break;
    }
}

async function getPageStatus(cafeId, articleId) {
    try {
        const url = `https://apis.naver.com/cafe-web/cafe-articleapi/v3/cafes/${cafeId}/articles/${articleId}?query=&useCafeId=true&requestFrom=A`;
        const res = await fetch(url, { method: "HEAD", credentials: "include" });
        return res?.status; // 200: ok, 401: no-login, 404: no-article
    } catch (e) { console.error(e); }
}

function appWriteMessage(msg, linkUrl, linkText) {
    const app = document.querySelector("#app");
    if (!app) {
        return;
    }
    const divMsg = document.createElement("div");
    divMsg.innerHTML = `<p>${msg}</p><br><a href="${linkUrl}" style="all: revert;">${linkText}</a>`;
    app.insertBefore(divMsg, app.firstChild);
    window.addEventListener("popstate", () => {
        divMsg.remove();
    }, { once: true });
}
