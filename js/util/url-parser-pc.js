"use strict";

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
                return;
            }
        }

        // { type: TYPE_IFRAME, cafeName, cafeId, articleId, search }
        {
            const matches = pathname.match(this.RE_IFRAME);
            if (matches) {
                const { cafeName } = matches.groups;
                const url1 = getIframeUrlFromSearchParams(searchParams);
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
                return;
            }
        }
    }

    static async getArticleOnlyURL(info) {
        switch (info?.type) {
            case this.TYPE_DEFAULT:
                {
                    const { cafeName, articleId } = info;
                    const cafeId = await SessionCafeInfo.getCafeId(cafeName);
                    if (!cafeId) {
                        return;
                    }
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}`;
                }
            case this.TYPE_ARTICLE_ONLY:
                {
                    const { cafeId, articleId, search } = info;
                    const searchParams = new URLSearchParams(search);
                    searchParams.delete("oldPath");
                    const newSearch = searchParams.size > 0 ? "?" + searchParams.toString() : "";
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${newSearch}`;
                }
            case this.TYPE_ARTICLE_NHN:
            case this.TYPE_IFRAME:
                {
                    const { cafeId, articleId, search } = info;
                    const searchParams = new URLSearchParams(search);
                    // 타 확장과 호환 고려해서 삭제하지 않음
                    // searchParams.delete("clubid");
                    // searchParams.delete("articleid");
                    const newSearch = searchParams.size > 0 ? "?" + searchParams.toString() : "";
                    return `https://cafe.naver.com/ca-fe/cafes/${cafeId}/articles/${articleId}${newSearch}`;
                }
        }
    }
}

function getIframeUrlFromSearchParams(searchParams) {
    let url = searchParams.get("iframe_url");
    if (url) {
        return url;
    }
    url = searchParams.get("iframe_url_utf8");
    if (url) {
        return decodeURIComponent(url);
    }
}

class PCURLParser {
    static RE_APP = /^\/ca-fe\/cafes\/(?<cafeId>\d+)\//;

    static getIframeUrlInfo(pathname, search) {
        // { type: "app.article", cafeId, articleId, search }
        {
            const matches = pathname.match(PCArticleURLParser.RE_ARTICLE_ONLY);
            if (matches) {
                const { cafeId, articleId } = matches.groups;
                return { type: "app.article", cafeId, articleId, search };
            }
        }

        // { type: "app", cafeId, search }
        {
            const matches = pathname.match(this.RE_APP);
            if (matches) {
                const { cafeId } = matches.groups;
                return { type: "app", cafeId, search };
            }
        }

        const searchParams = new URLSearchParams(search);

        // { type: "app.article", cafeId, articleId, search }
        {
            const matches = pathname.match(PCArticleURLParser.RE_ARTICLE_NHN);
            if (matches) {
                const cafeId = searchParams.get("clubid");
                const articleId = searchParams.get("articleid");
                if (cafeId && articleId) {
                    return { type: "app.article", cafeId, articleId, search };
                }
                return;
            }
        }

        // { type: "cafe-intro", cafeId }
        if (pathname === "/MyCafeIntro.nhn") {
            const cafeId = searchParams.get("clubid");
            if (cafeId) {
                return { type: "cafe-intro", cafeId };
            }
        }

        // { type: "article-list", cafeId, menuId, search }
        if (pathname === "/ArticleList.nhn") {
            const cafeId = searchParams.get("search.clubid");
            const menuId = searchParams.get("search.menuid"); // nullable
            if (cafeId) {
                return { type: "article-list", cafeId, menuId, search };
            }
        }

        // { type: "article-search-list", cafeId }
        if (pathname === "/ArticleSearchList.nhn") {
            const cafeId = searchParams.get("search.clubid");
            if (cafeId) {
                return { type: "article-search-list", cafeId };
            }
        }

        // { type: "new-cafe" }
        if (pathname.startsWith("/f-e/cafes/")) {
            return { type: "new-cafe" };
        }
    }
}

class PCURLParserFE {
    static TYPE_ARTICLE_DEFAULT = 0;
    static TYPE_MENU = 1;
    static TYPE_ARTICLE = 2;
    static TYPE_POPULAR = 3;
    static TYPE_MEMBER = 4;

    static RE_ARTICLE_DEFAULT = /^\/(?<cafeName>\w+)\/(?<articleId>\d+)$/;
    static RE_MENU = /^\/f-e\/cafes\/(?<cafeId>\d+)\/menus\/(?<menuId>\d+)\/?$/;
    static RE_ARTICLE = /^\/f-e\/cafes\/(?<cafeId>\d+)\/articles\/(?<articleId>\d+)\/?$/;
    static RE_POPULAR = /^\/f-e\/cafes\/(?<cafeId>\d+)\/popular\/?$/;
    static RE_MEMBER = /^\/f-e\/cafes\/(?<cafeId>\d+)\/members\/(?<memberCode>[\w-]+)\/?$/;

    static getInfo(pathname, search) {
        // { type: TYPE_ARTICLE_DEFAULT, cafeName, articleId }
        {
            const matches = pathname.match(this.RE_ARTICLE_DEFAULT);
            if (matches) {
                const { cafeName, articleId } = matches.groups;
                return { type: this.TYPE_ARTICLE_DEFAULT, cafeName, articleId };
            }
        }

        // { type: TYPE_MENU, cafeId, menuId, search }
        {
            const matches = pathname.match(this.RE_MENU);
            if (matches) {
                const { cafeId, menuId } = matches.groups;
                const newSearchParams = new URLSearchParams(search);
                if (newSearchParams.has("viewType")) { // viewType -> search.boardtype
                    newSearchParams.set("search.boardtype", newSearchParams.get("viewType"));
                }
                if (newSearchParams.has("page")) { // page -> search.page
                    newSearchParams.set("search.page", newSearchParams.get("page"));
                }
                if (newSearchParams.has("size")) { // size -> userDisplay
                    newSearchParams.set("userDisplay", newSearchParams.get("size"));
                }
                newSearchParams.set("search.clubid", cafeId); // cafeId -> search.clubid
                newSearchParams.set("search.cafeId", cafeId); // cafeId -> search.cafeId
                if (menuId !== "0") {
                    newSearchParams.set("search.menuid", menuId); // menuId -> search.menuid
                }
                // if (newSearchParams.has("q")) { // q -> search.query
                // /ArticleSearchList.nhn? // 인코딩이 복잡하게 달라서 패스
                // }
                return { type: this.TYPE_MENU, cafeId, menuId, search: "?" + newSearchParams.toString() };
            }
        }

        // { type: TYPE_ARTICLE, cafeId, articleId, search }
        {
            const matches = pathname.match(this.RE_ARTICLE);
            if (matches) {
                const { cafeId, articleId } = matches.groups;
                return { type: this.TYPE_ARTICLE, cafeId, articleId, search };
            }
        }

        // { type: TYPE_POPULAR, cafeId }
        {
            const matches = pathname.match(this.RE_POPULAR);
            if (matches) {
                const { cafeId } = matches.groups;
                return { type: this.TYPE_POPULAR, cafeId };
            }
        }

        // { type: TYPE_MEMBER, cafeId, memberCode }
        {
            const matches = pathname.match(this.RE_MEMBER);
            if (matches) {
                const { cafeId, memberCode } = matches.groups;
                return { type: this.TYPE_MEMBER, cafeId, memberCode };
            }
        }
    }
}
