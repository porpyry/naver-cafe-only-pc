class OnFoundArticleList {

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        // (1) 기본 새 탭에서 열기
        // (2) 기본 백그라운드에서 열기 ..(1)
        // (3) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        // (1)
        if (options.cafeDefaultNewTab) {
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aComment) {
                aComment.target = "_blank";
            }

            // (2)
            if (options.cafeDefaultBackground) {
                aTitle?.addEventListener("click", openInBackgroundListener);
                aComment?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (3)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            replaceHrefToArticleOnly(aTitle);
            replaceHrefToArticleOnly(aComment);
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static imageTypeElement(options) {
        // (1) 기본 새 탭에서 열기
        // (2) 기본 백그라운드에서 열기 ..(1)
        // (3) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aImage = this.querySelector("a.album-img");
        const aTitle = this.querySelector("a.tit"); // not null
        const aComment = this.querySelector("a:has(> span.num)");

        // (1)
        if (options.cafeDefaultNewTab) {
            if (aImage) {
                aImage.target = "_blank";
            }
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aComment) {
                aComment.target = "_blank";
            }

            // (2)
            if (options.cafeDefaultBackground) {
                aImage?.addEventListener("click", openInBackgroundListener);
                aTitle?.addEventListener("click", openInBackgroundListener);
                aComment?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (3)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            replaceHrefToArticleOnly(aImage);
            replaceHrefToArticleOnly(aTitle);
            replaceHrefToArticleOnly(aComment);
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static cardTypeElement(options) {
        // (1) 기본 새 탭에서 열기
        // (2) 기본 백그라운드에서 열기 ..(1)
        // (3) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aTitle = this.querySelector("a.tit"); // not null
        const aContent = this.querySelector("a.txt");
        const aImage = this.querySelector(".movie-img > a");

        // (1)
        if (options.cafeDefaultNewTab) {
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aContent) {
                aContent.target = "_blank";
            }
            if (aImage) {
                aImage.target = "_blank";
            }

            // (2)
            if (options.cafeDefaultBackground) {
                aTitle?.addEventListener("click", openInBackgroundListener);
                aContent?.addEventListener("click", openInBackgroundListener);
                aImage?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (3)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            replaceHrefToArticleOnly(aTitle);
            replaceHrefToArticleOnly(aContent);
            replaceHrefToArticleOnly(aImage);
        }
    }
}
