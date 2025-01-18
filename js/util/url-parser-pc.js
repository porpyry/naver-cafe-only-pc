class PCArticleURLParser {

    static TYPE_DEFAULT = 0; // cafeName, articleId
    static TYPE_ARTICLE_ONLY = 1; // cafeId, articleId
    static TYPE_ARTICLE_NHN = 2; // cafeId, articleId
    static TYPE_IFRAME = 3; // cafeName, cafeId, articleId

    static RE_DEFAULT = /^\/(?<cafeName>\w+)\/(?<articleId>\d+)$/;
    static RE_ARTICLE_ONLY = /^\/ca-fe\/cafes\/(?<cafeId>\d+)\/articles\/(?<articleId>\d+)\/?$/;
    static RE_ARTICLE_NHN = /^(\/ca-fe)?\/ArticleRead.nhn\/?$/;
    static RE_IFRAME = /^\/(?<cafeName>\w+)(\.cafe|\/)?$/;

    static getInfo(pathname, search) {
        // { type: TYPE_DEFAULT, cafeName, articleId }
        {
            const matches = pathname.match(this.RE_DEFAULT);
            if (matches) {
                const { cafeName, articleId } = matches.groups;
                return { type: this.TYPE_DEFAULT, cafeName, articleId };
            }
        }

        // { type: TYPE_ARTICLE_ONLY, cafeId, articleId, search }
        {
            const matches = pathname.match(this.RE_ARTICLE_ONLY);
            if (matches) {
                const { cafeId, articleId } = matches.groups;
                return { type: this.TYPE_ARTICLE_ONLY, cafeId, articleId, search };
            }
        }

        const searchParams = new URLSearchParams(search);

        // { type: TYPE_ARTICLE_NHN, cafeId, articleId, search }
        {
            const matches = pathname.match(this.RE_ARTICLE_NHN);
            if (matches) {
                const cafeId = searchParams.get("clubid");
                const articleId = searchParams.get("articleid");
                if (cafeId && articleId) {
                    return { type: this.TYPE_ARTICLE_NHN, cafeId, articleId, search };
                }
            }
        }

        // { type: TYPE_IFRAME, cafeName, cafeId, articleId, search }
        {
            const matches = pathname.match(this.RE_IFRAME);
            if (matches) {
                const { cafeName } = matches.groups;
                const url1 = this.getIframeURL(searchParams);
                if (url1) {
                    const [pathname1, search1] = url1.split("?", 2);
                    const matches1 = pathname1?.match(this.RE_ARTICLE_NHN); // TYPE_ARTICLE_NHN
                    if (matches1) {
                        const searchParams1 = new URLSearchParams(search1);
                        const cafeId = searchParams1.get("clubid");
                        const articleId = searchParams1.get("articleid");
                        if (cafeId && articleId) {
                            return { type: this.TYPE_IFRAME, cafeName, cafeId, articleId, search: search1 };
                        }
                    }
                }
            }
        }
    }

    static getIframeURL(searchParams) {
        let url = searchParams.get("iframe_url");
        if (url) {
            return url;
        }

        url = searchParams.get("iframe_url_utf8");
        if (url) {
            return decodeURIComponent(url);
        }
    }

    static async getArticleOnlyURL(info) {
        switch (info?.type) {
            case this.TYPE_DEFAULT:
                {
                    const { cafeName, articleId } = info;
                    const cafeId = await Session.getCafeId(cafeName);
                    if (!cafeId) {
                        return;
                    }
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
                }
            case this.TYPE_ARTICLE_ONLY:
                {
                    const { cafeId, articleId, search } = info;
                    const searchParams = new URLSearchParams(search);
                    if (!searchParams.has("oldPath")) {
                        return;
                    }
                    searchParams.delete("oldPath");
                    const newSearch = searchParams.size > 0 ? searchParams.toString() : "";
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${newSearch}`;
                }
            case this.TYPE_ARTICLE_NHN:
            case this.TYPE_IFRAME:
                {
                    const { cafeId, articleId, search } = info;
                    const searchParams = new URLSearchParams(search);
                    searchParams.delete("clubid");
                    searchParams.delete("articleid");
                    const newSearch = searchParams.size > 0 ? "?" + searchParams.toString() : "";
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${newSearch}`;
                }
        }
    }
}
