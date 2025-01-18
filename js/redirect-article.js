"use strict";

(async () => {
    const options = await Options.get();

    if (!options.enableApp) {
        return;
    }
    if (!options.newTabRedirectArticle) {
        return;
    }

    const info = PCArticleURLParser.getInfo(location.pathname, location.search);
    if (!info) {
        return;
    }

    const url = await PCArticleURLParser.getArticleOnlyURL(info)
    const isComplete = info.type === PCArticleURLParser.TYPE_ARTICLE_ONLY && !url;
    if (isComplete) {
        return addOriginalBackPage(info);
    }
    if (!url) {
        return;
    }

    if (history.length > 1) {
        return;
    }

    return location.replace(url);

    async function addOriginalBackPage(info) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { cafeId, articleId } = info;
        const pageStatus = await getPageStatus(cafeId, articleId);
        if (!pageStatus) {
            return;
        }

        switch (pageStatus) {
            case 401: // no-login
                writeMessage("로그인이 필요합니다. 뒤로가기를 눌러주세요.");
                break;
            case 404: // no-article
                writeMessage("없는 게시글입니다. 뒤로가기를 눌러주세요.");
                break;
        }

        if (history.length <= 1) {
            const cafeName = await Session.getCafeName(cafeId);
            if (cafeName) {
                switch (pageStatus) {
                    case 200: // ok
                    case 401: // no-login
                        history.replaceState({ NCOP_ORIG: `https://cafe.naver.com/${cafeName}/${articleId}` }, "");
                        break;
                    case 404: // no-article
                        history.replaceState({ NCOP_ORIG: `https://cafe.naver.com/${cafeName}` }, "");
                        break;
                }
                history.pushState(null, "");
            }
        }

        window.addEventListener("popstate", (event) => {
            const url = event.state?.NCOP_ORIG;
            if (url) {
                location.replace(url);
            }
        });

        function writeMessage(msg) {
            const app = document.querySelector("#app");
            if (app) {
                const textNode = document.createTextNode(msg);
                app.insertBefore(textNode, app.firstChild);
            }
        }
    }

    // 200: ok
    // 401: no-login
    // 404: no-article
    async function getPageStatus(cafeId, articleId) {
        try {
            const url = `https://apis.naver.com/cafe-web/cafe-articleapi/v3/cafes/${cafeId}/articles/${articleId}?query=&useCafeId=true&requestFrom=A`;
            const res = await fetch(url, { method: "HEAD", credentials: "include" });
            return res?.status;
        } catch (e) { console.error(e); }
    }
})();

/* TEST
https://cafe.naver.com/steamindiegame/13999369
https://cafe.naver.com/ArticleRead.nhn?clubid=27842958&page=1&menuid=1150&boardtype=L&articleid=13999369&referrerAllArticles=false
https://cafe.naver.com/ca-fe/ArticleRead.nhn?clubid=27842958&page=1&menuid=1150&boardtype=L&articleid=13999369&referrerAllArticles=false
https://cafe.naver.com/steamindiegame?iframe_url=%2FArticleRead.nhn%3Fclubid%3D27842958%26articleid%3D13999369%26referrerAllArticles%3Dfalse%26menuid%3D1150%26page%3D1%26boardtype%3DL
https://cafe.naver.com/steamindiegame?iframe_url_utf8=%2FArticleRead.nhn%253Fclubid%3D27842958%2526page%3D1%2526menuid%3D1150%2526boardtype%3DL%2526articleid%3D13999369%2526referrerAllArticles%3Dfalse
https://cafe.naver.com/ca-fe/cafes/27842958/articles/13999369?referrerAllArticles=false&menuid=1150&page=1&boardtype=L
https://cafe.naver.com/ca-fe/cafes/27842958/articles/13999369?oldPath=%2FArticleRead.nhn%3FreferrerAllArticles%3Dfalse%26menuid%3D1150%26page%3D1%26boardtype%3DL%26clubid%3D27842958%26articleid%3D19012958
https://cafe.naver.com/ca-fe/cafes/30660728/articles/48794 (no-login)
https://cafe.naver.com/ca-fe/cafes/27842958/articles/28953115 (no-article)
*/
