class OnFoundCafeIntro {

    /** @this {HTMLElement}
      * @param {Options} options */
    static boardHeadElement(options) {
        const aTitle = this.querySelector("h3 > a");
        const aMore = this.querySelector("span > a");
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static listTypeElement(options) {
        const aTitle = this.querySelector("a.article"); // not null
        const aComment = this.querySelector("a.cmt");

        if (options.cafeDefaultNewTab) {
            // aComment의 [, em, ] 묶기
            groupChildrenWithSpan(aComment);

            // 기본 클릭 동작인 링크로 이동을 비활성화
            const spanTitle = createClickShieldSpan(aTitle?.querySelector("span.inner"));
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

    /** @this {HTMLElement}
      * @param {Options} options */
    static imageTypeElement(options) {
        const aImage = this.querySelector("dt.photo a");
        const aTitle = this.querySelector("dd.tit > a:has(> span.inner)"); // not null
        const aComment = this.querySelector("dd.tit > a:has(> span.num)"); // href 없음

        if (options.cafeDefaultNewTab) {
            // aComment.href 수정
            if (aComment && aTitle) {
                aComment.href = commentFocusURL(aTitle.href);
            }

            // 기본 클릭 동작인 링크로 이동을 비활성화
            const spanImage = createClickShieldBox(aImage);
            const spanTitle = createClickShieldSpan(aTitle?.querySelector("span.inner"));

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
                spanImage?.addEventListener("click", openInBackgroundListener);
                spanTitle?.addEventListener("click", openInBackgroundListener);
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
