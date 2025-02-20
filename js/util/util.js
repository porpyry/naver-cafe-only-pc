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
            // 이거 지우면 형이봤이랑 충돌함
            // searchParams.delete("clubid");
            // searchParams.delete("articleid");
            const newSearch = searchParams.size > 0 ? "?" + searchParams.toString() : "";
            a.href = `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${newSearch}`;
        }
    }
}

async function cleanUpUrlForRefresh(pathname, search) {
    const info = PCURLParser.getIframeUrlInfo(pathname, search);
    if (!info) {
        return;
    }
    let url;
    switch (info.type) {
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
                    url = getCafeIframeUrl(cafeName, pathname, search);
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
    const pageStatus = await getArticleStatus(cafeId, articleId);
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

async function getArticleStatus(cafeId, articleId) {
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
    const div = document.createElement("div");
    div.classList.add("NCOP_WARN1");
    div.innerHTML = `<p>${msg}</p><br><a href="${linkUrl}" style="all: revert;">${linkText}</a>`;
    app.insertBefore(div, app.firstChild);
    window.addEventListener("popstate", () => {
        div.remove();
    }, { once: true });
}

// 유효한 페이지인지 체크하기
async function checkPageValidity(doc) {
    await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 기다린 후 로딩 여부 확인
    if (doc.readyState !== "complete") {
        checkPageValidity(doc);
        return;
    }
    let app = doc.querySelector("body > #app");
    if (!app) {
        try {
            const res = await fetch(doc.location.href, { method: "HEAD" });
            if (res?.status === 404) {
                pageNotFound(doc, true);
            }
        } catch (e) { console.error(e); }
    } else if (app.firstElementChild === null) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3초 추가 대기
        app = doc.querySelector("body > #app");
        if (app && app.firstElementChild === null) {
            pageNotFound(doc, false);
        }
    }
}

async function pageNotFound(doc, is404) {
    const info = PCArticleURLParser.getInfo(doc.location.pathname, doc.location.search);
    let url;
    if (info) {
        const { cafeId, articleId } = info;
        if (cafeId) {
            const cafeName = await SessionCafeInfo.getCafeName(cafeId);
            if (cafeName && articleId) {
                url = `https://cafe.naver.com/${cafeName}/${articleId}`;
            }
        }
    }
    const div = doc.createElement("div");
    div.classList.add("NCOP_WARN2");
    if (is404) {
        div.innerHTML = "<p>페이지를 찾을 수 없습니다.</p><br>";
    } else {
        div.innerHTML = "<p>잠시만 기다려주세요...</p><br>";
    }
    if (url) {
        div.innerHTML += `<p><a href="${url}" target="_top" style="all: revert;">카페로 이동</a></p><br>`;
    }
    const a = doc.createElement("a");
    a.href = "#";
    a.textContent = "[네이버 카페 Easy PC] 확장 기능 비활성화하기";
    a.style.all = "revert";
    a.addEventListener("click", async () => {
        const options = await Options.get();
        options.newTabOnlyArticle = false;
        options.smoothPrevNext = false;
        await options.save();
        a.textContent = "비활성화 완료되었습니다.";
    });
    div.appendChild(a);
    doc.body.appendChild(div);
}

function createBackToOriginalButton() {
    if (document.querySelector("button.NCOP_BTO")) {
        return;
    }
    const button = document.createElement("button");
    button.classList.add("NCOP_BTO");
    button.title = "구버전 카페로 새로고침\n(네이버 카페 easy PC 확장 임시 기능입니다.)";
    button.addEventListener("click", onClickBackToOriginalButton);
    button.innerHTML = `<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	width="40px" height="40px" viewBox="-10 -10 114.073 114.072" xml:space="preserve">
<g fill="currentcolor" stroke="black" stroke-width="3.5">
	<g>
		<path d="M91.465,5.491c-0.748-0.311-1.609-0.139-2.18,0.434l-8.316,8.316C72.046,5.057,60.125,0,47.399,0
			c-2.692,0-5.407,0.235-8.068,0.697C21.218,3.845,6.542,17.405,1.944,35.244c-0.155,0.599-0.023,1.235,0.355,1.724
			c0.379,0.489,0.962,0.775,1.581,0.775h12.738c0.839,0,1.59-0.524,1.878-1.313c3.729-10.193,12.992-17.971,23.598-19.814
			c1.747-0.303,3.525-0.456,5.288-0.456c8.428,0,16.299,3.374,22.168,9.5l-8.445,8.444c-0.571,0.572-0.742,1.432-0.434,2.179
			c0.311,0.748,1.039,1.235,1.848,1.235h28.181c1.104,0,2-0.896,2-2V7.338C92.7,6.53,92.211,5.801,91.465,5.491z"/>
		<path d="M90.192,56.328H77.455c-0.839,0-1.59,0.523-1.878,1.312c-3.729,10.193-12.992,17.972-23.598,19.814
			c-1.748,0.303-3.525,0.456-5.288,0.456c-8.428,0-16.3-3.374-22.168-9.5l8.444-8.444c0.572-0.572,0.743-1.432,0.434-2.179
			c-0.31-0.748-1.039-1.235-1.848-1.235H3.374c-1.104,0-2,0.896-2,2v28.181c0,0.809,0.487,1.538,1.235,1.848
			c0.746,0.31,1.607,0.138,2.179-0.435l8.316-8.315c8.922,9.183,20.843,14.241,33.569,14.241c2.693,0,5.408-0.235,8.069-0.697
			c18.112-3.146,32.789-16.708,37.387-34.547c0.155-0.6,0.023-1.234-0.354-1.725C91.395,56.615,90.811,56.328,90.192,56.328z"/>
	</g>
</g>
</svg>`; // www.svgrepo.com
    document.body.prepend(button); // document.body.appendChild(a); // bug (not loading)
}

async function onClickBackToOriginalButton(/*event*/) {
    const iframe = document.querySelector("iframe#cafe_main");
    const infoFE = PCURLParserFE.getInfo(location.pathname, location.search);
    if (isIframeDocumentLoaded(iframe)) {
        const loc = iframe.contentWindow.location;
        const iframeInfoFE = PCURLParserFE.getInfo(loc.pathname, loc.search);
        if (iframeInfoFE?.type === PCURLParserFE.TYPE_MENU) {
            // 비정상적인 경우 (기존 카페인데 리뉴얼의 메뉴가 iframe에 들어감)
            loc.assign("/ArticleList.nhn" + iframeInfoFE.search);
            this.remove();
            return;
        }
        // 리뉴얼 카페의 메뉴를 제외한 상황
        if (infoFE) {
            // f-e 주소가 정상적으로 읽힌 경우 -> 적합한 주소로 리다이렉트
            let cafeName = infoFE.cafeName;
            if (!cafeName && infoFE.cafeId) {
                cafeName = await SessionCafeInfo.getCafeName(infoFE.cafeId);
            }
            if (cafeName) {
                const url = getCafeIframeUrl(cafeName, loc.pathname, loc.search);
                if (url) {
                    location.assign(url);
                    this.remove();
                    return;
                }
            }
        } else if (location.pathname.startsWith("/f-e")) {
            // f-e 주소이지만 정상적으로 읽히지 않은 경우 (확장 충돌) -> iframe에서 정보를 찾음
            const iframeInfo = PCURLParser.getIframeUrlInfo(loc.pathname, loc.search);
            if (iframeInfo?.cafeId) {
                const cafeName = await SessionCafeInfo.getCafeName(iframeInfo.cafeId);
                if (cafeName) {
                    const url = getCafeIframeUrl(cafeName, loc.pathname, loc.search);
                    if (url) {
                        location.assign(url);
                        this.remove();
                        return;
                    }
                }
            }
        }
    }
    if (!iframe && infoFE?.type === PCURLParserFE.TYPE_MENU) {
        // 리뉴얼 카페의 메뉴
        const cafeName = await SessionCafeInfo.getCafeName(infoFE.cafeId);
        if (cafeName) {
            const url = getCafeIframeUrl(cafeName, "/ArticleList.nhn", infoFE.search);
            if (url) {
                location.assign(url);
                this.remove();
                return;
            }
        }
    }
}

function getCafeIframeUrl(cafeName, pathname, search) {
    const iframeUrl = (pathname + search).replaceAll("&", "%26").replaceAll("#", "%23");
    return `https://cafe.naver.com/${cafeName}?iframe_url=${iframeUrl}`; // or iframe_url_utf8=encodeURIComponent(pathname + search)
}
