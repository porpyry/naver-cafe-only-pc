"use strict";

class OnFoundArticle {

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static async contentLinkElement(options) {
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
                let url;
                if (options.newTabRedirectArticle) {
                    url = await mobileLinkToArticleOnlyLink(this);
                } else {
                    url = await mobileLinkToArticleLink(this);
                }
                if (isLinkTextSame && url) {
                    this.textContent = url;
                }
            }
        }

        // (2-2)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            if (this.hostname === "cafe.naver.com") {
                const isLinkTextSame = this.href === this.textContent;
                const url = await articleLinkToArticleOnlyLink(this);
                if (isLinkTextSame && url) {
                    this.textContent = url;
                }
            }
        }
    }
    // 기본적으로 새 탭에서 열린다.

    /** @this {HTMLElement}
      * @param {Options} options */
    static async contentOglinkElement(options) {
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
                let url;
                if (options.newTabRedirectArticle) {
                    url = await mobileLinkToArticleOnlyLink(aInfo);
                } else {
                    url = await mobileLinkToArticleLink(aInfo);
                }
                if (url) {
                    if (aThumb) {
                        aThumb.href = url;
                    }
                    const p = aInfo.querySelector("p.se-oglink-url");
                    if (p?.textContent === "m.cafe.naver.com") {
                        p.textContent = "cafe.naver.com";
                    }
                }
            }
        }

        // (2-2)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            if (aInfo?.hostname === "cafe.naver.com") {
                const url = await articleLinkToArticleOnlyLink(aInfo);
                if (url && aThumb) {
                    aThumb.href = url;
                }
            }
        }
    }
    // 기본적으로 새 탭에서 열린다.

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static bottomrightBoardLink(options) {
        // (1) 카페 최적화 (우하단 전체보기 버튼 target 수정)

        // (1)
        if (options.optimizeCafe) {
            if (this.pathname === "/ArticleList.nhn") {
                if (this.target === "_parent" || this.target === "_top") {
                    this.target = "_self";
                }
            }
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static topleftBoardLink(options) {
        // (1) 리뉴얼 페이지 접속 방지 (좌상단 게시판 버튼 href·target 수정)

        // (1)
        if (options.preventRenewalPage) {
            if (this.pathname === "/f-e/ArticleList.nhn") {
                this.pathname = "/ArticleList.nhn";
            }
            if (this.target === "_parent" || this.target === "_top") {
                this.target = "_self";
            }
        }
    }
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
