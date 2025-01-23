"use strict";

class OnFoundArticle {

    /** @param {Options} options */
    static getIndex(options) {
        const optionsOnlyCafeDefaultBackground = options.cafeDefaultNewTab && options.cafeDefaultBackground;
        const optionsOptimizeCafeWhenRedirect = (options.newTabRedirectMobile || options.newTabRedirectArticle) && options.optimizeCafe;
        return [
            ["app.article.container", this.container, options.optimizeCafe],
            ["app.article.prev-button", this.prevButton, options.optimizeCafe],
            ["app.article.next-button", this.nextButton, options.optimizeCafe],
            ["app.article.list-button", this.listButton, options.optimizeCafe],
            ["app.article.content-link-element", this.contentLinkElement, optionsOnlyCafeDefaultBackground || optionsOptimizeCafeWhenRedirect],
            ["app.article.content-oglink-element", this.contentOglinkElement, optionsOnlyCafeDefaultBackground || optionsOptimizeCafeWhenRedirect]
        ];
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static container(/*options*/) {
        // (1-1) 카페 최적화 (URL에서 oldPath 제거)
        // (1-2) 카페 최적화 (URL 복사에서 컨트롤 클릭 버그 수정)
        // (1-3) 카페 최적화 (우하단 전체보기 버튼 target 수정)
        // (1-4) 카페 최적화 (단독 게시글 페이지에서 탭 제목 수정)
        // (1-5) 카페 최적화 (좌상단 게시판 버튼 href·target 수정)

        // (1-1)
        const url = new URL(this.baseURI);
        if (url.searchParams.has("oldPath")) {
            url.searchParams.delete("oldPath");
            this.ownerDocument.defaultView.history.replaceState(null, "", url);
        }

        // (1-2)
        const aCopy = this.querySelector(".ArticleTool a.button_url")
        if (aCopy) {
            createClickShieldSpan(aCopy.firstChild, true);
        }

        // (1-3)
        const brBoardLink = this.querySelector(".RelatedArticles .paginate_area a.more"); // BottomRight
        if (brBoardLink.pathname === "/ArticleList.nhn") {
            if (brBoardLink.target === "_parent" || brBoardLink.target === "_top") {
                brBoardLink.target = "_self";
            }
        }

        // (1-4)
        if (this.ownerDocument === document) {
            const articleTitle = this.querySelector(".ArticleTitle .title_text");
            if (articleTitle) {
                document.title = articleTitle.textContent + " : 네이버 카페";
            }
        }

        // (1-5)
        const tlBoardLink = this.querySelector(".ArticleTitle a.link_board"); // TopLeft
        if (tlBoardLink.pathname === "/f-e/ArticleList.nhn") {
            tlBoardLink.pathname = "/ArticleList.nhn";
        }
        if (tlBoardLink.target === "_parent" || tlBoardLink.target === "_top") {
            tlBoardLink.target = "_self";
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static prevButton(options) {
        // (1) 카페 최적화 (컨트롤 클릭 버그 수정, 게시글 단독 링크로 변경)

        // (1)
        // 기본 클릭 동작인 링크로 이동을 비활성화
        const url = totalLinkToIframeLink(this);
        if (url) {
            if (options.newTabRedirectArticle) {
                articleLinkToArticleOnlyLink(this);
            }
            createClickShieldBox(this);
        } else {
            createClickShieldBox(this, true); // 실패시 컨트롤 클릭 버그라도 수정
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static nextButton(options) {
        // (1) 카페 최적화 (컨트롤 클릭 버그 수정, 게시글 단독 링크로 변경)

        // (1)
        // 기본 클릭 동작인 링크로 이동을 비활성화
        const url = totalLinkToIframeLink(this);
        if (url) {
            if (options.newTabRedirectArticle) {
                articleLinkToArticleOnlyLink(this);
            }
            createClickShieldBox(this);
        } else {
            createClickShieldBox(this, true); // 실패시 컨트롤 클릭 버그라도 수정
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

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static contentLinkElement(options) {
        // (1) 기본 백그라운드에서 열기 ..(기본 새 탭에서 열기시)
        // (2-1) 카페 최적화 (카페 링크로 변경) ..(모바일 -> PC 사용시)
        // (2-2) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)

        // (1)
        if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {

            // 링크·내용 불일치 경고문 건드리지 않기
            if (!isValidHttpUrl(this.textContent) || this.href === this.textContent) {

                // 기본 클릭 동작인 새 탭에서 열기를 비활성화
                const spanLink = createClickShieldSpan(this.firstChild);

                spanLink?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (2-1)
        if (options.newTabRedirectMobile && options.optimizeCafe) {
            if (this.hostname === "m.cafe.naver.com") {
                const isLinkTextSame = this.href === this.textContent;
                let promise;
                if (options.newTabRedirectArticle) {
                    promise = mobileLinkToArticleOnlyLink(this);
                } else {
                    promise = mobileLinkToArticleLink(this);
                }
                promise?.then((url) => {
                    if (isLinkTextSame && url) {
                        this.textContent = url;
                    }
                });
            }
        }

        // (2-2)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            if (this.hostname === "cafe.naver.com") {
                const isLinkTextSame = this.href === this.textContent;
                articleLinkToArticleOnlyLink(this).then((url) => {
                    if (isLinkTextSame && url) {
                        this.textContent = url;
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
        if (options.newTabRedirectMobile && options.optimizeCafe) {
            if (aInfo?.hostname === "m.cafe.naver.com") {
                let promise;
                if (options.newTabRedirectArticle) {
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
        if (options.newTabRedirectArticle && options.optimizeCafe) {
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
    a.href = url;
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
    a.href = url;
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
    let url = await PCArticleURLParser.getArticleOnlyURL(info);
    if (!url) {
        return;
    }
    url = url.split("?", 2)[0]; // remove search
    a.href = url;
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
    a.href = url;
    return url;
}
