"use strict";

class OnFoundArticle {

    /** @param {Options} options */
    static getIndex(options) {
        const optionsOnlyCafeDefaultBackground = options.cafeDefaultNewTab && options.cafeDefaultBackground;
        const optionsOptimizeCafeWhenRedirect = (options.newTabOnlyPC || options.newTabOnlyArticle) && options.optimizeCafe;
        return [
            ["app.article.base", this.base, options.newTabOnlyArticle && options.optimizeCafe],
            ["app.article.container", this.container, options.optimizeCafe],
            ["app.article.prev-next-button", this.prevNextButton, options.optimizeCafe], // async
            ["app.article.list-button", this.listButton, options.optimizeCafe],
            ["app.article.content-box", this.contentBox, options.optimizeCafe],
            ["app.article.content-link-element", this.contentLinkElement, optionsOnlyCafeDefaultBackground || optionsOptimizeCafeWhenRedirect],
            ["app.article.content-oglink-element", this.contentOglinkElement, optionsOnlyCafeDefaultBackground || optionsOptimizeCafeWhenRedirect]
        ];
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static base(/*options*/) {
        // (1) 단독 탭에서 게시글이 유효하지 않은 경우 메시지 표시하기 ..(카페 최적화로 이전글·다음글 이동할 때 등)

        // (1)
        if (this.ownerDocument === document) {
            const info = PCArticleURLParser.getInfo(location.pathname, location.search);
            if (info?.type === PCArticleURLParser.TYPE_ARTICLE_ONLY) {
                checkArticleStatus(info.cafeId, info.articleId);
            }
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static container(/*options*/) {
        // (1-1) 카페 최적화 (URL에서 oldPath 제거)
        // (1-2) 카페 최적화 (우하단 전체보기 버튼 target 수정)

        // (1-1)
        const url = new URL(this.baseURI);
        if (url.searchParams.has("oldPath")) {
            url.searchParams.delete("oldPath");
            this.ownerDocument.defaultView.history.replaceState(null, "", url);
        }

        // (1-2)
        const brBoardLink = this.querySelector(".RelatedArticles .paginate_area a.more"); // BottomRight
        if (brBoardLink?.pathname === "/ArticleList.nhn") {
            if (brBoardLink.target === "_parent" || brBoardLink.target === "_top") {
                brBoardLink.target = "_self";
            }
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static async prevNextButton(options) {
        // (1-1) 카페 최적화 (컨트롤 클릭 버그 수정, 게시글 단독 링크로 변경)
        // (1-2) 카페 최적화 (이전글·다음글 부드럽게 이동)

        // (1-1)
        // 기본 클릭 동작인 링크로 이동을 비활성화
        const url = totalLinkToIframeLink(this);
        if (url) {
            if (options.newTabOnlyArticle) {
                await articleLinkToArticleOnlyLink(this);
            }
            const span = createClickShieldBox(this);

            // (1-2) (?iframe_url= 상태면 안 된다.)
            span?.addEventListener("click", onClickPrevNextButton);
        } else {
            createClickShieldBox(this, true);
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static listButton(/*options*/) {
        // (1) 카페 최적화 (컨트롤 클릭·전체 로드 버그 수정)

        // (1)
        // 기본 클릭 동작인 링크로 이동을 비활성화
        if (this.ownerDocument === document) {
            createClickShieldBox(this); // 게시글 단독 페이지에서는 전체 링크로 가는 게 더 효율적이다.
        } else {
            const url = totalLinkToIframeLink(this);
            if (url) {
                createClickShieldBox(this);
            }
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static contentBox(/*options*/) {
        // (1-1) 카페 최적화 (URL 복사에서 컨트롤 클릭 버그 수정)
        // (1-2) 카페 최적화 (단독 게시글 페이지에서 탭 제목 수정)
        // (1-3) 카페 최적화 (좌상단 게시판 버튼 href·target 수정)

        // (1-1)
        const aCopy = this.querySelector(".ArticleTool a.button_url")
        if (aCopy) {
            createClickShieldSpan(aCopy.firstChild, true);
        }

        // (1-2)
        if (this.ownerDocument === document) {
            const articleTitle = this.querySelector(".ArticleTitle .title_text");
            if (articleTitle) {
                document.title = articleTitle.textContent + " : 네이버 카페";
            }
        }

        // (1-3)
        const tlBoardLink = this.querySelector(".ArticleTitle a.link_board"); // TopLeft
        if (tlBoardLink) {
            if (tlBoardLink.pathname === "/f-e/ArticleList.nhn") {
                tlBoardLink.pathname = "/ArticleList.nhn";
            }
            if (tlBoardLink.target === "_parent" || tlBoardLink.target === "_top") {
                tlBoardLink.target = "_self";
            }
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static contentLinkElement(options) {
        // (1) 기본 백그라운드에서 열기 ..(기본 새 탭에서 열기시)
        // (2-1) 카페 최적화 (카페 링크로 변경) ..(모바일 -> PC 사용시)
        // (2-2) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)

        // (1)
        if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {

            // 링크·내용 불일치 경고문 건드리지 않기
            if (!(isValidHttpUrl(this.textContent) && this.href !== this.textContent)) {

                // 기본 클릭 동작인 새 탭에서 열기를 비활성화
                const spanLink = createClickShieldSpan(this.firstChild);

                spanLink?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (2-1)
        if (options.newTabOnlyPC && options.optimizeCafe) {
            if (this.hostname === "m.cafe.naver.com") {
                const isLinkTextSame = this.href === this.textContent;
                const originalLink = this.href;
                let promise;
                if (options.newTabOnlyArticle) {
                    promise = mobileLinkToArticleOnlyLink(this);
                } else {
                    promise = mobileLinkToArticleLink(this);
                }
                promise?.then((url) => {
                    if (isLinkTextSame && url) {
                        this.innerHTML = this.innerHTML.replace(originalLink, url);
                    }
                });
            }
        }

        // (2-2)
        if (options.newTabOnlyArticle && options.optimizeCafe) {
            if (this.hostname === "cafe.naver.com") {
                const isLinkTextSame = this.href === this.textContent;
                const originalLink = this.href;
                articleLinkToArticleOnlyLink(this).then((url) => {
                    if (isLinkTextSame && url) {
                        this.innerHTML = this.innerHTML.replace(originalLink, url);
                    }
                });
            }
        }
    }
    // 기본적으로 새 탭에서 열린다.

    /** @this {HTMLElement}
      * @param {Options} options */
    static contentOglinkElement(options) {
        // (1) 기본 백그라운드에서 열기 ..(기본 새 탭에서 열기시)
        // (2-1) 카페 최적화 (카페 링크로 변경) ..(모바일 -> PC 사용시)
        // (2-2) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aInfo = this.querySelector("a.se-oglink-info"); // not null
        const aThumb = this.querySelector("a.se-oglink-thumbnail");

        // (1)
        if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {
            aInfo?.addEventListener("click", openInBackgroundListener);
            aThumb?.addEventListener("click", openInBackgroundListener);
        }

        // (2-1)
        if (options.newTabOnlyPC && options.optimizeCafe) {
            if (aInfo?.hostname === "m.cafe.naver.com") {
                let promise;
                if (options.newTabOnlyArticle) {
                    promise = mobileLinkToArticleOnlyLink(aInfo);
                } else {
                    promise = mobileLinkToArticleLink(aInfo);
                }
                promise?.then((url) => {
                    if (!url) {
                        return;
                    }
                    if (aThumb) {
                        aThumb.href = url;
                    }
                    const p = aInfo.querySelector("p.se-oglink-url");
                    if (p?.textContent === "m.cafe.naver.com") {
                        p.textContent = "cafe.naver.com";
                    }
                });
            }
        }

        // (2-2)
        if (options.newTabOnlyArticle && options.optimizeCafe) {
            if (aInfo?.hostname === "cafe.naver.com") {
                articleLinkToArticleOnlyLink(aInfo).then((url) => {
                    if (url && aThumb) {
                        aThumb.href = url;
                    }
                });
            }
        }
    }
    // 기본적으로 새 탭에서 열린다.
}

function isValidHttpUrl(href) {
    let url;
    try {
        url = new URL(href);
    } catch {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}

async function mobileLinkToArticleLink(a) {
    if (!a) {
        return;
    }
    const info = MobileURLParser.getInfo(a.pathname, a.search);
    if (!info) {
        return;
    }
    const url = await MobileURLParser.getArticleURL(info);
    if (!url) {
        return;
    }
    if (a.href !== url) {
        a.href = url;
    }
    return url;
}

async function mobileLinkToArticleOnlyLink(a) {
    if (!a) {
        return;
    }
    const info = MobileURLParser.getInfo(a.pathname, a.search);
    if (!info) {
        return;
    }
    const url = await MobileURLParser.getArticleOnlyURL(info);
    if (!url) {
        return;
    }
    if (a.href !== url) {
        a.href = url;
    }
    return url;
}

async function articleLinkToArticleOnlyLink(a) {
    if (!a) {
        return;
    }
    const info = PCArticleURLParser.getInfo(a.pathname, a.search);
    if (!info) {
        return;
    }
    const url = await PCArticleURLParser.getArticleOnlyURL(info);
    if (!url) {
        return;
    }
    if (a.href !== url) {
        a.href = url;
    }
    return url;
}

function totalLinkToIframeLink(a) {
    if (!a) {
        return;
    }
    const searchParams = new URLSearchParams(a.search);
    const url = getIframeUrlFromSearchParams(searchParams);
    if (!url) {
        return;
    }
    if (a.href !== url) {
        a.href = url;
    }
    return url;
}

async function onClickPrevNextButton(event) {
    if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
        return;
    }
    const a = this.parentElement;
    if (!a || a.tagName !== "A") {
        return;
    }
    event.preventDefault();
    const win = this.ownerDocument.defaultView;
    const currentInfo = PCArticleURLParser.getInfo(win.location.pathname, win.location.search);
    const linkInfo = PCArticleURLParser.getInfo(a.pathname, a.search);
    if (!currentInfo || !linkInfo || currentInfo.articleId === linkInfo.articleId) {
        return;
    }
    const linkUrl = await PCArticleURLParser.getArticleOnlyURL(linkInfo);
    win.history.pushState(null, "", linkUrl);
    win.dispatchEvent(new PopStateEvent("popstate"));
}
