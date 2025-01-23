class OnFoundPopular {

    /** @param {Options} options */
    static getIndex(options) {
        return [
            ["app.popular.container", this.container, options.optimizeCafe],
            ["app.popular.list-type-element", this.listTypeElement, options.cafeDefaultNewTab || options.optimizeCafe]
        ];
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static container(/*options*/) {
        // (1-1) 카페 최적화 (단독 게시글 페이지에서 탭 제목 수정)

        // (1-1)
        if (this.ownerDocument === document) {
            document.title = "카페 인기글 : 네이버 카페";
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        // (1) 기본 새 탭에서 열기
        // (2) 기본 백그라운드에서 열기 ..(1)
        // (3) 카페 최적화 (컨트롤 클릭 버그 수정)
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        // aComment의 [, em, ] 묶기
        const spanComment = groupChildrenWithSpan(aComment);

        // (1)
        if (options.cafeDefaultNewTab) {

            // 기본 클릭 동작인 특정 링크로 이동을 비활성화
            const spanTitle = createClickShieldSpan(aTitle?.firstChild);
            createClickShieldSpan(spanComment);

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

        // (3)
        // 컨트롤이 눌려있을 경우 기본 클릭 동작 비활성화
        // 기본 클릭 동작이 리로드가 없어서 더 효율적이다.
        if (!options.cafeDefaultNewTab && options.optimizeCafe) {
            createClickShieldSpan(aTitle?.firstChild, true);
            createClickShieldSpan(spanComment, true);
        }
    }
    // 기본적으로 게시글 단독 링크이다.
}
