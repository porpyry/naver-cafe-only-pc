class OnFoundArticleSearchList {

    /** @param {Options} options */
    static getIndex(options) {
        const optionsOptimizeCafeWhenRedirectArticle = options.newTabRedirectArticle && options.optimizeCafe;
        return [
            ["article-search-list.list-type-element", this.listTypeElement, options.cafeDefaultNewTab || optionsOptimizeCafeWhenRedirectArticle]
        ];
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        // (1) 기본 새 탭에서 열기
        // (2) 기본 백그라운드에서 열기 ..(1)
        // (3) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");
        const aContent = this.querySelector("a.link_contents");

        // (1)
        if (options.cafeDefaultNewTab) {
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aComment) {
                aComment.target = "_blank";
            }
            if (aContent) {
                aContent.target = "_blank";
            }

            // (2)
            if (options.cafeDefaultBackground) {
                aTitle?.addEventListener("click", openInBackgroundListener);
                aComment?.addEventListener("click", openInBackgroundListener);
                aContent?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (3)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            replaceHrefToArticleOnly(aTitle);
            replaceHrefToArticleOnly(aComment);
            replaceHrefToArticleOnly(aContent);
        }
    }
}
