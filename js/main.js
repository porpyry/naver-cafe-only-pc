"use strict";

(async () => {
    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }

    const monitor = new Monitor(options);

    // app.article
    if ((options.cafeDefaultNewTab && options.cafeDefaultBackground)
        || ((options.newTabRedirectMobile || options.newTabRedirectArticle) && options.optimizeCafe)) {
        monitor.on("app.article.content-link-element", OnFoundArticle.contentLinkElement);
        monitor.on("app.article.content-oglink-element", OnFoundArticle.contentOglinkElement);
    }
    if (options.optimizeCafe) {
        monitor.on("app.article.prev-button", OnFoundArticle.prevButton);
        monitor.on("app.article.next-button", OnFoundArticle.nextButton);
        monitor.on("app.article.list-button", OnFoundArticle.listButton);
    }
    if (options.optimizeCafe || options.preventRenewalPage) {
        monitor.on("app.article.container", OnFoundArticle.container);
    }

    // article-list
    if (options.cafeDefaultNewTab || (options.newTabRedirectArticle && options.optimizeCafe)) {
        monitor.on("article-list.list-type-element", OnFoundArticleList.listTypeElement);
        monitor.on("article-list.image-type-element", OnFoundArticleList.imageTypeElement);
        monitor.on("article-list.card-type-element", OnFoundArticleList.cardTypeElement);
    }

    // article-search-list
    if (options.cafeDefaultNewTab || (options.newTabRedirectArticle && options.optimizeCafe)) {
        monitor.on("article-search-list.list-type-element", OnFoundArticleSearchList.listTypeElement);
    }

    // cafe
    if (options.changeFavoriteOrder) {
        monitor.on("cafe.favorite-menu", OnFoundCafe.favoriteMenu);
    }

    // cafe-intro
    if (options.cafeDefaultNewTab || options.optimizeCafe) {
        monitor.on("cafe-intro.list-type-element", OnFoundCafeIntro.listTypeElement);
        monitor.on("cafe-intro.image-type-element", OnFoundCafeIntro.imageTypeElement);
    }
    if (options.cafeDefaultNewTab || (options.newTabRedirectArticle && options.optimizeCafe)) {
        monitor.on("cafe-intro.card-type-element", OnFoundCafeIntro.cardTypeElement);
    }
    if (options.optimizeCafe) {
        monitor.on("cafe-intro.board-head-element", OnFoundCafeIntro.boardHeadElement);
    }

    // document
    if (options.pageArrowShortcut || options.searchCommentShortcut) {
        monitor.on("cafe.document", OnFoundDocument.cafeDocument);
        monitor.on("iframe.document", OnFoundDocument.iframeDocument);
        monitor.on("only.document", OnFoundDocument.onlyDocument);
        monitor.on("app.document", OnFoundDocument.appDocument);
        monitor.on("article-list.document", OnFoundDocument.articleListDocument);
        monitor.on("article-search-list.document", OnFoundDocument.articleSearchListDocument);
    }

    // app.member
    if ((options.cafeDefaultNewTab && options.cafeDefaultBackground)
        || (options.newTabRedirectArticle && options.optimizeCafe)) {
        monitor.on("app.member.list-type-element", OnFoundMember.listTypeElement);
        monitor.on("app.member.card-type-element", OnFoundMember.cardTypeElement);
    }

    // app.popular
    if (options.cafeDefaultNewTab || options.optimizeCafe) {
        monitor.on("app.popular.list-type-element", OnFoundPopular.listTypeElement);
    }

    monitor.ready();

    console.debug(monitor); // debug

    window.addEventListener("DOMContentLoaded", () => {
        monitor.call("document", document);
    });
})();
