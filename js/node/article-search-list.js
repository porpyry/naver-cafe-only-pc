class OnFoundArticleSearchList {

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");
        const aContent = this.querySelector("a.link_contents");

        if (options.cafeDefaultNewTab) {
            // 기본 새 탭에서 열기
            if (aTitle) {
                aTitle.target = "_blank";
            }
            if (aComment) {
                aComment.target = "_blank";
            }
            if (aContent) {
                aContent.target = "_blank";
            }

            // 기본 백그라운드에서 열기
            if (options.cafeDefaultBackground) {
                aTitle?.addEventListener("click", openInBackgroundListener);
                aComment?.addEventListener("click", openInBackgroundListener);
                aContent?.addEventListener("click", openInBackgroundListener);
            }
        }
    }
}
