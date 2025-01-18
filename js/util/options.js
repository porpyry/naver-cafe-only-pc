class Options {
    enableApp = true;
    newTabRedirectArticle = true;
    newTabRedirectMobile = true;
    cafeDefaultNewTab = false;
    cafeDefaultBackground = false;
    pageArrowShortcut = false;
    inputShortcut = false;
    changeFavoriteOrder = false;
    accessibleUI = false;
    optimizeCafe = false;

    constructor(options) {
        Object.assign(this, options);
    }

    /** @type {Promise<Options>} */
    static _options = null;

    static async get() {
        if (!this._options) {
            this._options = chrome.storage.sync.get("options").then(items => new this(items.options));
        }
        return this._options;
    }
}
