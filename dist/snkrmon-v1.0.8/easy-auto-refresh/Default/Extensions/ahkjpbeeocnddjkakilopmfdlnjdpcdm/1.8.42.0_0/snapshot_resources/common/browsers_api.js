const browsersApi = {
    runtime: chrome.runtime
    , cookies: chrome.cookies
    , extension: {
        getURL: chrome.extension.getURL
    }
    , windows: chrome.windows
    , tabs: chrome.tabs
};

