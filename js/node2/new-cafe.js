class OnFoundNewCafe {

    /** @param {Options} options */
    static getIndex(options) {
        return [
            ["new-cafe.cafe-content.board.in", this.cafeContentIn, options.backToOriginal],
            ["new-cafe.cafe-content.board.out", this.cafeContentOut, options.backToOriginal]
        ];
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static cafeContentIn(/*options*/) {
        // (1) 기존 카페로 새로고침 (메뉴 들어갈 시 버튼 생성 또는 보이기)

        // (1)
        const btoBtn = document.querySelector("button.NCOP_BTO");
        if (btoBtn) {
            btoBtn.style.display = null;
        } else {
            createBackToOriginalButton();
        }
    }

    /** @this {HTMLElement}
      * @param {Options} options */
    static cafeContentOut(/*options*/) {
        // (1) 기존 카페로 새로고침 (메뉴 벗어날 시 버튼 숨기기)

        // (1)
        const btoBtn = document.querySelector("button.NCOP_BTO");
        if (btoBtn) {
            btoBtn.style.display = "none";
        }
    }
}
