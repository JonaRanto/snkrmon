var browsersApi = {
    webNavigation: chrome.webNavigation,
    tabs: chrome.tabs,
    runtime: chrome.runtime,
    contextMenus: chrome.contextMenus,
    management: chrome.management,
    webRequest: chrome.webRequest,
    browserAction: chrome.browserAction,
    extension: {
        getURL: chrome.extension.getURL
    },
    storage: chrome.storage,
    windows: chrome.windows,
    cookies: chrome.cookies
};
