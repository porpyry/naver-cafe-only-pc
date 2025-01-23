"use strict";

class OnFoundDocument {

    /** @param {Options} options */
    static getIndex(options) {
        return [
            ["cafe.document", /*          */ this.cafeDocument, /*        */ options.pageArrowShortcut || options.searchCommentShortcut || options.optimizeCafe],
            ["iframe.document", /*        */ this.iframeDocument, /*      */ options.pageArrowShortcut || options.searchCommentShortcut || options.optimizeCafe],
            ["only.document", /*          */ this.onlyDocument, /*        */ options.pageArrowShortcut || options.searchCommentShortcut],
            ["app.document", /*           */ this.appDocument, /*         */ options.pageArrowShortcut || options.searchCommentShortcut],
            ["article-list.document", /*  */ this.articleListDocument, /* */ options.pageArrowShortcut || options.searchCommentShortcut],
            ["article-search-list.document", this.articleSearchListDocument, options.pageArrowShortcut || options.searchCommentShortcut],
            ["app.changed.document", /*   */ this.appChangedDocument, /*  */ options.optimizeCafe]
        ];
    }

    /** @this {Document}
      * @param {Options} options */
    static cafeDocument(options) {
        // (1) 단축키: 페이지 넘기기
        // (2) 단축키: 검색창·댓글창 포커스
        // (3-1) 카페 최적화 (상단 새글 링크 수정 및 컨트롤 클릭 버그 수정)
        // (3-2) 카페 최적화 (네이버 카페 애드온v1.5.1의 URL 버그 수정)

        // (1)
        if (options.pageArrowShortcut) {
            this.addEventListener("keyup", (event) => {
                const iframe = document.querySelector("iframe#cafe_main");
                if (isIframeDocumentLoaded(iframe)) {
                    const bound = dispatchInputSafeArrowKeyUpEvent.bind(iframe.contentDocument);
                    bound(event);
                }
            });
        }

        // (2)
        if (options.searchCommentShortcut) {
            this.addEventListener("keyup", dispatchInputSafeBackspaceKeyUpEvent); // iframe이 로드되기 전까지 사용할 리스너
            this.addEventListener("keyup", (event) => {
                const iframe = document.querySelector("iframe#cafe_main");
                if (isIframeDocumentLoaded(iframe)) {
                    const bound = dispatchInputSafeBackspaceKeyUpEvent.bind(iframe.contentDocument);
                    bound(event);
                }
            });
            this.addEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpInCafe);
        }

        if (options.optimizeCafe) {
            // (3-1)
            const a = document.querySelector("#button_mynews_alarm a.link_chatting");
            if (a?.href === location.href + "#") {
                a.href = "https://section.cafe.naver.com/ca-fe/home/feed";
            }
            createClickShieldSpan(a?.firstChild, true);

            // (3-2)
            const iframe = document.querySelector("iframe#cafe_main");
            if (iframe) {
                iframeURLChange(iframe, (href) => {
                    const url = new URL(href);
                    cleanUpUrlForRefresh(url.pathname, url.search);
                });
            }
        }
    }

    /** @this {Document}
      * @param {Options} options */
    static iframeDocument(options) {
        // (1) 단축키: 페이지 넘기기
        // (2) 단축키: 검색창·댓글창 포커스
        // (3) 카페 최적화 (새로고침 가능하도록 URL 변경)

        // (1)
        if (options.pageArrowShortcut) {
            this.addEventListener("keyup", dispatchInputSafeArrowKeyUpEvent);
        }

        // (2)
        if (options.searchCommentShortcut) {
            document.removeEventListener("keyup", dispatchInputSafeBackspaceKeyUpEvent);
            this.addEventListener("keyup", dispatchInputSafeBackspaceKeyUpEvent);
            this.addEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpInIframe); // 다른 맥락에서 사용된다면 제거될 리스너
        }

        // (3)
        if (options.optimizeCafe) {
            setTimeout(() => {
                cleanUpUrlForRefresh(this.location.pathname, this.location.search);
            }, 1); // 타 확장과 충돌 방지
        }
    }

    /** @this {Document}
      * @param {Options} options */
    static onlyDocument(options) {
        // (1) 단축키: 페이지 넘기기
        // (2) 단축키: 검색창·댓글창 포커스

        // (1)
        if (options.pageArrowShortcut) {
            this.addEventListener("keyup", dispatchInputSafeArrowKeyUpEvent);
        }

        // (2)
        if (options.searchCommentShortcut) {
            this.addEventListener("keyup", dispatchInputSafeBackspaceKeyUpEvent);
        }
    }

    /** @this {Document}
      * @param {Options} options */
    static appDocument(options) {
        // (1) 단축키: 페이지 넘기기
        // (2) 단축키: 검색창·댓글창 포커스

        // (1)
        if (options.pageArrowShortcut) {
            this.addEventListener("inputsafearrowkeyup", onInputSafeArrowKeyUpInApp);
        }

        // (2)
        if (options.searchCommentShortcut) {
            this.removeEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpInIframe);
            this.addEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpInApp);
        }
    }

    /** @this {Document}
      * @param {Options} options */
    static articleListDocument(options) {
        // (1) 단축키: 페이지 넘기기
        // (2) 단축키: 검색창·댓글창 포커스

        // (1)
        if (options.pageArrowShortcut) {
            this.addEventListener("inputsafearrowkeyup", onInputSafeArrowKeyUpMovePage);
        }

        // (2)
        if (options.searchCommentShortcut) {
            this.removeEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpInIframe);
            this.addEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpFocusSearch);
        }
    }

    /** @this {Document}
      * @param {Options} options */
    static articleSearchListDocument(options) {
        // (1) 단축키: 페이지 넘기기
        // (2) 단축키: 검색창·댓글창 포커스

        // (1)
        if (options.pageArrowShortcut) {
            this.addEventListener("inputsafearrowkeyup", onInputSafeArrowKeyUpMovePage);
        }

        // (2)
        if (options.searchCommentShortcut) {
            this.removeEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpInIframe);
            this.addEventListener("inputsafebackspacekeyup", onInputSafeBackspaceKeyUpFocusSearch);
        }
    }

    /** @this {Document}
      * @param {Options} options */
    static appChangedDocument(/*options*/) {
        // (1) 카페 최적화 (새로고침 가능하도록 URL 변경)

        // (1)
        cleanUpUrlForRefresh(this.location.pathname, this.location.search);
    }
}

function acceptsKeyboardInput(element) {
    const nonTypingInputTypes = new Set(["checkbox", "radio", "button", "reset", "submit", "file"]);
    return ((element.tagName === "INPUT" && !nonTypingInputTypes.has(element.type))
        || element.tagName === "TEXTAREA"
        || element.tagName === "SELECT"
        || element.isContentEditable);
}

function isInputSafeKeyEvent(event) {
    if (!event.isTrusted) {
        return false;
    }
    if (acceptsKeyboardInput(event.target)) {
        return false;
    }
    if (event.target.closest(".pzp")) {
        return false;
    }
    return true;
}

function dispatchInputSafeArrowKeyUpEvent(event) {
    if (event.altKey || event.ctrlKey || event.shiftKey) {
        return;
    }
    let direction;
    switch (event.code) {
        case "ArrowLeft":
            direction = -1;
            break;
        case "ArrowRight":
            direction = 1;
            break;
    }
    if (direction === undefined) {
        return;
    }
    if (!isInputSafeKeyEvent(event)) {
        return;
    }
    this.dispatchEvent(new CustomEvent("inputsafearrowkeyup", { detail: { direction } }));
}

function getAppPageState(doc) {
    if (doc.querySelector("#app > .Article")) {
        return "article";
    } else if (doc.querySelector("#app > section")) {
        return "popular";
    } else if (doc.querySelector("#app > .MemberProfile")) {
        return "member";
    }
}

function onInputSafeArrowKeyUpMovePage(event) {
    try {
        const direction = event.detail.direction;
        const searchParams = new URLSearchParams(this.location.search);
        let currentPage = searchParams.get("search.page");
        if (!currentPage) {
            currentPage = "1";
        }
        currentPage = parseInt(currentPage);
        let nextPage = currentPage + direction;
        if (nextPage < 1) {
            nextPage = 1;
        }
        if (direction === 1) {
            const pageBtns = this.querySelectorAll(".prev-next > a");
            const lastPageBtn = pageBtns[pageBtns.length - 1];
            const lastPageBtnSearchParams = new URLSearchParams(lastPageBtn.href);
            const lastPage = lastPageBtnSearchParams.get("search.page");
            if (parseInt(lastPage) < nextPage) {
                nextPage -= 1;
            }
        }
        if (currentPage === nextPage) {
            return;
        }
        searchParams.set("search.page", nextPage);
        this.location.search = "?" + searchParams.toString();
    } catch (e) { console.error(e); }
}

function onInputSafeArrowKeyUpInApp(event) {
    const direction = event.detail.direction;
    const appPageState = getAppPageState(this);
    switch (appPageState) {
        case "article":
            return onInputSafeArrowKeyUpInArticle(this, direction);
        case "popular":
            return onInputSafeArrowKeyUpInPopular(this, direction);
        case "member":
            return onInputSafeArrowKeyUpInMember(this, direction);
    }
}

function onInputSafeArrowKeyUpInArticle(doc, direction) {
    try {
        // .ArticleTopBtns > .right_area -> a.btn_prev (이전글)
        // .ArticleTopBtns > .right_area -> a.btn_next (다음글)
        if (direction === 1) {
            const nextBtn = doc.querySelector(".ArticleTopBtns > .right_area > a.btn_next");
            return nextBtn?.click();
        } else {
            const prevBtn = doc.querySelector(".ArticleTopBtns > .right_area > a.btn_prev");
            return prevBtn?.click();
        }
    } catch (e) { console.error(e); }
}

function onInputSafeArrowKeyUpInPopular(doc, direction) {
    try {
        // section div .BoardBottomOption .paginate_area .ArticlePaginate (button.type_prev | button.number "NUMBER" | button.type_next)
        const pageBtns = doc.querySelectorAll(".ArticlePaginate button.number");
        if (pageBtns.length === 0) {
            return;
        }
        let currentPage;
        for (const pageBtn of pageBtns) {
            if (pageBtn.ariaCurrent) {
                currentPage = parseInt(pageBtn.textContent);
                break;
            }
        }
        if (currentPage === undefined) {
            return;
        }
        const nextPage = currentPage + direction;
        if (direction === 1) {
            const lastPageBtn = pageBtns[pageBtns.length - 1];
            const lastPage = parseInt(lastPageBtn.textContent);
            if (lastPage < nextPage) {
                const nextPageBtn = doc.querySelector(".ArticlePaginate button.type_next");
                if (nextPageBtn) {
                    return nextPageBtn.click();
                } else {
                    return;
                }
            }
        } else {
            const firstPageBtn = pageBtns[0];
            const firstPage = parseInt(firstPageBtn.textContent);
            if (nextPage < firstPage) {
                const prevPageBtn = doc.querySelector(".ArticlePaginate button.type_prev");
                if (prevPageBtn) {
                    return prevPageBtn.click();
                } else {
                    return;
                }
            }
        }
        for (const pageBtn of pageBtns) {
            if (parseInt(pageBtn.textContent) === nextPage) {
                return pageBtn.click();
            }
        }
    } catch (e) { console.error(e); }
}

function onInputSafeArrowKeyUpInMember(doc, direction) {
    try {
        // 댓글단 글 .MemberProfile .like_paginate_area .paginage_no_number (button.page_prev | button.page_next)
        // 좋아요한 글 .MemberProfile .like_paginate_area .paginage_number (button.page_prev | button.page_next)
        const prevPageBtn = doc.querySelector(".like_paginate_area button.page_prev");
        const nextPageBtn = doc.querySelector(".like_paginate_area button.page_next");
        if (prevPageBtn && nextPageBtn) {
            if (direction === 1) {
                return nextPageBtn.click();
            } else {
                return prevPageBtn.click();
            }
        }
        // .MemberProfile .paginage_area .ArticlePaginate (button.type_prev | button.number "NUMBER" | button.type_next)
        const pageBtns = doc.querySelectorAll(".ArticlePaginate button.number");
        if (pageBtns.length === 0) {
            return;
        }
        let currentPage;
        for (const pageBtn of pageBtns) {
            if (pageBtn.ariaCurrent) {
                currentPage = parseInt(pageBtn.textContent);
                break;
            }
        }
        if (currentPage === undefined) {
            return;
        }
        const nextPage = currentPage + direction;
        if (direction === 1) {
            const lastPageBtn = pageBtns[pageBtns.length - 1];
            const lastPage = parseInt(lastPageBtn.textContent);
            if (lastPage < nextPage) {
                const nextPageBtn = doc.querySelector(".ArticlePaginate button.type_next");
                if (nextPageBtn) {
                    return nextPageBtn.click();
                } else {
                    return;
                }
            }
        } else {
            const firstPageBtn = pageBtns[0];
            const firstPage = parseInt(firstPageBtn.textContent);
            if (nextPage < firstPage) {
                const prevPageBtn = doc.querySelector(".ArticlePaginate button.type_prev");
                if (prevPageBtn) {
                    return prevPageBtn.click();
                } else {
                    return;
                }
            }
        }
        for (const pageBtn of pageBtns) {
            if (parseInt(pageBtn.textContent) === nextPage) {
                return pageBtn.click();
            }
        }
    } catch (e) { console.error(e); }
}

function dispatchInputSafeBackspaceKeyUpEvent(event) {
    if (event.altKey || event.ctrlKey || event.shiftKey) {
        return;
    }
    if (event.code !== "Backspace") {
        return;
    }
    if (!isInputSafeKeyEvent(event)) {
        return;
    }
    this.dispatchEvent(new Event("inputsafebackspacekeyup"));
}

function onInputSafeBackspaceKeyUpInCafe(/*event*/) {
    // #cafe-body-skin #cafe-body #info-search form input#topLayerQueryInput
    const input = this.querySelector("input#topLayerQueryInput");
    input?.focus();
}

function onInputSafeBackspaceKeyUpInIframe(/*event*/) {
    // cafe.document로 이벤트를 돌려보냄
    document.dispatchEvent(new Event("inputsafebackspacekeyup"));
}

function onInputSafeBackspaceKeyUpInApp(/*event*/) {
    const appPageState = getAppPageState(this);
    if (appPageState === "article") {
        // #app .Article .ArticleContainerWrap .ArticleContentBox .article_container .CommentBox .CommentWriter .comment_inbox textarea
        const input = this.querySelector(".CommentWriter textarea");
        input?.focus();
    } else {
        // article이 아니라면 cafe.document로 이벤트를 돌려보냄
        document.dispatchEvent(new Event("inputsafebackspacekeyup"));
    }
}

function onInputSafeBackspaceKeyUpFocusSearch(/*event*/) {
    // #content-area #main-area .list-search form .input_search_area .input_component input#query
    const input = this.querySelector("input#query");
    if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length)
    }
    // 상단 검색창은 #content-area #main-area .search_result .search_input form .input_search_area .input_component input#queryTop
}

// https://gist.github.com/hdodov/a87c097216718655ead6cf2969b0dcfa
function iframeURLChange(iframe, callback) {
    var lastDispatched = null;
    var dispatchChange = function () {
        var newHref = iframe.contentWindow.location.href;
        if (newHref !== lastDispatched) {
            callback(newHref);
            lastDispatched = newHref;
        }
    };
    var unloadHandler = function () {
        setTimeout(dispatchChange, 10);
    };
    function attachUnload() {
        iframe.contentWindow.removeEventListener("unload", unloadHandler);
        iframe.contentWindow.addEventListener("unload", unloadHandler);
    }
    iframe.addEventListener("load", function () {
        attachUnload();
        dispatchChange();
    });
    attachUnload();
}
