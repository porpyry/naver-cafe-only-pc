class OnFoundCafe {

    /** @param {Options} options */
    static getIndex(options) {
        return [
            ["cafe.favorite-menu", OnFoundCafe.favoriteMenu, options.changeFavoriteOrder]
        ];
    }

    /** @this {HTMLULElement}
      * @param {Options} options */
    static async favoriteMenu(options) {
        // (1) 즐겨찾기 순서 변경

        // (1)
        if (options.changeFavoriteOrder) {
            const favoriteOrder = (await chrome.storage.sync.get("favoriteOrder")).favoriteOrder;
            if (favoriteOrder instanceof Array) {
                for (const idInt of favoriteOrder) {
                    const a = this.querySelector(`#favoriteMenuLink${idInt}`);
                    const li = a?.closest("li");
                    if (li) {
                        this.appendChild(li);
                    }
                }
            }
            for (const a of this.querySelectorAll("li a")) {
                a.addEventListener("dragstart", onDragStartFavoriteMenu);
                a.addEventListener("dragenter", preventDefaultFunction);
                a.addEventListener("dragover", preventDefaultFunction);
                a.addEventListener("drop", onDropFavoriteMenu);
            }
        }
    }
}

function onDragStartFavoriteMenu(event) {
    event.dataTransfer.setData("application/ncop.a.id", this.id);
}

function preventDefaultFunction(event) {
    event.preventDefault();
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
    const favoriteOrder = [...ul.querySelectorAll("li a")].map((a) => {
        const matches = a.id?.match(/^favoriteMenuLink(?<idInt>\d+)$/);
        if (matches) {
            const { idInt } = matches.groups;
            return parseInt(idInt);
        }
    });
    if (favoriteOrder.some(num => num === undefined)) {
        return;
    }
    chrome.storage.sync.set({ favoriteOrder });
}
