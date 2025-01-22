"use strict";

// 트리에서 해당하는 요소가 있으면 리졸브하고, 없으면 기다렸다가 리졸브한다.
// subtree 가 true 면 자손 중에서, false 면 자식 중에서 검색한다.
// condition: (el) => boolean 이 주어지면, true 가 나올 때까지 계속 탐색한다.
async function watchSelector(parent, selectors, subtree = false, condition) {
    return new Promise((resolve) => {
        const found = parent.querySelector((subtree ? "" : ":scope > ") + selectors);
        if (found) {
            if (!condition || condition(found)) {
                return resolve(found);
            }
        }

        new MutationObserver((mutationList, observer) => {
            for (const mutation of mutationList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE && node.matches(selectors)) {
                        if (!condition || condition(node)) {
                            resolve(node);
                            observer.disconnect();
                            return;
                        }
                    }
                }
            }
        }).observe(parent, { childList: true, subtree });
    });
}

// 자식 중에서 해당하는 요소가 나타날 때마다 콜백을 호출한다.
// 해당하는 요소가 이미 존재한다면 바로 한 번 호출한다.
// callback: (foundElement) => any
function watchingChild(parent, selectors, callback) {
    new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && node.matches(selectors)) {
                    callback(node);
                }
            }
        }
    }).observe(parent, { childList: true });

    const found = parent.querySelector(":scope > " + selectors);
    if (found) {
        callback(found);
    }
}

/** @this {HTMLElement} */
function openInBackgroundListener(event) {
    let url;
    switch (this.tagName) {
        case "A":
            url = this.href;
            break;
        case "SPAN":
            if (this.parentElement.tagName !== "A") {
                return;
            }
            url = this.parentElement.href;
            break;
        default:
            return;
    }
    event.preventDefault();
    chrome.runtime.sendMessage(null, { type: "cafeDefaultBackground", url });
}

function createClickShieldBox(a, passDefault) {
    if (a?.classList.contains("NCOP_CSR")) { // Click Shield Relative
        return;
    }
    a.classList.add("NCOP_CSR");
    const span = a.ownerDocument.createElement("span");
    span.classList.add("NCOP_CSA"); // Click Shield Alsolute
    span.addEventListener("click", (event) => {
        if (passDefault && !(event.ctrlKey || event.shiftKey)) {
            return;
        }
        event.stopPropagation();
    });
    a.appendChild(span);
    return span;
}

function createClickShieldSpan(node, passDefault) {
    if (!node) {
        return;
    }
    let span;
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "SPAN") {
        span = node;
    } else if (node.nodeType === Node.TEXT_NODE) {
        span = node.ownerDocument.createElement("span");
        node.parentNode.insertBefore(span, node);
        span.appendChild(node);
    } else {
        return;
    }
    if (span?.classList.contains("NCOP_CSS")) { // Click Shield Span
        return;
    }
    span.classList.add("NCOP_CSS");
    span.addEventListener("click", (event) => {
        if (passDefault && !(event.ctrlKey || event.shiftKey)) {
            return;
        }
        event.stopPropagation();
    });
    return span;
}

function setSearchParam(url, param, value) {
    url = new URL(url);
    url.searchParams.set(param, value);
    return url.href;
}

function commentFocusURL(url) {
    return setSearchParam(url, "commentFocus", true);
}

function groupChildrenWithSpan(parent) {
    if (parent && !parent.querySelector("span.NCOP_GroupSpan")) {
        const span = parent.ownerDocument.createElement("span");
        span.classList.add("NCOP_GroupSpan");
        span.append(...parent.childNodes);
        parent.appendChild(span);
    }
}

function isIframeDocumentLoaded(iframe) {
    return iframe
        && iframe.contentDocument?.readyState === "complete"
        && iframe.contentWindow.location.hostname !== "";
}
