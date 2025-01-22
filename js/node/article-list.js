class OnFoundArticleList {

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        if (options.cafeDefaultNewTab) {
            // 기본 새 탭에서 열기
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aComment) {
                aComment.target = "_blank";
            }

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                aTitle?.addEventListener("click", openInBackgroundListener);
                aComment?.addEventListener("click", openInBackgroundListener);
            }
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static imageTypeElement(options) {
        const aImage = this.querySelector("a.album-img");
        const aTitle = this.querySelector("a.tit"); // not null
        const aComment = this.querySelector("a:has(> span.num)");

        if (options.cafeDefaultNewTab) {
            // 기본 새 탭에서 열기
            if (aImage) {
                aImage.target = "_blank";
            }
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aComment) {
                aComment.target = "_blank";
            }

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                aImage?.addEventListener("click", openInBackgroundListener);
                aTitle?.addEventListener("click", openInBackgroundListener);
                aComment?.addEventListener("click", openInBackgroundListener);
            }
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static cardTypeElement(options) {
        const aTitle = this.querySelector("a.tit"); // not null
        const aContent = this.querySelector("a.txt");
        const aImage = this.querySelector(".movie-img > a");

        if (options.cafeDefaultNewTab) {
            // 기본 새 탭에서 열기
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aContent) {
                aContent.target = "_blank";
            }
            if (aImage) {
                aImage.target = "_blank";
            }

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                aTitle?.addEventListener("click", openInBackgroundListener);
                aContent?.addEventListener("click", openInBackgroundListener);
                aImage?.addEventListener("click", openInBackgroundListener);
            }
        }
    }
}
