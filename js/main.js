"use strict";

(async () => {
    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }

    const monitor = new Monitor(options);

    if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {
        monitor.on("app.article.content-link-element", OnFoundArticle.contentLinkElement);
        monitor.on("app.article.content-oglink-element", OnFoundArticle.contentOglinkElement);
    }

    if (options.optimizeCafe) {
        monitor.on("app.article.bottomright-board-link", OnFoundArticle.bottomrightBoardLink);
    }

    if (options.preventRenewalPage) {
        monitor.on("app.article.topleft-board-link", OnFoundArticle.topleftBoardLink);
    }

    if (options.cafeDefaultNewTab) {
        monitor.on("article-list.list-type-element", OnFoundArticleList.listTypeElement);
        monitor.on("article-list.image-type-element", OnFoundArticleList.imageTypeElement);
        monitor.on("article-list.card-type-element", OnFoundArticleList.cardTypeElement);
    }

    if (options.cafeDefaultNewTab) {
        monitor.on("article-search-list.list-type-element", OnFoundArticleSearchList.listTypeElement);
    }

    if (options.changeFavoriteOrder) {
        monitor.on("cafe.favorite-menu", OnFoundCafe.favoriteMenu);
    }

    if (options.cafeDefaultNewTab) {
        monitor.on("cafe-intro.list-type-element", OnFoundCafeIntro.listTypeElement);
        monitor.on("cafe-intro.image-type-element", OnFoundCafeIntro.imageTypeElement);
        monitor.on("cafe-intro.card-type-element", OnFoundCafeIntro.cardTypeElement);
    }

    if (options.pageArrowShortcut || options.searchCommentShortcut) {
        monitor.on("cafe.document", OnFoundDocument.cafeDocument);
        monitor.on("iframe.document", OnFoundDocument.iframeDocument);
        monitor.on("only.document", OnFoundDocument.onlyDocument);
        monitor.on("app.document", OnFoundDocument.appDocument);
        monitor.on("article-list.document", OnFoundDocument.articleListDocument);
        monitor.on("article-search-list.document", OnFoundDocument.articleSearchListDocument);
    }

    if (options.cafeDefaultNewTab && options.cafeDefaultBackground) {
        monitor.on("app.member.list-type-element", OnFoundMember.listTypeElement);
        monitor.on("app.member.card-type-element", OnFoundMember.cardTypeElement);
    }

    if (options.cafeDefaultNewTab) {
        monitor.on("app.popular.list-type-element", OnFoundPopular.listTypeElement);
    }

    monitor.ready();

    console.debug(monitor); // debug

    window.addEventListener("DOMContentLoaded", () => {
        monitor.call("document", document);
    });
})();
