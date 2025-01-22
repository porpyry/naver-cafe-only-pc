class OnFoundPopular {

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        if (options.cafeDefaultNewTab) {
            // aComment의 [, em, ] 묶기
            groupChildrenWithSpan(aComment);

            // 기본 클릭 동작인 링크로 이동을 비활성화
            const spanTitle = createClickShieldSpan(aTitle?.firstChild);
            const spanComment = createClickShieldSpan(aComment?.querySelector("span.NCOP_GroupSpan"));

            // 기본 새 탭에서 열기
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aComment) {
                aComment.target = "_blank";
            }

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                spanTitle?.addEventListener("click", openInBackgroundListener);
                spanComment?.addEventListener("click", openInBackgroundListener);
            }
        }
    }
}
