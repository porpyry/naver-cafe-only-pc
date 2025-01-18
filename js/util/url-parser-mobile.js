class MobileURLParser {

    static TYPE_DEFAULT = 0; // cafeName, articleId
    static TYPE_CAFE_ID = 1; // cafeId, articleId
    static TYPE_CAFE_NAME = 2; // cafeName, articleId

    static RE_DEFAULT = /^(\/ca-fe)?\/(?<cafeName>\w+)\/(?<articleId>\d+)\/?$/; // 앞에 /ca-fe가 없으면 뒤에 /도 없어야 하지만 큰 문제는 아님
    static RE_CAFE_ID = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/articles\/(?<articleId>\d+)\/?$/;
    static RE_CAFE_NAME = /^\/ca-fe\/web\/cafes\/(?<cafeName>\w+)\/articles\/(?<articleId>\d+)\/?$/;

    static getInfo(pathname, search) {
        // { type: TYPE_DEFAULT, cafeName, articleId }
        {
            const matches = pathname.match(this.RE_DEFAULT);
            if (matches) {
                const { cafeName, articleId } = matches.groups;
                return { type: this.TYPE_DEFAULT, cafeName, articleId };
            }
        }

        const searchParams = new URLSearchParams(search);
        const useCafeId = searchParams.get("useCafeId")?.toLowerCase();

        // { type: TYPE_CAFE_ID, cafeId, articleId }
        if (!useCafeId || useCafeId === "true") {
            const matches = pathname.match(this.RE_CAFE_ID);
            if (matches) {
                const { cafeId, articleId } = matches.groups;
                return { type: this.TYPE_CAFE_ID, cafeId, articleId };
            }
        }

        // { type: TYPE_CAFE_NAME, cafeName, articleId }
        if (useCafeId === "false") {
            const matches = pathname.match(this.RE_CAFE_NAME);
            if (matches) {
                const { cafeName, articleId } = matches.groups;
                return { type: this.TYPE_CAFE_NAME, cafeName, articleId };
            }
        }
    }

    static getArticleURL(info) {
        switch (info?.type) {
            case this.TYPE_DEFAULT:
            case this.TYPE_CAFE_NAME:
                {
                    const { cafeName, articleId } = info;
                    return `https://cafe.naver.com/${cafeName}/${articleId}`;
                }
            case this.TYPE_CAFE_ID:
                {
                    const { cafeId, articleId } = info;
                    return `https://cafe.naver.com/ArticleRead.nhn?clubid=${cafeId}&articleid=${articleId}`;
                }
        }
    }

    static async getArticleOnlyURL(info) {
        switch (info?.type) {
            case this.TYPE_DEFAULT:
            case this.TYPE_CAFE_NAME:
                {
                    const { cafeName, articleId } = info;
                    const cafeId = await Session.getCafeId(cafeName);
                    if (!cafeId) {
                        return;
                    }
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
                }
            case this.TYPE_CAFE_ID:
                {
                    const { cafeId, articleId } = info;
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
                }
        }
    }
}
