class OnFoundMember {

    /** @param {Options} options */
    static getIndex(options) {
        const optionsOnlyCafeDefaultBackground = options.cafeDefaultNewTab && options.cafeDefaultBackground;
        const optionsOptimizeCafeWhenRedirectArticle = options.newTabRedirectArticle && options.optimizeCafe;
        return [
            ["app.member.profile", this.profile, options.optimizeCafe],
            ["app.member.list-type-element", this.listTypeElement, optionsOnlyCafeDefaultBackground || optionsOptimizeCafeWhenRedirectArticle],
            ["app.member.card-type-element", this.cardTypeElement, optionsOnlyCafeDefaultBackground || optionsOptimizeCafeWhenRedirectArticle]
        ];
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static profile(/*options*/) {
        // (1) 카페 최적화 (단독 게시글 페이지에서 탭 제목 수정)

        // (1)
        if (this.ownerDocument === document) {
            const nick = this.querySelector("button.nick_btn");
            if (nick) {
                document.title = nick.textContent.trim() + " : 네이버 카페";
            }
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        // (1) 기본 백그라운드에서 열기 ..(기본 새 탭에서 열기시)
        // (2) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        const spanTitle = groupChildrenWithSpan(aTitle); // aTitle의 말머리, 제목 묶기
        const spanComment = groupChildrenWithSpan(aComment); // aComment의 [, em, ] 묶기

        // (1), (2)
        // 기본 클릭 동작인 특정 링크를 새 탭에서 열기를 비활성화
        createClickShieldSpan(spanTitle);
        createClickShieldSpan(spanComment);

        // (1)
        if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {
            spanTitle?.addEventListener("click", openInBackgroundListener);
            spanComment?.addEventListener("click", openInBackgroundListener);
        }

        // (2)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            replaceHrefToArticleOnly(aTitle);
            replaceHrefToArticleOnly(aComment);
        }
    }
    // 기본적으로 새 탭에서 열린다.

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static cardTypeElement(options) {
        // (1) 기본 백그라운드에서 열기 ..(기본 새 탭에서 열기시)
        // (2) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)

        // (1), (2)
        // 기본 클릭 동작인 특정 링크를 새 탭에서 열기를 비활성화
        const spanLink = createClickShieldBox(this);

        // (1)
        if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {
            spanLink.addEventListener("click", openInBackgroundListener);
        }

        // (2)
        if (options.newTabRedirectArticle && options.optimizeCafe) {
            replaceHrefToArticleOnly(this);
        }
    }
    // 기본적으로 새 탭에서 열린다.
}
