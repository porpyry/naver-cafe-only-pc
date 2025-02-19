class OnFoundCafe {

    /** @param {Options} options */
    static getIndex(options) {
        return [
            ["cafe.favorite-menu", this.favoriteMenu, options.changeFavoriteOrder],
            ["cafe.manager-profile", this.managerProfile, options.optimizeCafe],
            ["cafe.popular-menu", this.popularMenu, options.optimizeCafe]
        ];
    }

    /** @this {HTMLULElement}
      * @param {Options} options */
    static favoriteMenu(/*options*/) {
        // (1) 즐겨찾기 순서 변경

        // (1)
        const cafeId = new URLSearchParams(this.querySelector("li a")?.search).get("search.clubid");
        if (cafeId) {
            chrome.storage.sync.get("favoriteOrder").then(items => {
                const favoriteOrder = items.favoriteOrder?.find(item => item.cafeId === cafeId)?.favoriteOrder;
                if (favoriteOrder) {
                    arrangeFavorite(this, favoriteOrder);
                }
                for (const a of this.querySelectorAll("li a")) {
                    a.addEventListener("dragstart", onDragStartFavoriteMenu);
                    a.addEventListener("dragenter", preventDefaultFunction);
                    a.addEventListener("dragover", preventDefaultFunction);
                    a.addEventListener("drop", onDropFavoriteMenu);
                }
            });
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static managerProfile(/*options*/) {
        // (1) 카페 최적화 (f-e 링크를 기존 링크로 변경)

        // (1)
        const infoFE = PCURLParserFE.getInfo(this.pathname, this.search);
        if (infoFE?.type === PCURLParserFE.TYPE_MEMBER) {
            this.href = `/ca-fe/cafes/${infoFE.cafeId}/members/${infoFE.memberCode}`;
            this.target = "cafe_main";
        }
    }

    /** @this {HTMLAnchorElement}
      * @param {Options} options */
    static popularMenu(/*options*/) {
        // (1) 카페 최적화 (f-e 링크를 기존 링크로 변경)

        // (1)
        const infoFE = PCURLParserFE.getInfo(this.pathname, this.search);
        if (infoFE?.type === PCURLParserFE.TYPE_POPULAR) {
            this.href = `/ca-fe/cafes/${infoFE.cafeId}/popular`;
            this.target = "cafe_main";
        }
    }
}

function arrangeFavorite(ul, favoriteOrder) {
    const doc = ul.ownerDocument;
    for (const id of favoriteOrder) {
        const a = doc.getElementById(`favoriteMenuLink${id}`);
        const li = a?.closest("li");
        if (li) {
            ul.appendChild(li);
        }
    }
}

function onDragStartFavoriteMenu(event) {
    event.dataTransfer.setData("application/ncop.a.id", this.id);
}

function onDropFavoriteMenu(event) {
    event.preventDefault();
    const dropFromId = event.dataTransfer.getData("application/ncop.a.id");
    const dropToId = event.target.id;
    const doc = event.target.ownerDocument;
    const aDropFrom = doc.getElementById(dropFromId);
    const aDropTo = doc.getElementById(dropToId);
    const liDropFrom = aDropFrom?.closest("li");
    const liDropTo = aDropTo?.closest("li");
    const ul = event.target.closest("ul");
    if (!ul || !liDropFrom || !liDropTo) {
        return;
    }
    const cafeId = new URLSearchParams(aDropTo.search).get("search.clubid");
    if (!cafeId) {
        return;
    }
    const liArray = [...ul.children];
    const fromIndex = liArray.indexOf(liDropFrom);
    const toIndex = liArray.indexOf(liDropTo);
    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return;
    }
    if (toIndex < fromIndex) {
        ul.insertBefore(liDropFrom, liDropTo);
    } else {
        ul.insertBefore(liDropFrom, liDropTo.nextSibling);
    }
    const favoriteOrder = [...ul.querySelectorAll("li a")].map(a => {
        const matches = a.id?.match(/^favoriteMenuLink(?<idStr>\d+)$/);
        if (matches) {
            const { idStr } = matches.groups;
            return parseInt(idStr);
        }
    }).filter(item => item !== undefined);
    chrome.storage.sync.get("favoriteOrder").then(items => {
        if (!items.favoriteOrder) {
            items.favoriteOrder = [];
        }
        const favoriteOrderItem = items.favoriteOrder.find(item => item.cafeId === cafeId);
        if (favoriteOrderItem) {
            favoriteOrderItem.favoriteOrder = favoriteOrder;
        } else {
            items.favoriteOrder.push({ cafeId, favoriteOrder });
        }
        chrome.storage.sync.set(items);
    });
}
