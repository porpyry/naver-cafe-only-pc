class OnFoundCafeIntro {

    /** @param {Options} options */
    static getIndex(options) {
        const optionsOptimizeCafeWhenRedirectArticle = options.newTabRedirectArticle && options.optimizeCafe;
        return [
            ["cafe-intro.list-type-element", OnFoundCafeIntro.listTypeElement, options.cafeDefaultNewTab || options.optimizeCafe],
            ["cafe-intro.image-type-element", OnFoundCafeIntro.imageTypeElement, options.cafeDefaultNewTab || options.optimizeCafe],
            ["cafe-intro.card-type-element", OnFoundCafeIntro.cardTypeElement, options.cafeDefaultNewTab || optionsOptimizeCafeWhenRedirectArticle],
            ["cafe-intro.board-head-element", OnFoundCafeIntro.boardHeadElement, options.optimizeCafe]
        ];
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        // (1) 기본 새 탭에서 열기
        // (2) 기본 백그라운드에서 열기 ..(1)
        // (3-1) 카페 최적화 (컨트롤 클릭 버그 수정)
        // (3-2) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        // aComment의 [, em, ] 묶기
        const spanComment = groupChildrenWithSpan(aComment);

        // (1), (3-1)
        // 기본 클릭 동작인 링크로 이동을 비활성화
        const spanTitle = createClickShieldSpan(aTitle?.querySelector("span.inner"));
        createClickShieldSpan(spanComment);

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
                spanTitle?.addEventListener("click", openInBackgroundListener);
                spanComment?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (3-2)
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
        // (3-1) 카페 최적화 (컨트롤 클릭 버그 수정)
        // (3-2) 카페 최적화 (댓글수 링크 수정)
        // (3-3) 카페 최적화 (게시글 단독 링크로 변경) ..(게시글 부분만 로딩시)
        const aImage = this.querySelector("dt.photo a");
        const aTitle = this.querySelector("dd.tit > a:has(> span.inner)"); // not null
        const aComment = this.querySelector("dd.tit > a:has(> span.num)"); // href 없음

        // (1), (3-1)
        // 기본 클릭 동작인 링크로 이동을 비활성화
        const spanImage = createClickShieldBox(aImage);
        const spanTitle = createClickShieldSpan(aTitle?.querySelector("span.inner"));

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
                spanImage?.addEventListener("click", openInBackgroundListener);
                spanTitle?.addEventListener("click", openInBackgroundListener);
                aComment?.addEventListener("click", openInBackgroundListener);
            }
        }

        // (3-2)
        if (options.optimizeCafe) {
            if (aComment && aTitle) {
                aComment.href = setCommentFocused(aTitle.href);
            }

            // (3-3)
            if (options.newTabRedirectArticle) {
                replaceHrefToArticleOnly(aImage);
                replaceHrefToArticleOnly(aTitle);
                replaceHrefToArticleOnly(aComment);
            }
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

    /** @this {HTMLElement}
      * @param {Options} options */
    static boardHeadElement(/*options*/) {
        // (1) 카페 최적화 (컨트롤 클릭 버그 수정)
        const aTitle = this.querySelector("h3 > a");
        const aMore = this.querySelector("span > a");

        // (1)
        // 기본 클릭 동작인 링크로 이동을 비활성화
        createClickShieldSpan(aTitle.firstChild);
        createClickShieldBox(aMore);
    }
}
