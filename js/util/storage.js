class Session {
    cafeInfo = [];

    constructor(items) {
        Object.assign(this, items);
    }

    findCafeId(cafeName1) {
        return this.cafeInfo.find(({ cafeName }) => cafeName === cafeName1)?.cafeId;
    }

    findCafeName(cafeId1) {
        cafeId1 = parseInt(cafeId1);
        return this.cafeInfo.find(({ cafeId }) => cafeId === cafeId1)?.cafeName;
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

    /** @type {Promise<Session>} */
    static _session = null;

    /** @type {Promise<any>} */
    static _request = null;

    static async get() {
        if (!this._session) {
            this._session = chrome.storage.session.get(null).then(items => new this(items));
        }
        return this._session;
    }

    static async getCafeId(cafeName) {
        const session = await this.get();
        const cafeId = session.findCafeId(cafeName);
        if (cafeId) {
            return cafeId;
        }
        if (!this._request) {
            this._request = session.requestCafeInfoByCafeName(cafeName);
        }
        await this._request;
        return session.findCafeId(cafeName);
    }

    static async getCafeName(cafeId) {
        const session = await this.get();
        const cafeName = session.findCafeName(cafeId);
        if (cafeName) {
            return cafeName;
        }
        if (!this._request) {
            this._request = session.requestCafeInfoByCafeId(cafeId);
        }
        await this._request;
        return session.findCafeName(cafeId);
    }
}
