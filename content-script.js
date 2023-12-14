function init() {
    if (location.hostname === "cafe.naver.com") {
        replaceMFromLinks();
    }
    if (location.hostname === "m.cafe.naver.com") {
        redirectToPC();
    }
}

function replaceMFromLinks() {
    const app = document.querySelector("#app");
    if (app) {
        findNext(app, "Article", async (article) => {
            const articleWrap = await findNext(article, "article_wrap");
            const links = articleWrap.querySelectorAll("a.se-link");
            const oglinks = articleWrap.querySelectorAll(".se-module-oglink");
            changeLinks(links);
            changeOglinks(oglinks);
        });
    }
}

function findNext(parent, className, callback) {
    const run = (caller) => {
        const findChild = () => {
            let foundChild;
            for (const child of parent.children) {
                if (child.classList.contains(className)) {
                    foundChild = child;
                    break;
                }
            }
            if (foundChild) caller(foundChild);
            return foundChild;
        };
        if (!findChild() || callback) {
            new MutationObserver((mutations, observer) => {
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.classList?.contains(className)) {
                            if (findChild()) {
                                if (!callback) observer.disconnect();
                                return;
                            }
                        }
                    }
                }
            }).observe(parent, { childList: true });
        }
    };
    if (callback) return run(callback);
    return new Promise((resolve) => run(resolve));
}

function changeLinks(links) {
    for (const link of links) {
        link.href = removeM(link.href);
        link.textContent = removeM(link.textContent);
    }
}

function changeOglinks(oglinks) {
    for (const oglink of oglinks) {
        const thumbnail = oglink.querySelector("a.se-oglink-thumbnail");
        const info = oglink.querySelector("a.se-oglink-info");
        const infoUrl = info?.querySelector("p.se-oglink-url");
        if (thumbnail) thumbnail.href = removeM(thumbnail.href);
        if (info) info.href = removeM(info.href);
        if (infoUrl) infoUrl.textContent = removeM(infoUrl.textContent);
    }
}

function removeM(text) {
    return text.replace("m.cafe.naver.com", "cafe.naver.com");
}

function redirectToPC() {
    // cafeName
    {
        const regexp = /^\/(ca-fe\/)?(?<cafeName>\w+)\/?$/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeName } = matches.groups;
            if (cafeName)
                return location.replace(`https://cafe.naver.com/${cafeName}`);
        }
    }
    // cafeId, menuId
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/menus\/(?<menuId>\d+)/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeId, menuId } = matches.groups;
            if (cafeId && menuId)
                return location.replace(`https://cafe.naver.com/ArticleList.nhn?search.clubid=${cafeId}&search.menuid=${menuId}`);
        }
    }
    // cafeId, articleId
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeId>\d+)\/articles\/(?<articleId>\d+)/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeId, articleId } = matches.groups;
            if (cafeId && articleId)
                return location.replace(`https://cafe.naver.com/ArticleRead.nhn?clubid=${cafeId}&articleid=${articleId}`);
        }
    }
    // cafeName, articleId
    {
        const regexp = /^\/ca-fe\/web\/cafes\/(?<cafeName>\w+)\/articles\/(?<articleId>\d+)/;
        const matches = location.pathname.match(regexp);
        if (matches) {
            const { cafeName, articleId } = matches.groups;
            if (cafeName && articleId)
                return location.replace(`https://cafe.naver.com/${cafeName}/${articleId}`);
        }
    }
}

init();
