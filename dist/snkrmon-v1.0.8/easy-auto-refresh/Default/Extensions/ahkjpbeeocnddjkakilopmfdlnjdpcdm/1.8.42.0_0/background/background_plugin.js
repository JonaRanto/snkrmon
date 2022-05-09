(function Plugin() {
    var m_isConnectedToProduct = false;
    var m_tabs = new Tabs(BrowserName);
    var m_factorySettings = new FactorySettings();
    var m_buttonControl = new ButtonControl(m_factorySettings.getButton());
    var m_queuedRequests = [];
    var m_navigatedFrames = {};
    function IsSenderPopup(sender) {
        return sender.id === browsersApi.runtime.id && sender.url === browsersApi.runtime.getURL("popup/popup.html");
    }
    function handlePopupStartupParameters(request, sender, sendResponse) {
        if ("getPopupStartupParameters" === request.command) {
            if (IsSenderPopup(sender)) {
                handleGetPopupStartupParameters(request, sender, sendResponse);
                return true;
            }
        }
    }
    function handleRuntimeMessages(request, sender, sendResponse) {
        if ("reloadActiveTab" === request.command) {
            if (IsSenderPopup(sender))
                handleReloadActiveTabRequest();
        }
        else if ("trace" === request.command) {
            handleTraceRequest(request);
        }
        else if ("getContentStartupParameters" === request.command) {
            handleGetContentStartupParameters(request, sender, sendResponse);
        }
        else if ("isFrameRedirected" === request.command) {
            handleCheckRedirectedFrame(request, sender, sendResponse);
        }
    }
    function trySendResponse(sendResponse, responseObject) {
        try {
            sendResponse(responseObject);
        }
        catch (e) {
            console.debug("Response was not sent, sender page was closed or redirected: ", e);
        }
    }
    function handleTraceRequest(request) {
        traceAsIs(request.message || "<null message>");
    }
    function processQueuedRuntimeMessages() {
        m_queuedRequests.forEach(function (msg) {
            handleRuntimeMessages(msg.request, msg.sender, msg.sendResponse);
        });
        m_queuedRequests = [];
    }
    function handleGetContentStartupParameters(request, sender, sendResponse) {
        var id = "";
        if (browsersApi.runtime && browsersApi.runtime.id)
            var id = browsersApi.runtime.id;
        trySendResponse(sendResponse, {
            tabId: registerTab(sender.tab),
            isConnectedToProduct: m_isConnectedToProduct,
            pluginId: id
        });
    }
    function handleCheckRedirectedFrame(request, sender, sendResponse) {
        var frames = m_navigatedFrames[sender.tab.id];
        if (frames) {
            var redirected = frames.find(function (element) {
                return element === sender.frameId;
            }) !== undefined;
            trySendResponse(sendResponse, {
                isRedirected: redirected
            });
        }
    }
    function handleGetPopupStartupParameters(request, sender, sendResponse) {
        browsersApi.tabs.query({ active: true, windowType: "normal", currentWindow: true }, function (result) {
            var tabId = "";
            if (result.length)
                tabId = registerTab(result[0]);
            trySendResponse(sendResponse, {
                tabId: tabId,
                url: (result.length > 0 ? result[0].url : ""),
                isConnectedToProduct: m_isConnectedToProduct
            });
        });
    }
    function handleReloadActiveTabRequest() {
        browsersApi.tabs.reload();
    }
    function OpenNewTab(targetUrl) {
        browsersApi.tabs.create({ url: targetUrl });
    }
    function ReloadTab(encodedTabId) {
        var id = m_tabs.identify(encodedTabId);
        browsersApi.tabs.reload(id, { bypassCache: true });
    }
    function registerTab(tab) {
        var encodedTabId = m_tabs.register(tab.windowId, tab.id);
        return encodedTabId;
    }
    function buildApi(hasToolbar) {
        var api = {
            onConnect: noThrow(onConnect),
            onDisconnect: noThrow(onDisconnect),
            openNewTab: OpenNewTab,
            reloadTab: ReloadTab,
        };
        if (hasToolbar) {
            api.toolbarButton = {
                setDefaultState: noThrow(function (state) {
                    m_buttonControl.setDefaultState(state);
                }),
                setStateForTab: noThrow(function (encodedTabId, state) {
                    var tabId = m_tabs.identify(encodedTabId);
                    m_buttonControl.setState(tabId, state);
                }),
            };
        }
        return api;
    }
    function noThrow(func) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            try {
                return func.apply(func, arguments);
            }
            catch (e) {
                var msg = func.name + "({})".replace("{}", args) + " failed: " + e;
                trace(msg);
                console.error(msg);
            }
        };
    }
    function publishApi(hasToolbar) {
        var msg = "Publish plugin API, hasToolbar = " + hasToolbar.toString();
        console.debug(msg);
        trace(msg);
        window.plugin = buildApi(hasToolbar);
    }
    function registerExistingTabs() {
        browsersApi.tabs.query({}, function (tabs) {
            tabs.forEach(registerTab);
        });
    }
    function onCommitted(details) {
        if (details.frameId !== 0 && (details.transitionQualifiers.includes("client_redirect") || details.transitionQualifiers.includes("server_redirect"))) {
            if (!m_navigatedFrames || (details.tabId in m_navigatedFrames === false))
                m_navigatedFrames[details.tabId] = [];
            m_navigatedFrames[details.tabId].push(details.frameId);
        }
    }
    function clearNavigatedFrames(tabId) {
        if (tabId in m_navigatedFrames)
            delete m_navigatedFrames[tabId];
    }
    function trackTabChanges() {
        browsersApi.tabs.onCreated.addListener(function (tab) {
            registerTab(tab);
        });
        browsersApi.tabs.onRemoved.addListener(function (tabId) {
            m_tabs.forget(tabId);
            clearNavigatedFrames(tabId);
        });
        browsersApi.tabs.onReplaced.addListener(function (newTabId, oldTabId) {
            m_tabs.forget(oldTabId);
            clearNavigatedFrames(oldTabId);
            browsersApi.tabs.get(newTabId, registerTab);
        });
    }
    function onConnect() {
        console.debug("Connection with the product is discovered.");
        m_isConnectedToProduct = true;
        trace(browsersApi.runtime.id + "/" + browsersApi.runtime.getManifest().version + "/" + navigator.userAgent.toString() + " is online.");
        browsersApi.runtime.onMessage.addListener(handleRuntimeMessages);
        browsersApi.runtime.onMessage.removeListener(queueRuntimeMessages);
        processQueuedRuntimeMessages();
    }
    function onDisconnect() {
        console.warn("Connection with the product is lost.");
        m_isConnectedToProduct = false;
        browsersApi.runtime.onMessage.removeListener(handleRuntimeMessages);
        browsersApi.runtime.onMessage.addListener(queueRuntimeMessages);
        m_buttonControl.resetToFactory();
    }
    function queueRuntimeMessages(request, sender, sendResponse) {
        m_queuedRequests.push({
            request: request,
            sender: sender,
            sendResponse: sendResponse
        });
        return true;
    }
    function Initialize() {
        var hasToolbarApi = false;
        trackTabChanges();
        hasToolbarApi = true;
        publishApi(hasToolbarApi);
        browsersApi.runtime.onMessage.addListener(handlePopupStartupParameters);
        KasperskyLab.StartSession();
    }
    browsersApi.runtime.onMessage.addListener(queueRuntimeMessages);
    browsersApi.webNavigation.onCommitted.addListener(onCommitted);
    Initialize();
})();
