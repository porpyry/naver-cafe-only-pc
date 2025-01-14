"use strict";

(async () => {
    const options = await getOptions;

    if (!options.enableApp) {
        return;
    }
    if (!options.MTP_redirect) {
        return;
    }

    const mInfo = getMobileUrlInfo(location.href);
    if (!mInfo) {
        return;
    }

    const pUrl = getMTPUrl(mInfo);
    if (!pUrl) {
        return;
    }

    let url = pUrl;
    if (options.PTA_redirect) {
        const pInfo = getUrlInfo(pUrl);
        const aUrl = await getPTAUrl(pInfo);
        if (aUrl) {
            url = aUrl;
        }
    }

    location.replace(url);
})();
