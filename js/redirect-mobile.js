"use strict";

(async () => {
    if (history.length > 1) {
        return;
    }

    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }
    if (!options.newTabOnlyPC) {
        return;
    }

    const info = MobileURLParser.getInfo(location.pathname, location.search);
    if (!info) {
        return;
    }

    let url;
    if (options.newTabOnlyArticle) {
        url = await MobileURLParser.getArticleOnlyURL(info)
    } else {
        url = await MobileURLParser.getArticleURL(info);
    }
    if (!url) {
        return;
    }

    location.replace(url);
})();
