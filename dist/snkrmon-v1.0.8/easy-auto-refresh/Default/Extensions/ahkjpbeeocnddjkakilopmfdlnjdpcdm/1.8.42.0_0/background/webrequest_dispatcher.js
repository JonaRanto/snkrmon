var webrequest;
(function (webrequest) {
    var dispatcher;
    (function (dispatcher) {
        function subscribeToRequestEvents(onBeforeRequestHandler, onBeforeSendHeaders, onHeadersReceived, onAuthRequired, onCompleted, onError) {
            var filter = { urls: ["https://*/*"] };
            var blockingOption = ["blocking"];
            browsersApi.webRequest.onBeforeRequest.addListener(onBeforeRequestHandler, filter, blockingOption);
            browsersApi.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeaders, filter, blockingOption);
            browsersApi.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, blockingOption);
            browsersApi.webRequest.onAuthRequired.addListener(onAuthRequired, filter, blockingOption);
            browsersApi.webRequest.onCompleted.addListener(onCompleted, filter, []);
            browsersApi.webRequest.onErrorOccurred.addListener(onError, filter);
        }
        dispatcher.subscribeToRequestEvents = subscribeToRequestEvents;
        function unsubscribeFromRequestEvents(onBeforeRequestHandler, onBeforeSendHeaders, onHeadersReceived, onAuthRequired, onCompleted, onError) {
            browsersApi.webRequest.onBeforeRequest.removeListener(onBeforeRequestHandler);
            browsersApi.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
            browsersApi.webRequest.onHeadersReceived.removeListener(onHeadersReceived);
            browsersApi.webRequest.onAuthRequired.removeListener(onAuthRequired);
            browsersApi.webRequest.onCompleted.removeListener(onCompleted);
            browsersApi.webRequest.onErrorOccurred.removeListener(onError);
        }
        dispatcher.unsubscribeFromRequestEvents = unsubscribeFromRequestEvents;
    })(dispatcher = webrequest.dispatcher || (webrequest.dispatcher = {}));
})(webrequest || (webrequest = {}));
