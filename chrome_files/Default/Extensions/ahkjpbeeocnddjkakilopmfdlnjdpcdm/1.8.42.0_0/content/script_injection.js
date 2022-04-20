(function () {
    function getStartupParameters(callback) {
        browsersApi.runtime.sendMessage({
            command: 'getContentStartupParameters' }, function (response) {
            if (response === null) {
                setTimeout(function () {
                    getStartupParameters(callback);
                }, 100);
            }
            else {
                callback(response.isConnectedToProduct, response.tabId, response.pluginId);
            }
        });
    }
    getStartupParameters(function (isConnectedToProduct, currentTabId, pluginId) {
        if (isConnectedToProduct) {
            plugin.callOnDocumentInteractiveOrTimeout(function () {
                initApiInjection(currentTabId, pluginId);
            });
        }
    });
})();
