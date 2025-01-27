class OnFoundCafe {

    /** @param {Options} options */
    static getIndex(options) {
        return [
            ["cafe.favorite-menu", this.favoriteMenu, options.changeFavoriteOrder]
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
}

function arrangeFavorite(ul, favoriteOrder) {
    const itemArray = [...ul.querySelectorAll("li")].map(li => {
        const a = li.querySelector("a");
        const matches = a?.id?.match(/^favoriteMenuLink(?<idStr>\d+)$/);
        if (matches) {
            const { idStr } = matches.groups;
            const id = parseInt(idStr);
            return { li, id };
        }
    }).filter(item => item !== undefined);
    const favoriteOrderSet = new Set(favoriteOrder);
    const existMap = new Map();
    let index = 0;
    for (const item of itemArray) {
        if (favoriteOrderSet.has(item.id)) {
            existMap.set(item.id, item);
        } else {
            item.index = index;
            index += 1;
        }
    }
    for (const id of favoriteOrder) {
        const item = existMap.get(id);
        if (item) {
            item.index = index;
            index += 1;
        }
    }
    const LIS = getLIS(itemArray);
    let indexBefore = -1;
    for (const lisItem of LIS) {
        if (lisItem.index === indexBefore + 1) {
            indexBefore = lisItem.index;
            continue;
        }
        const part = itemArray
            .filter(item => indexBefore < item.index && item.index < lisItem.index)
            .sort((a, b) => a.index - b.index);
        for (const item of part) {
            ul.insertBefore(item.li, lisItem.li);
        }
        indexBefore = lisItem.index;
    }
    if (indexBefore < itemArray.length - 1) {
        const part = itemArray
            .filter(item => indexBefore < item.index)
            .sort((a, b) => a.index - b.index);
        for (const item of part) {
            ul.insertBefore(item.li, null);
        }
    }
    // old method
    // for (const id of favoriteOrder) {
    //     const a = ul.querySelector(`#favoriteMenuLink${id}`);
    //     const li = a?.closest("li");
    //     if (li) {
    //         ul.appendChild(li);
    //     }
    // }
    // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
    function getLIS(itemArray) {
        const N = itemArray.length;
        const P = []; // array of length N
        const M = [-1]; // array of length N + 1
        let L = 0;
        for (let i = 0; i < N; i++) {
            // Binary search for the smallest positive l ≤ L
            // such that X[M[l]] >= X[i]
            let lo = 1;
            let hi = L + 1;
            while (lo < hi) {
                const mid = lo + Math.floor((hi - lo) / 2); // lo <= mid < hi
                if (itemArray[M[mid]].index >= itemArray[i].index) {
                    hi = mid;
                } else {
                    lo = mid + 1;
                }
            }
            // After searching, lo == hi is 1 greater than the
            // length of the longest prefix of X[i]
            const newL = lo;
            // The predecessor of X[i] is the last index of
            // the subsequence of length newL-1
            P[i] = M[newL - 1];
            M[newL] = i;
            if (newL > L) {
                // If we found a subsequence longer than any we've
                // found yet, update L
                L = newL;
            }
        }
        // Reconstruct the longest increasing subsequence
        // It consists of the values of X at the L indices:
        // ...,  P[P[M[L]]], P[M[L]], M[L]
        const S = []; // array of length L
        let k = M[L];
        for (let j = L - 1; j >= 0; j--) {
            S[j] = itemArray[k];
            k = P[k];
        }
        return S;
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
