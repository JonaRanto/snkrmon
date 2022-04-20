if (browsersApi.browserAction && !browsersApi.browserAction.setTitle)
    browsersApi.browserAction.setTitle = function () { };
if (!browsersApi.tabs.reload)
    browsersApi.tabs.reload = function () { browsersApi.tabs.executeScript({ code: 'window.location.reload()' }); };
