"use strict";

class OnFoundArticle {

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static contentLinkElement(options) {

        // 기본 백그라운드에서 열기 (기본적으로 새 탭에서 열림)
        if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {

            // 불일치 경고문 건드리지 않기
            if (!isValidHttpUrl(this.textContent) || this.href === this.textContent) {

                // 기본 클릭 동작인 새 탭에서 열기를 비활성화
                const spanLink = createClickShieldSpan(this.firstChild);

                spanLink?.addEventListener("click", openInBackgroundListener);
            }
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static contentOglinkElement(options) {
        const aInfo = this.querySelector("a.se-oglink-info");
        const aThumb = this.querySelector("a.se-oglink-thumbnail");

        // 기본 백그라운드에서 열기 (기본적으로 새 탭에서 열림)
        if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {
            aInfo?.addEventListener("click", openInBackgroundListener);
            aThumb?.addEventListener("click", openInBackgroundListener);
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static bottomrightBoardLink(options) {

        // 카페 최적화: 하단 우측 전체보기 버튼 target 수정
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

        // 리뉴얼 페이지 접속 방지
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
