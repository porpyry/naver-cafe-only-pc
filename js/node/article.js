"use strict";

class OnFoundArticle {

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static contentLinkElement(options) {

        if (options.cafeDefaultNewTab) {

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                // 불일치 경고문 건드리지 않기
                if (!isValidHttpUrl(this.textContent) || this.href === this.textContent) {
                    // 기본 클릭 동작인 새 탭에서 열기를 비활성화
                    const spanLink = createClickShieldSpan(this.firstChild);

                    spanLink?.addEventListener("click", openInBackgroundListener);
                }
            }
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static contentOglinkElement(options) {
        const aInfo = this.querySelector("a.se-oglink-info");
        const aThumb = this.querySelector("a.se-oglink-thumbnail");

        if (options.cafeDefaultNewTab) {

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                aInfo?.addEventListener("click", openInBackgroundListener);
                aThumb?.addEventListener("click", openInBackgroundListener);
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
