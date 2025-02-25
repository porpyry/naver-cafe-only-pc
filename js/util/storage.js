class Options {
    enableApp = true;
    newTabOnlyArticle = true;
    newTabOnlyPC = true;
    cafeDefaultNewTab = false;
    cafeDefaultBackground = false;
    pageArrowShortcut = false;
    searchCommentShortcut = false;
    changeFavoriteOrder = false;
    optimizeCafe = false;
    smoothPrevNext = false;
    backToOriginal = true;

    constructor(options) {
        Object.assign(this, options);
    }

    async save() {
        chrome.storage.sync.set({ options: this });
    }

    /** @type {Promise<Options>} */
    static _instance = null;

    static async get() {
        if (!this._instance) {
            this._instance = chrome.storage.sync.get("options").then(items => new this(items.options));
        }
        return this._instance;
    }
}

class SessionCafeInfo {

    /** @type {{ cafeId: number, cafeName: string, cafeTitle: string }[]} */
    cafeInfo = [];

    // items: { cafeInfo: [...] }
    constructor(items) {
        Object.assign(this, items);
    }

    findCafeId(cafeName) {
        const cafeName1 = cafeName;
        return this.cafeInfo.find(({ cafeName }) => cafeName === cafeName1)?.cafeId;
    }

    findCafeName(cafeId) {
        const cafeId1 = parseInt(cafeId);
        return this.cafeInfo.find(({ cafeId }) => cafeId === cafeId1)?.cafeName;
    }

    findCafeTitle(cafeId) {
        const cafeId1 = parseInt(cafeId);
        return this.cafeInfo.find(({ cafeId }) => cafeId === cafeId1)?.cafeTitle;
    }

    async requestCafeInfoByCafeName(cafeName) {
        return this.requestCafeInfo("cluburl=" + cafeName);
    }

    async requestCafeInfoByCafeId(cafeId) {
        return this.requestCafeInfo("cafeId=" + cafeId);
    }

    async requestCafeInfo(query) {
        try {
            const url = "https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?" + query;
            const res = await fetch(url);
            const json = await res.json();
            const info = json?.message?.result?.cafeInfoView;
            if (!info) {
                return;
            }
            const {
                cafeId: cafeId, // 27842958
                cafeUrl: cafeName, // "steamindiegame"
                cafeName: cafeTitle // "왁물원 :: 종합 거시기 스트리머 우왁굳 팬카페"
            } = info;
            this.cafeInfo.push({ cafeId, cafeName, cafeTitle });
            chrome.storage.session.set(this);
        } catch (e) {
            console.error(e);
        } finally {
            this._request = null;
        }
    }

    /** @type {Promise<SessionCafeInfo>} */
    static _instance = null;

    /** @type {Promise<any>} */
    static _request = null;

    static async get() {
        if (!this._instance) {
            this._instance = chrome.storage.session.get("cafeInfo").then(items => new this(items));
        }
        return this._instance;
    }

    static async getCafeId(cafeName) {
        const instance = await this.get();
        const cafeId = instance.findCafeId(cafeName);
        if (cafeId) {
            return cafeId;
        }
        if (!this._request) {
            this._request = instance.requestCafeInfoByCafeName(cafeName);
        }
        await this._request;
        return instance.findCafeId(cafeName);
    }

    static async getCafeName(cafeId) {
        const instance = await this.get();
        const cafeName = instance.findCafeName(cafeId);
        if (cafeName) {
            return cafeName;
        }
        if (!this._request) {
            this._request = instance.requestCafeInfoByCafeId(cafeId);
        }
        await this._request;
        return instance.findCafeName(cafeId);
    }

    static async getCafeTitle(cafeId) {
        const instance = await this.get();
        const cafeTitle = instance.findCafeTitle(cafeId);
        if (cafeTitle) {
            return cafeTitle;
        }
        if (!this._request) {
            this._request = instance.requestCafeInfoByCafeId(cafeId);
        }
        await this._request;
        return instance.findCafeTitle(cafeId);
    }
}

class SessionSafeFlags {
    noSmoothPrevNext = false;
    noSmoothProfile = false;

    constructor(safeFlags) {
        Object.assign(this, safeFlags);
    }

    /** @type {Promise<SessionSafeFlags>} */
    static _instance = null;

    static async get() {
        if (!this._instance) {
            this._instance = chrome.storage.session.get("safeFlags").then(items => new this(items.safeFlags));
        }
        return this._instance;
    }
}
