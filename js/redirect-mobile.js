"use strict";

(async () => {
    if (history.length > 1) {
        return;
    }

    const options = await Options.get();
    if (!options.enableApp) {
        return;
    }
    if (!options.newTabRedirectMobile) {
        return;
    }

    const info = MobileURLParser.getInfo(location.pathname, location.search);
    if (!info) {
        return;
    }

    let url;
    if (!options.newTabRedirectArticle) {
        url = MobileURLParser.getArticleURL(info);
    } else {
        url = await MobileURLParser.getArticleOnlyURL(info)
    }
    if (!url) {
        return;
    }

    location.replace(url);
})();

/* TEST
https://m.cafe.naver.com/steamindiegame/13999369
https://m.cafe.naver.com/ca-fe/steamindiegame/13999369
https://m.cafe.naver.com/ca-fe/web/cafes/steamindiegame/articles/13999369?useCafeId=false
https://m.cafe.naver.com/ca-fe/web/cafes/27842958/articles/13999369
*/
