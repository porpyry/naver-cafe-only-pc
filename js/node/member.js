class OnFoundMember {

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        if (options.cafeDefaultNewTab) {

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                groupChildrenWithSpan(aTitle); // aTitle의 말머리, 제목 묶기
                groupChildrenWithSpan(aComment); // aComment의 [, em, ] 묶기

                // 기본 클릭 동작인 새 탭에서 열기를 비활성화
                const spanTitle = createClickShieldSpan(aTitle?.querySelector("span.NCOP_GroupSpan"));
                const spanComment = createClickShieldSpan(aComment?.querySelector("span.NCOP_GroupSpan"));

                spanTitle?.addEventListener("click", openInBackgroundListener);
                spanComment?.addEventListener("click", openInBackgroundListener);
            }
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static cardTypeElement(options) {

        if (options.cafeDefaultNewTab) {
            // 기본적으로 새 탭에서 열림

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {

                // 기본 클릭 동작인 새 탭에서 열기를 비활성화
                const spanLink = createClickShieldBox(this);

                spanLink.addEventListener("click", openInBackgroundListener);
            }
        }
    }
}
