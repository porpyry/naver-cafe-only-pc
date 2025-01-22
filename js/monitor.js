/**
 * @typedef {Object} MonitorItem
 * @property {boolean} isActive
 * @property {string[]} parentKeys
 * @property {string[]} childKeys
 * @property {OnFound} [onFound]
 * @property {OnActivate} [onActivate]
 */

/**
 * @callback OnFound
 * @param {Options} [options]
 * */

/**
 * @callback OnActivate
 * @param {Node} node
 */

class Monitor {

    /** @type {Map<string, MonitorItem>} */
    map = new Map();

    /** @param {Options} options */
    constructor(options) {
        this.options = options;
    }

    on(key, onFound) {
        const item = this.map.get(key);
        if (item) {
            if (!item.onFound && onFound) {
                item.onFound = onFound;
            }
            return;
        }
        const { parentKeys, onActivate } = this.baseDAG[key];
        this.map.set(key, { isActive: false, parentKeys, childKeys: [], onFound, onActivate });
        for (const parentKey of parentKeys) {
            this.on(parentKey, null);
        }
    }

    call(key, node) {
        if (!node) {
            return;
        }
        const item = this.map.get(key);
        if (!item) {
            return;
        }
        item.isActive = true;
        try {
            item.onFound?.call(node, this.options);
        } catch (e) {
            console.error(e);
        }
        item.onActivate?.(node);
    }

    clear(key, force = false) {
        const item = this.map.get(key);
        if (!item) {
            return;
        }
        if (!force && item.isActive) {
            return;
        }
        this.map.delete(key);
        for (const childKey of item.childKeys) {
            const childItem = this.map.get(childKey);
            if (childItem) {
                const index = childItem.parentKeys.indexOf(key);
                if (index > -1) {
                    childItem.parentKeys.splice(index, 1);
                }
                if (childItem.parentKeys.length === 0) {
                    this.clear(childKey);
                }
            }
        }
    }

    baseDAG = {
        "document": {
            parentKeys: [],
            onActivate: (doc) => {
                const iframe = doc.querySelector("iframe#cafe_main");
                if (iframe) {
                    this.call("cafe.document", doc);
                } else {
                    this.call("only.document", doc);
                }
            }
        },
        "only.document": {
            parentKeys: ["document"],
            onActivate: (doc) => {
                this.clear("document", true);
                this.call("app.document", doc);
            }
        },
        "cafe.document": {
            parentKeys: ["document"],
            onActivate: (doc) => {
                this.clear("document", true);
                const iframe = doc.querySelector("iframe#cafe_main");
                if (iframe) {
                    // 내부 프레임의 URL이 변경될 때마다 호출된다.
                    iframe.addEventListener("load", (event) => {
                        this.call("iframe.document", event.target.contentDocument);
                    });
                    // 이미 로딩이 완료된 경우 즉시 호출한다.
                    if (isIframeDocumentLoaded(iframe)) {
                        this.call("iframe.document", iframe.contentDocument);
                    }
                }
                const divSidePanel = doc.getElementById("group-area");
                this.call("cafe.side-panel", divSidePanel);
            }
        },
        "iframe.document": {
            parentKeys: ["cafe.document"],
            onActivate: (doc) => {
                this.clear("cafe.document", true);
                const pathname = doc.location.pathname;
                if (pathname.startsWith("/ca-fe/cafes/") || pathname.startsWith("/ArticleRead.nhn")) {
                    this.call("app.document", doc);
                } else if (pathname.startsWith("/MyCafeIntro.nhn")) {
                    this.call("cafe-intro.document", doc);
                } else if (pathname.startsWith("/ArticleList.nhn")) {
                    this.call("article-list.document", doc);
                } else if (pathname.startsWith("/ArticleSearchList.nhn")) {
                    this.call("article-search-list.document", doc);
                }
            }
        },
        "app.document": {
            parentKeys: ["only.document", "iframe.document"],
            onActivate: async (doc) => {
                this.clear("only.document", true);
                const divApp = await getDivApp(doc);
                watchingChild(divApp, ".Article", async (divArticle) => {
                    const container = await watchSelector(divArticle, ".ArticleContainerWrap");
                    this.call("app.article.container", container);
                });
                watchingChild(divApp, "section", (container) => {
                    this.call("app.popular.container", container);
                });
                watchingChild(divApp, ".MemberProfile", (container) => {
                    this.call("app.member.container", container);
                });
            }
        },
        // --- --- --- --- --- --- --- --- Cafe --- --- --- --- --- --- --- ---
        "cafe.side-panel": {
            parentKeys: ["cafe.document"],
            onActivate: (divSidePanel) => {
                const ulFavoriteMenu = divSidePanel.querySelector("ul#favoriteMenuGroup");
                if (ulFavoriteMenu) {
                    if (ulFavoriteMenu.style.display !== "none") {
                        this.call("cafe.favorite-menu", ulFavoriteMenu);
                    } else {
                        new MutationObserver((mutationList) => {
                            for (const mutation of mutationList) {
                                if (mutation.target?.style?.display !== "none") {
                                    this.call("cafe.favorite-menu", mutation.target);
                                    return;
                                }
                            }
                        }).observe(ulFavoriteMenu, { attributeFilter: ["style"] });
                    }
                }
                this.map.delete("cafe.side-panel");
            }
        },
        "cafe.favorite-menu": {
            parentKeys: ["cafe.side-panel"]
        },
        // --- --- --- --- --- --- --- --- App.Article --- --- --- --- --- --- --- ---
        "app.article.container": {
            parentKeys: ["app.document"],
            onActivate: (container) => {
                for (const linkElement of container.querySelectorAll("a.se-link")) {
                    this.call("app.article.content-link-element", linkElement);
                }
                for (const oglinkElement of container.querySelectorAll(".se-module-oglink")) {
                    this.call("app.article.content-oglink-element", oglinkElement);
                }
                const topleftBoardLink = container.querySelector(".ArticleTitle a.link_board");
                this.call("app.article.topleft-board-link", topleftBoardLink);
                const bottomrightBoardLink = container.querySelector(".RelatedArticles .paginate_area a.more");
                this.call("app.article.bottomright-board-link", bottomrightBoardLink);
            }
        },
        "app.article.content-link-element": {
            parentKeys: ["app.article.container"]
        },
        "app.article.content-oglink-element": {
            parentKeys: ["app.article.container"]
        },
        "app.article.topleft-board-link": {
            parentKeys: ["app.article.container"]
        },
        "app.article.bottomright-board-link": {
            parentKeys: ["app.article.container"]
        },
        // --- --- --- --- --- --- --- --- App.Popular --- --- --- --- --- --- --- ---
        "app.popular.container": {
            parentKeys: ["app.document"],
            onActivate: (container) => {
                // 페이지 변경 감지
                const pageChangeObserver = new MutationObserver((mutationList) => {
                    for (const mutation of mutationList) {
                        for (const node of mutation.addedNodes) {
                            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "TR") {
                                this.call("app.popular.tbody-page", mutation.target);
                                return; // fire once
                            }
                        }
                    }
                });
                // 탭 변경 감지
                watchingChild(container, "div:has(> .ArticleBoard)", async (div) => {
                    const table = div.querySelector(".article-board > table");
                    if (!table) {
                        return;
                    }
                    const tbodyPage = await watchSelector(table, "tbody");
                    this.call("app.popular.tbody-page", tbodyPage);
                    // 페이지 변경 감지 재시작
                    pageChangeObserver.disconnect();
                    pageChangeObserver.observe(tbodyPage, { childList: true });
                });
            }
        },
        "app.popular.tbody-page": {
            parentKeys: ["app.popular.container"],
            onActivate: (tbodyPage) => {
                for (const listTypeElement of tbodyPage.querySelectorAll(".inner_list")) {
                    this.call("app.popular.list-type-element", listTypeElement);
                }
            }
        },
        "app.popular.list-type-element": {
            parentKeys: ["app.popular.tbody-page"]
        },
        // --- --- --- --- --- --- --- --- App.Member --- --- --- --- --- --- --- ---
        "app.member.container": {
            parentKeys: ["app.document"],
            onActivate: (container) => {
                const divArticleBoard = container.querySelector(".article-board");
                if (divArticleBoard) {
                    // 페이지 변경 감지
                    const pageChangeObserver = new MutationObserver((mutationList) => {
                        for (const mutation of mutationList) {
                            for (const node of mutation.addedNodes) {
                                if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "TR") {
                                    this.call("app.member.tbody-page", mutation.target);
                                    return; // fire once
                                }
                            }
                        }
                    });
                    // 탭 변경 감지
                    watchingChild(divArticleBoard, "table", (table) => {
                        const tbodyPage = table.querySelector("tbody");
                        this.call("app.member.tbody-page", tbodyPage);
                        // 페이지 변경 감지 재시작
                        pageChangeObserver.disconnect();
                        pageChangeObserver.observe(tbodyPage, { childList: true });
                    });
                }
            }
        },
        "app.member.tbody-page": {
            parentKeys: ["app.member.container"],
            onActivate: (tbodyPage) => {
                for (const listTypeElement of tbodyPage.querySelectorAll("div.board-list .inner_list")) {
                    this.call("app.member.list-type-element", listTypeElement);
                }
                for (const cardTypeElement of tbodyPage.querySelectorAll("a.board-list")) {
                    this.call("app.member.card-type-element", cardTypeElement);
                }
            }
        },
        "app.member.list-type-element": {
            parentKeys: ["app.member.tbody-page"]
        },
        "app.member.card-type-element": {
            parentKeys: ["app.member.tbody-page"]
        },
        // --- --- --- --- --- --- --- --- CafeIntro --- --- --- --- --- --- --- ---
        "cafe-intro.document": {
            parentKeys: ["iframe.document"],
            onActivate: (doc) => {
                const divBasisElement = doc.querySelector("#basisElement");
                if (divBasisElement) {
                    for (const boardHeadElement of divBasisElement.querySelectorAll(".list-tit")) {
                        this.call("cafe-intro.board-head-element", boardHeadElement);
                    }
                    for (const listTypeElement of divBasisElement.querySelectorAll(".article-board .inner_list")) {
                        this.call("cafe-intro.list-type-element", listTypeElement);
                    }
                    for (const imageTypeElement of divBasisElement.querySelectorAll(".article-album dl")) {
                        this.call("cafe-intro.image-type-element", imageTypeElement);
                    }
                    for (const cardTypeElement of divBasisElement.querySelectorAll(".article-movie .card_area")) {
                        this.call("cafe-intro.card-type-element", cardTypeElement);
                    }
                }
            }
        },
        "cafe-intro.board-head-element": {
            parentKeys: ["cafe-intro.document"]
        },
        "cafe-intro.list-type-element": {
            parentKeys: ["cafe-intro.document"]
        },
        "cafe-intro.image-type-element": {
            parentKeys: ["cafe-intro.document"]
        },
        "cafe-intro.card-type-element": {
            parentKeys: ["cafe-intro.document"]
        },
        // --- --- --- --- --- --- --- --- ArticleList --- --- --- --- --- --- --- ---
        "article-list.document": {
            parentKeys: ["iframe.document"],
            onActivate: (doc) => {
                const divMainArea = doc.querySelector("#main-area");
                if (divMainArea) {
                    for (const listTypeElement of divMainArea.querySelectorAll(".article-board .inner_list")) {
                        this.call("article-list.list-type-element", listTypeElement);
                    }
                    for (const imageTypeElement of divMainArea.querySelectorAll("ul.article-album-sub > li")) {
                        this.call("article-list.image-type-element", imageTypeElement);
                    }
                    for (const cardTypeElement of divMainArea.querySelectorAll("ul.article-movie-sub .card_area")) {
                        this.call("article-list.card-type-element", cardTypeElement);
                    }
                }
            }
        },
        "article-list.list-type-element": {
            parentKeys: ["article-list.document"]
        },
        "article-list.image-type-element": {
            parentKeys: ["article-list.document"]
        },
        "article-list.card-type-element": {
            parentKeys: ["article-list.document"]
        },
        // --- --- --- --- --- --- --- --- ArticleSearchList --- --- --- --- --- --- --- ---
        "article-search-list.document": {
            parentKeys: ["iframe.document"],
            onActivate: (doc) => {
                const divMainArea = doc.querySelector("#main-area");
                if (divMainArea) {
                    for (const listTypeElement of divMainArea.querySelectorAll(".result-board .inner_list")) {
                        this.call("article-search-list.list-type-element", listTypeElement);
                    }
                }
            }
        },
        "article-search-list.list-type-element": {
            parentKeys: ["article-search-list.document"]
        }
    };

    ready() {
        delete this.baseDAG;

        for (const [key, item] of this.map) {
            item.parentKeys = item.parentKeys.filter((parentKey) => this.map.has(parentKey));
            for (const parentKey of item.parentKeys) {
                const parentItem = this.map.get(parentKey);
                parentItem.childKeys.push(key);
            }
        }
    }
}

// 로딩 속도가 느리면 비어있는 임시 app 이 먼저 찾아질 수 있다.
async function getDivApp(doc) {
    return watchSelector(doc.body, "#app", false, el => el.firstChild !== null);
}

/*
(2025-01-21)

[default]
body > #cafe-body-skin > #cafe-body > #content-area > #main-area > iframe#cafe_name -> document

[ArticleList.nhn]
body > #content-area > (main)
(main)
  #main-area > .article-board#upperArticleList (공지·추천)
  #main-area > .article-board (목록형) > table > tbody > tr > td.td_article > .board-list > (list-type-element)
  #main-area > ul.article-album-sub (앨범형) > (image-type-element)
  #main-area > ul.article-movie-sub (카드형) > li > (card-type-element)
(list-type-element)
  .inner_list  > a.article (제목) > span.head (말머리), TEXT
  .inner_list (list-type-element) > a.cmt (댓글수) > "[", em, "]"
(image-type-element)
  li > a.album-img (이미지) > img
  li > dl > dt > a.tit (제목) > span.inner > span.ellipsis > TEXT
  li > dl > dt > a (댓글수) > span.num > TEXT
(card-type-element)
  .card_area > .con > .con_top > .tit_area > a.tit (제목) > span.inner > strong > TEXT
  .card_area > .con > .con_top > a.txt (내용) > TEXT
  .card_area > .movie-img > a (이미지) > ::before, img

[MyCafeIntro.nhn]
body > #cafe-body-skin > #cafe-body > #content-area > #main-area > #basisElement > #cafe-data > .cb > (게시판 묶음)
(게시판 묶음)
  div > .article.* > (게시판 상단)
  div > .article-board (목록형) > table.board-box > tbody > tr > td.td_article > .board-list > (list-type-element)
  div > .article-album (앨범형) > ul.album-box > li > (image-type-element)
  div > .article-movie (카드형) > ul.article-movie-sub > li > (card-type-element)
(게시판 상단)
  .list-tit-box > .list-tit (board-head-element) > h3 > a (게시판 제목) > TEXT
  .list-tit-box > .list-tit (board-head-element) > span > a (게시판 더보기) > TEXT, ::after
(list-type-element)
  .inner_list > a.article (제목) > span.inner > TEXT
  .inner_list > .article_append > a.cmt (댓글수) > "[", em, "]"
(image-type-element)
  dl > dt.photo > a (이미지) > img
  dl > dd.tit > a (제목) > span.inner > span.ellipsis > TEXT
  dl > dd.tit > a (댓글수, href="#") > span.num > TEXT
(card-type-element)
  .card_area > .con > .con_top > a.tit (제목) > strong > TEXT
  .card_area > .con > .con_top > a.txt (내용) > TEXT
  .card_area > .movie-img > a (이미지) > img

[/ArticleSearchList.nhn]
body > #content-area > #main-area > .result-board > table > tbody > tr > td.td_article > .board-list > (list-type-element)
(list-type-element)
  .inner_list > a.article (제목) > span.head (말머리) > TEXT
  .inner_list > a.article (제목) > TEXT, em, TEXT
  .inner_list > a.cmt (댓글수) > "[", em, "]"
  .inner_list > .result_contents > a.link_contents (내용) > TEXT, b, TEXT

[Article]
body > #app (empty)
body -> #app -> .Article -> (내용)
(내용)
  .ArticleContainerWrap > (상단 버튼)
  .ArticleContainerWrap > .ArticleContentBox > .article_header (제목)
  .ArticleContainerWrap > .ArticleContentBox > .article_container (본문) > .article_writer > div > (하단 프로필)
  .ArticleContainerWrap > .ArticleContentBox > .article_container (본문) > .CommentBox (댓글) -> ...
  .ArticleContainerWrap > .ArticleBottomBtns (하단 버튼)
  .ArticleContainerWrap > (하단 게시판)
(상단 버튼)
  .ArticleTopBtns > .right_area -> a.btn_prev (이전글)
  .ArticleTopBtns > .right_area -> a.btn_next (다음글)
  .ArticleTopBtns > .right_area > a (다음글) > span > "목록"
(하단 프로필)
  .ArticleWriterProfile > a.more_area
  .ArticleWriterProfile -> (네이버 카페 애드온)
(네이버 카페 애드온)
  .profileArea > .profilePanel > .profileLink > .profileCircleWrapper > img.profileCircle (프로필 사진)
  .profileArea > .recentArticleListWrapper > ul.recentArticleList > li.recentArticleItem > a (최근 글)
(하단 게시판)
  div > .RelatedArticles (검색 결과) > h2.article_board_title > (strong.title > "'", span.inner, "'"), (span.text > "검색결과")
  div > .RelatedArticles (관련 게시물) > .RelatedArticlesTabContainer > RelatedArticlesTabContainer__tab > .tab_content > .RelatedArticlesTab -> ul.RelatedArticlesList > li.list_item > (related-type-element)
  div -> .PopularArticles (인기 게시물) > .PopularCafeList > ul.popular_list > (popular-type-element)
(related-type-element)
  .tit_area > em.category (말머리) > TEXT
  .tit_area > a.tit
(popular-type-element)
  li.list_item > a.link (전체 박스) > div.thumb (썸네일), div.post_box (제목 등)

[Popular]
body > #app (empty)
body -> #app -> section ->(탭 변경마다 1차) (내용)
(내용)
  div > .ArticleBoard > .article-board > table ->(탭 변경마다 2차) tbody ->(페이지 변경마다) tr > td > .board-list > (list-type-element)
(list-type-element)
  .inner_list > a.article (제목) > TEXT
  .inner_list > a.cmt (댓글수) > "[", em, "]"

[Member]
body > #app (empty)
body -> #app -> (내용)
(내용)
  .MemberProfile -> .sub_tit_profile > .txt > .nick_area > button.nick_btn (닉네임)
  .MemberProfile > .article_profile ->(탭 변경마다) table > tbody ->(liked, comments 탭에서 페이지 변경마다) tr > (list-element)
(list-element)
  td.td_article > div.board-list > (list-type-element)
  td.td_article > a.board-list (작성댓글) > (.inner_list > strong.article) (제목), .comment_date, .comment_title
  td.td_article > span.board-list (삭제된 글) > (.inner_list > strong.article) (제목), .comment_date, .comment_title
(list-type-element)
  .inner_list > a.article (제목) > span.head(말머리), TEXT
  .inner_list > a.cmt (댓글수) > "[", em, "]"
*/
