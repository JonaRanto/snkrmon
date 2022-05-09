var KasperskyLab = (function(ns) {
    ns.PREFIX = "http://gc.kis.v2.scr.kaspersky-labs.com/";
    ns.IsWebExtension = function(){ return true; };
    return ns;
})( KasperskyLab || {});
var KasperskyLab = (function(ns) {
    ns.PLUGINS_LIST = null;
    ns.LIGHT_PLUGIN_API_KEY = "klTabId_kis";
    return ns;
})( KasperskyLab || {});
 var KasperskyLab = (function IeJsonMain(context) 
{
    context['JSONStringify'] = JSON.stringify;
    context['JSONParse'] = JSON.parse;
    return context;
})(KasperskyLab || {});
 (function CommonMain(ns)
{


    ns.EmptyFunc = function EmptyFunc()
    {
    };


    ns.FunctionBind = Function.prototype.bind;

    ns.MaxRequestDelay = 2000;

    ns.Log = function Log(message)
    {
        try
        {
            if (!message)
                return;
            if (window.plugin && window.plugin.log)
                window.plugin.log(message);
        }
        catch (e)
        {} 
    };

    ns.SessionLog = ns.EmptyFunc;

    ns.SessionError = ns.EmptyFunc;

    ns.GetDomainName = function GetDomainName() 
    {
        return document.location.hostname;
    };

    function GetHostAndPort(url)
    {
        var hostBeginPos = url.indexOf("//");
        if (hostBeginPos === -1)
        {
            url = document.baseURI || ""; 
            hostBeginPos = url.indexOf("//");
            if (hostBeginPos === -1)
                return "";
        }
        hostBeginPos += 2;
        var hostEndPos = url.indexOf("/", hostBeginPos);
        if (hostEndPos === -1)
            hostEndPos = url.length;
        var originParts = url.substring(0, hostEndPos).split("@");
        var origin = originParts.length > 1 ? originParts[1] : originParts[0];
        return origin[0] === "/" ? document.location.protocol + origin : origin;
    }

    ns.IsCorsRequest = function IsCorsRequest(url, initiator)
    {
        url = typeof url !== "string" ? url.toString() : url; 

        var urlOrigin = GetHostAndPort(url);
        var initiatorOrigin = GetHostAndPort(initiator);

        return Boolean(urlOrigin) && Boolean(initiatorOrigin) && urlOrigin !== initiatorOrigin;
    };

    var originalWindowOpen = window.open;

    ns.WindowOpen = function WindowOpen(url)
    {
        if (typeof originalWindowOpen === "function")
            originalWindowOpen.call(window, url);
        else
            originalWindowOpen(url);    
    };

    ns.EncodeURI = encodeURI;

    ns.GetResourceSrc = function GetResourceSrc(resourceName)
    {
        return ns.GetBaseUrl() + ns.RESOURCE_ID + resourceName;
    };

    ns.IsRelativeTransport = function IsRelativeTransport()
    {
        return ns.PREFIX === "/";
    };

    ns.GetBaseUrl = function GetBaseUrl()
    {
        if (!ns.IsRelativeTransport())
            return ns.PREFIX;
        return document.location.protocol + "//" + document.location.host + "/";
    };

    ns.AddEventListener = function AddEventListener(element, name, func)
    {
        if (typeof element.addEventListener === "function")
        {
            element.addEventListener(name, 
                function EventListenerCallback(e) 
                {
                    try
                    {
                        func(e || window.event);
                    }
                    catch (ex)
                    {
                        ns.SessionError(ex);
                    }
                }, 
                true);
        }
        else
        {
            element.attachEvent("on" + name, 
                function EventListenerCallback(e)
                {
                    try
                    {
                        func.call(element, e || window.event);
                    }
                    catch (ex)
                    {
                        ns.SessionError(ex);
                    }
                });
        }
    };

    ns.AddRemovableEventListener = function AddRemovableEventListener(element,  name,  func)
    {
        if (element.addEventListener)
            element.addEventListener(name, func, true);
        else
            element.attachEvent("on" + name, func);
    };

    ns.RunModule = function RunModule(func, timeout)
    {
        if (document.readyState === "loading")
        {
            if (timeout)
                ns.SetTimeout(func, timeout);

            if (document.addEventListener)
                ns.AddEventListener(document, "DOMContentLoaded", func);
            ns.AddEventListener(document, "load", func);
        }
        else
        {
            try
            {
                func();
            }
            catch (e)
            {
                ns.SessionError(e);
            }
        }
    };
    ns.RemoveEventListener = function RemoveEventListener(element,  name, func)
    {
        if (element.removeEventListener)
            element.removeEventListener(name, func, true);
        else
            element.detachEvent("on" + name, func);
    };

    var oldSetTimeout = setTimeout;
    ns.SetTimeout = function SetTimeout(func, timeout)
    {
        return oldSetTimeout(function TimerCallback()
            {
                try
                {
                    func();
                }
                catch (e)
                {
                    ns.SessionError(e);
                }
            },
            timeout);
    };

    var oldSetInterval = setInterval;
    ns.SetInterval = function SetInterval(func, interval)
    {
        return oldSetInterval(function IntervalCallback()
            {
                try
                {
                    func();
                }
                catch (e)
                {
                    ns.SessionError(e);
                }
            },
            interval);
    };

    function InsertStyleRule(style,  rule)
    {
        if (style.styleSheet)
        {
            style.styleSheet.cssText += rule + "\n";
        }
        else
        {
            style.appendChild(document.createTextNode(rule));
            ns.SetTimeout(function TimerCallback()
                {
                    if (!style.sheet)
                        return;
                    var rules = style.sheet.cssRules || style.sheet.rules;
                    if (rules && rules.length === 0)
                        style.sheet.insertRule(rule);
                }, 500);
        }
    }

    ns.AddStyles = function AddStyles(rules)
    {
        return ns.AddDocumentStyles(document, rules);
    };

    ns.AddDocumentStyles = function AddDocumentStyles(document, rules)
    {
        if (typeof rules !== "object" || rules.constructor !== Array)
            return [];

        var styles = [];
        for (var i = 0, len = rules.length; i < len;)
        {
            var style = document.createElement("style");
            style.type = "text/css";
            style.setAttribute("nonce", ns.ContentSecurityPolicyNonceAttribute);

            for (var n = 0; n < 4 && i < len; ++n, ++i)
            {
                var rule = rules[i];
                if (document.querySelectorAll)
                {
                    InsertStyleRule(style, rule);
                }
                else
                {
                    var styleBegin = rule.lastIndexOf("{");
                    if (styleBegin === -1)
                        continue;

                    var styleText = rule.substr(styleBegin);
                    var selectors = rule.substr(0, styleBegin).split(",");
                    if (style.styleSheet)
                    {
                        var cssText = "";
                        for (var j = 0; j !== selectors.length; ++j)
                            cssText += selectors[j] + styleText + "\n";

                        style.styleSheet.cssText += cssText;
                    }
                    else
                    {
                        for (var k = 0; k !== selectors.length; ++k)
                            style.appendChild(document.createTextNode(selectors[k] + styleText));
                    }
                }
            }

            if (document.head)
                document.head.appendChild(style);
            else
                document.getElementsByTagName("head")[0].appendChild(style);

            styles.push(style);
        }

        return styles;
    };

    ns.AddCssLink = function AddCssLink(document, href, loadCallback, errorCallback)
    {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = href;
        if (loadCallback)
        {
            ns.AddEventListener(link, "load", function onLoad()
                {
                    try
                    {
                        if (link && link.sheet && link.sheet.cssText)  
                            loadCallback();
                    }
                    catch (e)
                    {
                        if (errorCallback)
                            errorCallback();
                    }
                });
        }
        if (errorCallback)
        {
            ns.AddEventListener(link, "error", function onError()
                {
                    errorCallback();
                    ns.SessionError({ message: "Failed load resource", details: "href: " + href });
                });
        }

        if (document.head)
            document.head.appendChild(link);
        else
            document.getElementsByTagName("head")[0].appendChild(link);
    };

    ns.GetCurrentTime = function GetCurrentTime()
    {
        try
        {
            var date = new Date();

            if (date && date.getTime)
                return date.getTime();
            throw new Error("Cannot call getTime for date: " + date);
        }
        catch (e)
        {
            ns.SessionError(e);
            return 0;
        }
    };
    ns.GetPageScroll = function GetPageScroll()
    {
        return {
                left: (document.documentElement && document.documentElement.scrollLeft) || document.body.scrollLeft,
                top: (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop
            };
    };

    ns.GetPageHeight = function GetPageHeight()
    {
        return document.documentElement.clientHeight || document.body.clientHeight;
    };

    ns.GetPageWidth = function GetPageWidth()
    {
        return document.documentElement.clientWidth || document.body.clientWidth;
    };
    ns.IsDefined = function IsDefined(variable)
    {
        return typeof variable !== "undefined";
    };
    ns.StopProcessingEvent = function StopProcessingEvent(evt)
    {
        if (evt.preventDefault)
            evt.preventDefault();
        else
            evt.returnValue = false;
        if (evt.stopPropagation)
            evt.stopPropagation();
        if (ns.IsDefined(evt.cancelBubble))
            evt.cancelBubble = true;
    };

    ns.AddIframeDoctype = function AddIframeDoctype(element)
    {
        var frameDocument = element.contentDocument || element.contentWindow.document;
        if (document.implementation && document.implementation.createDocumentType)
        {
            var newDoctype = document.implementation.createDocumentType("html", "", "");
            if (frameDocument.childNodes.length)
                frameDocument.insertBefore(newDoctype, frameDocument.childNodes[0]);
            else
                frameDocument.appendChild(newDoctype);
        }
    };

    function IsElementNode(node)
    {
        return node.nodeType === 1; 
    }

    function IsNodeContainsElementWithTag(node, observeTag)
    {
        try
        {
            return observeTag === "*" || (IsElementNode(node) && (node.tagName.toLowerCase() === observeTag || node.getElementsByTagName(observeTag).length > 0));
        }
        catch (e)
        {
            return false;
        }
    }

    function MutationChangeObserver(observeTag)
    {
        var m_observer = null;
        var m_callback = null;
        var m_functionCheckInteresting = observeTag ? function functionCheckInteresting(node) { return IsNodeContainsElementWithTag(node, observeTag); } : IsElementNode;

        function ProcessNodeList(nodeList)
        {
            for (var i = 0; i < nodeList.length; ++i)
            {
                if (m_functionCheckInteresting(nodeList[i]))
                    return true;
            }
            return false;
        }

        function ProcessDomChange(records)
        {
            try
            {
                if (!m_callback)
                    return;

                for (var i = 0; i < records.length; ++i)
                {
                    var record = records[i];
                    if ((record.addedNodes.length && ProcessNodeList(record.addedNodes))
                        || (record.removedNodes.length && ProcessNodeList(record.removedNodes)))
                    {
                        m_callback();
                        return;
                    }
                }
            }
            catch (e)
            {
                ns.SessionError(e);
            }
        }

        this.Start = function Start(callback)
        {
            m_callback = callback;
            m_observer = new MutationObserver(ProcessDomChange);
            m_observer.observe(document, { childList: true, subtree: true });
        };
        this.Stop = function Stop()
        {
            m_observer.disconnect();
            m_callback = null;
        };
    }

    ns.GetDomChangeObserver = function GetDomChangeObserver(observeTag)
    {
        var observeTagLowerCase = observeTag ? observeTag.toLowerCase() : observeTag;
            return new MutationChangeObserver(observeTagLowerCase);
    };

    ns.ToBase64 = function ToBase64(value)
    {
        return btoa(value);
    };

    ns.StartLocationHref = document.location.href;

    return ns;
})(KasperskyLab);
(function Md5Main(ns) {
    function md5cycle(x, k) {
        var a = x[0],
        b = x[1],
        c = x[2],
        d = x[3];

        a = ff(a, b, c, d, k[0], 7, -680876936);
        d = ff(d, a, b, c, k[1], 12, -389564586);
        c = ff(c, d, a, b, k[2], 17, 606105819);
        b = ff(b, c, d, a, k[3], 22, -1044525330);
        a = ff(a, b, c, d, k[4], 7, -176418897);
        d = ff(d, a, b, c, k[5], 12, 1200080426);
        c = ff(c, d, a, b, k[6], 17, -1473231341);
        b = ff(b, c, d, a, k[7], 22, -45705983);
        a = ff(a, b, c, d, k[8], 7, 1770035416);
        d = ff(d, a, b, c, k[9], 12, -1958414417);
        c = ff(c, d, a, b, k[10], 17, -42063);
        b = ff(b, c, d, a, k[11], 22, -1990404162);
        a = ff(a, b, c, d, k[12], 7, 1804603682);
        d = ff(d, a, b, c, k[13], 12, -40341101);
        c = ff(c, d, a, b, k[14], 17, -1502002290);
        b = ff(b, c, d, a, k[15], 22, 1236535329);

        a = gg(a, b, c, d, k[1], 5, -165796510);
        d = gg(d, a, b, c, k[6], 9, -1069501632);
        c = gg(c, d, a, b, k[11], 14, 643717713);
        b = gg(b, c, d, a, k[0], 20, -373897302);
        a = gg(a, b, c, d, k[5], 5, -701558691);
        d = gg(d, a, b, c, k[10], 9, 38016083);
        c = gg(c, d, a, b, k[15], 14, -660478335);
        b = gg(b, c, d, a, k[4], 20, -405537848);
        a = gg(a, b, c, d, k[9], 5, 568446438);
        d = gg(d, a, b, c, k[14], 9, -1019803690);
        c = gg(c, d, a, b, k[3], 14, -187363961);
        b = gg(b, c, d, a, k[8], 20, 1163531501);
        a = gg(a, b, c, d, k[13], 5, -1444681467);
        d = gg(d, a, b, c, k[2], 9, -51403784);
        c = gg(c, d, a, b, k[7], 14, 1735328473);
        b = gg(b, c, d, a, k[12], 20, -1926607734);

        a = hh(a, b, c, d, k[5], 4, -378558);
        d = hh(d, a, b, c, k[8], 11, -2022574463);
        c = hh(c, d, a, b, k[11], 16, 1839030562);
        b = hh(b, c, d, a, k[14], 23, -35309556);
        a = hh(a, b, c, d, k[1], 4, -1530992060);
        d = hh(d, a, b, c, k[4], 11, 1272893353);
        c = hh(c, d, a, b, k[7], 16, -155497632);
        b = hh(b, c, d, a, k[10], 23, -1094730640);
        a = hh(a, b, c, d, k[13], 4, 681279174);
        d = hh(d, a, b, c, k[0], 11, -358537222);
        c = hh(c, d, a, b, k[3], 16, -722521979);
        b = hh(b, c, d, a, k[6], 23, 76029189);
        a = hh(a, b, c, d, k[9], 4, -640364487);
        d = hh(d, a, b, c, k[12], 11, -421815835);
        c = hh(c, d, a, b, k[15], 16, 530742520);
        b = hh(b, c, d, a, k[2], 23, -995338651);

        a = ii(a, b, c, d, k[0], 6, -198630844);
        d = ii(d, a, b, c, k[7], 10, 1126891415);
        c = ii(c, d, a, b, k[14], 15, -1416354905);
        b = ii(b, c, d, a, k[5], 21, -57434055);
        a = ii(a, b, c, d, k[12], 6, 1700485571);
        d = ii(d, a, b, c, k[3], 10, -1894986606);
        c = ii(c, d, a, b, k[10], 15, -1051523);
        b = ii(b, c, d, a, k[1], 21, -2054922799);
        a = ii(a, b, c, d, k[8], 6, 1873313359);
        d = ii(d, a, b, c, k[15], 10, -30611744);
        c = ii(c, d, a, b, k[6], 15, -1560198380);
        b = ii(b, c, d, a, k[13], 21, 1309151649);
        a = ii(a, b, c, d, k[4], 6, -145523070);
        d = ii(d, a, b, c, k[11], 10, -1120210379);
        c = ii(c, d, a, b, k[2], 15, 718787259);
        b = ii(b, c, d, a, k[9], 21, -343485551);

        x[0] = add32(a, x[0]);
        x[1] = add32(b, x[1]);
        x[2] = add32(c, x[2]);
        x[3] = add32(d, x[3]);

    }

    function cmn(q, a, b, x, s, t) {
        a = add32(add32(a, q), add32(x, t));
        return add32((a << s) | (a >>> (32 - s)), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cmn(b^c^d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cmn(c^(b | (~d)), a, b, x, s, t);
    }

    function md51(s) {
        var n = s.length,
        state = [1732584193, -271733879, -1732584194, 271733878],
        i;
        for (i = 64; i <= s.length; i += 64) {
            md5cycle(state, md5blk(s.substring(i - 64, i)));
        }
        s = s.substring(i - 64);
        var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        for (i = 0; i < s.length; i++)
            tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);
        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i++)
                tail[i] = 0;
        }
        tail[14] = n * 8;
        md5cycle(state, tail);
        return state;
    }

    function md5blk(s) {
        var md5blks = [],
        i;
        for (i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i) +
                 (s.charCodeAt(i + 1) << 8) +
                 (s.charCodeAt(i + 2) << 16) +
                 (s.charCodeAt(i + 3) << 24);
        }
        return md5blks;
    }

    var hex_chr = '0123456789abcdef'.split('');

    function rhex(n) {
        var s = '',
        j = 0;
        for (; j < 4; j++)
            s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]+hex_chr[(n >> (j * 8)) & 0x0F];
        return s;
    }

    function hex(x) {
        for (var i = 0; i < x.length; i++)
            x[i] = rhex(x[i]);
        return x.join('');
    }

    ns.md5 = function md5(s) {
        return hex(md51(s));
    };


    function add32(a, b) {
        return (a + b) & 0xFFFFFFFF;
    }

    if (ns.md5('hello') != '5d41402abc4b2a76b9719d911017c592') {
        add32 = function add32(x, y) {
            var lsw = (x & 0xFFFF) + (y & 0xFFFF),
            msw = (x >> 16) + (y >> 16) + (lsw >> 16);
            return (msw << 16) | (lsw & 0xFFFF);
        }
    }

})(KasperskyLab);
(function NmsTransportMain(ns)
{

ns.NMSTransportSupported = ns.IsDefined(chrome) && ns.IsDefined(browsersApi.runtime);
if (!ns.NMSTransportSupported)
    return ns;

ns.NMSCaller = function()
{
    var m_port;
    var m_waitResponse = {};
    var m_callReceiver = function() {};
    var m_errorCallback = function() {};
    var m_callReceiverEnabled = false;
    var m_connected = false;
    var m_initialized = false;
    var m_deferredCalls = [];
    var m_callId = 0;

    function ConnetToNativeMessaging(callbackSuccess, callbackError)
    {
        var light_ext = ns.PLUGINS_LIST?((ns.PLUGINS_LIST.split("&").find(function(el) {return el === "light_ext"})) === "light_ext") : false;

        function AddListeners() 
        {
            m_port.onDisconnect.addListener(function()
                {
                    var reason = "unknown";
                    if (browsersApi.runtime.lastError)
                        reason = browsersApi.runtime.lastError.message;
                    m_connected = false;
                    callbackError("Connection was disconnect: " +  reason);
                });
        }

        if (light_ext)
        {
            m_port = {};
            m_port._disconnect = [];
            m_port.onDisconnect = {};
            m_port.onDisconnect.addListener = function(fn) {
                m_port._disconnect.push(fn);
            }
            m_port.disconnect = function() {
                m_port._disconnect.forEach(function(elem) {elem();});
            }
            m_port.postMessage = function() {}
            m_port.remote = {};
            m_port.remote.disconnect = m_port.disconnect;
            m_port.remote.onDisconnect = m_port.onDisconnect;

            m_port.remote.onMessage = {};
            m_port.remote.onMessage.addListener = function(fn) {
                m_port.postMessage = function(msg) {
                    fn(msg, m_port.remote);
                }
            }

            m_port.remote.postMessage = function(msg)
                {
                    if (!m_connected)
                    {
                        m_connected = true;
                        m_port.remote.postMessage = function(msg) {ProcessMessage(msg, callbackError);};
                        if (callbackSuccess)
                            callbackSuccess();
                        return;
                    }
                };

            AddListeners();
            nativeMessagingTransport.connect(m_port.remote);
        }
        else
        {
            m_port = browsersApi.runtime.connect();
            AddListeners();

            function onMessage(msg)
            {
                if (!m_connected)
                {
                    var connectData = ns.JSONParse(msg);
                    ns.GetNmsId = function() {return connectData.portId;};
                    ns.GetNmsVersion = function() {return connectData.version;}
                    m_port.onMessage.addListener(function(msg) {ProcessMessage(msg, callbackError);});
                    m_port.onMessage.removeListener(onMessage);
                    m_connected = true;
                    if (callbackSuccess)
                        callbackSuccess();
                    return;
                }
            }

            m_port.onMessage.addListener(onMessage);
        }
    }

    function ProcessMessage(arg, callbackError) 
    {
        try
        {
            var response = ns.JSONParse(arg);
            if (m_waitResponse[response.callId])
            {
                var callWaiter = m_waitResponse[response.callId];
                delete m_waitResponse[response.callId];
                clearTimeout(callWaiter.timeout);
                if (callWaiter.callbackResult)
                    callWaiter.callbackResult(response.commandData);
                return;
            }

            if (!m_initialized)
            {
                m_deferredCalls.push(arg);
                return;
            }
            if (response.command === "from")
            {
                var command = ns.JSONParse(response.commandData);
                m_callReceiver(command.method, command.parameters);
            }
        }
        catch (e)
        {
            ns.SessionError(e, "nms")
        }
    }

    function CallImpl(command, commandAttribute, data, callbackResult, callbackError)
    {
        try
        {
            if (++m_callId % 0x100000000 === 0)
                m_callId = 1;

            var callId = m_callId;
            if (callbackResult || callbackError)
            {
                var timeout = ns.SetTimeout(function()
                    {
                        delete m_waitResponse[callId];
                        if (callbackError)
                            callbackError("NMS call timeout for " + command  + "/" + commandAttribute);
                    }, 120000);
                var callWaiter = 
                    {
                        callId: callId,
                        callbackResult: callbackResult,
                        timeout: timeout
                    };
                m_waitResponse[callId] = callWaiter;
            }

            m_port.postMessage(ns.JSONStringify(
                {
                    callId: callId,
                    command: command,
                    commandAttribute: commandAttribute || "",
                    commandData: data || ""
                }
                ));
        }
        catch (e)
        {
            if (callbackError)
                callbackError("Connection call " + command  + "/" + commandAttribute + " exception: " + (e.message || e));
        }
    }
    this.Start = function(callbackSuccess, callbackError)
    {
        try
        {
            m_connected = false;
            ConnetToNativeMessaging(callbackSuccess, callbackError);
        }
        catch (e)
        {
            if (callbackError)
                callbackError("Connection start exception: " + (e.message || e));
        }
    };
    this.SendLog = function(message)
    {
        CallImpl("log", null, message);
    };

    this.SendResult = function(methodName, data)
    {
        CallImpl("callResult", methodName, data);
    };

    this.Call = function(command, commandAttribute, data, isAsync, callbackResult, callbackError) 
    {
        if (ns.IsDefined(isAsync) && !isAsync)
            return false;

        CallImpl(
            command, 
            commandAttribute, 
            data,
            callbackResult 
                ?   function(responseText)
                    {
                        if (callbackResult)
                        {
                            try
                            {
                                var response = ns.JSONParse(responseText);
                                callbackResult(response.result, response.parameters, response.method);
                            }
                            catch (e)
                            {
                                CallImpl("log", null, "error on parse message: " + responseText + " error: " +  (e.message || e));
                                if (callbackError)
                                    callbackError(e);
                            }
                        }
                    }
                : null,
            callbackError
            );
    };

    this.nmsCallSupported = true;
    this.ResourceCall = function(resourcePostfix, callbackResult, callbackError)
    {
        CallImpl("resource", "", resourcePostfix, callbackResult, callbackError);
    };

    this.InitCall = function(injectors, pluginsInitData, callbackResult, callbackError)
    {
        var initData = 
            {
                url: ns.StartLocationHref,
                plugins: injectors,
                data: { data: pluginsInitData },
                isTopLevel: (window && window === window.top)
            };

        if (ns.StartLocationHref === "data:text/html,chromewebdata")
            return callbackError();


        CallImpl("init", null, ns.JSONStringify(initData), function(responseText)
            {
                m_initialized = true;
                var initSettings = ns.JSONParse(responseText);
                if (ns.IsDefined(initSettings.Shutdown))
                    return;
                callbackResult(initSettings);

                for (var i = 0; i < m_deferredCalls.length; ++i)
                    ProcessMessage(m_deferredCalls[i], callbackError);
                m_deferredCalls = [];
            }, callbackError);
    };

    this.StartCall = function(injector, pluginStartData, callbackResult, callbackError)
    {
        var startData = 
            {
                url: ns.StartLocationHref,
                plugins: injector,
                data: { data : pluginStartData },
                isTopLevel: (window && window === window.top)
            };

        CallImpl("start", null, ns.JSONStringify(startData),
            function(responseText)
            {
                callbackResult(ns.JSONParse(responseText));
            },
            callbackError);
    };

    this.StopCall = function(injector, callbackResult, callbackError)
    {
        CallImpl("stop", null, ns.JSONStringify({injectorName : injector}),
            function(responseText)
            {
                callbackResult(ns.JSONParse(responseText));
            },
            callbackError);
    };

    this.GetReceiver = function()
    {
        return this;
    };

    this.StartReceive = function(callMethod, errorCallback)
    {
        m_callReceiverEnabled = true;
        m_callReceiver = callMethod;
        m_errorCallback = errorCallback;
    };

    this.ForceReceive = function() {};

    this.StopReceive = function()
    {
        m_callReceiverEnabled = false;
        m_callReceiver = function() {};
        m_errorCallback = function() {};
        if (m_port)
        {
            m_connected = false;
            m_port.disconnect();
            m_port = null;
        }
    };

    this.IsStarted = function()
    {
        return m_callReceiverEnabled;
    };

    this.IsProductConnected = function()
    {
        return m_connected;
    };
}

return ns;
})(KasperskyLab);


(function AjaxTransportMain(ns)
{

ns.AjaxTransportSupported = false;

return ns;
})(KasperskyLab);
(function WebSocketTransportMain(ns)
{
ns.WebSocketTransportSupported = false;

return ns;
})(KasperskyLab);
var kaspersyLabSessionInstance = null;
(function SessionMain(ns)
{

    var CallReceiver = function CallReceiver(caller)
    {
        var m_plugins = {};
        var m_receiver = caller.GetReceiver();
        var m_caller = caller;
        var m_selfMethods = {};


        this.RegisterMethod = function RegisterMethod(methodName, callback)
        {
            var pluginId = GetPluginIdFromMethodName(methodName);
            if (pluginId)
            {
                var methods = GetPluginMethods(pluginId);
                if (methods)
                {
                    if (methods[methodName])
                        throw new Error("Already registered method " + methodName);

                    methods[methodName] = callback;
                }
                else
                {
                    throw new Error("Cannot registered " + methodName);
                }
            }
            else if (CheckCommonMethodName(methodName))
            {
                if (m_selfMethods[methodName])
                    throw new Error("Already registered method " + methodName);
                m_selfMethods[methodName] = callback;
            }
        };

        this.RegisterPlugin = function RegisterPlugin(pluginId, callbackPing, callbackError)
        {
            if (m_plugins[pluginId])
                throw new Error("Already started plugin " + pluginId);

            var plugin = {
                onError: callbackError,
                onPing: callbackPing,
                methods: {}
            };

            m_plugins[pluginId] = plugin;

            if (!m_receiver.IsStarted())
                m_receiver.StartReceive(CallMethod, ReportError, UpdateDelay);
        };

        this.UnregisterPlugin = function UnregisterPlugin(pluginId)
        {
            delete m_plugins[pluginId];

            if (IsPluginListEmpty())
                m_receiver.StopReceive();
        };

        this.ForceReceive = function ForceReceive()
        {
            m_receiver.ForceReceive();
        };

        this.UnregisterAll = function UnregisterAll()
        {
            if (IsPluginListEmpty())
                return;
            m_receiver.StopReceive();
            m_plugins = {};
        };

        this.IsEmpty = IsPluginListEmpty;

        function IsPluginListEmpty()
        {
            for (var key in m_plugins)
            {
                if (Object.prototype.hasOwnProperty.call(m_plugins, key))
                    return false;
            }
            return true;
        }
        this.IsProductConnected = function IsProductConnected()
        {
            return m_receiver.IsProductConnected();
        };

        function UpdateDelay()
        {
            var newDelay = ns.MaxRequestDelay;
            var currentTime = ns.GetCurrentTime();

            for (var pluginId in m_plugins)
            {
                if (!Object.prototype.hasOwnProperty.call(m_plugins, pluginId))
                    continue;

                try 
                {   
                    var onPing = m_plugins[pluginId].onPing;
                    if (onPing)
                    {
                        var delay = onPing(currentTime);
                        if (delay < newDelay && delay > 0 && delay < ns.MaxRequestDelay)
                            newDelay = delay;
                    }
                }
                catch (e)
                {
                    ReportPluginError(pluginId, "UpdateDelay: " + (e.message || e));
                }
            }

            return newDelay;
        }

        function ReportPluginError(pluginId, status)
        {
            var onError = m_plugins[pluginId].onError;
            if (onError)
                onError(status);
        }

        function ReportError(status)
        {
            for (var pluginId in m_plugins)
            {
                if (Object.prototype.hasOwnProperty.call(m_plugins, pluginId))
                    ReportPluginError(pluginId, status);
            }
        }

        function GetPluginIdFromMethodName(methodName)
        {
            if (methodName)
            {
                var names = methodName.split(".", 2);
                if (names.length === 2)
                    return names[0];
            }
            return null;
        }

        function CheckCommonMethodName(methodName)
        {
            if (methodName)
            {
                var names = methodName.split(".", 2);
                if (names.length === 1 && names[0] === methodName)
                    return true;
            }
            return false;
        }

        function GetPluginMethods(pluginId)
        {
            var plugin = m_plugins[pluginId];
            return plugin ? plugin.methods : null;
        }

        function CallPluginMethod(pluginId, methodName, args)
        {
            var callback = null;
            if (pluginId)
            {
                var methods = GetPluginMethods(pluginId);
                if (methods) 
                    callback = methods[methodName];
            } 
            else
            {
                callback = m_selfMethods[methodName];
            }
            if (callback)
            {
                var result = {};
                try 
                {
                    if (args)
                        callback(ns.JSONParse(args));
                    else
                        callback();
                    result.success = true;
                    m_caller.SendResult(methodName, ns.JSONStringify(result));
                    return true;
                }
                catch (e)
                {
                    result.success = false;
                    m_caller.SendResult(methodName, ns.JSONStringify(result));
                    m_caller.SendLog("Call " + methodName + " in plugin " + (pluginId ? pluginId : "common") + " error: " + (e.message || e));
                    return false;
                }
            }
            m_caller.SendLog("Cannot call " + methodName + " for plugin " + (pluginId ? pluginId : "common"));
            return false;
        }
        function CallMethod(methodName, args)
        {
            ns.Log("Try to find js callback " + methodName);
            var pluginId = GetPluginIdFromMethodName(methodName);
            if (pluginId || CheckCommonMethodName(methodName))          
                CallPluginMethod(pluginId, methodName, args);
        }
    };

    var KasperskyLabSessionClass = function KasperskyLabSessionClass(caller)
    {
        var self = this;
        var m_caller = caller;
        var m_callReceiver = new CallReceiver(caller);

        function BeaconSend()
        {
            return false;
        }

        function CallImpl(methodName, argsObj, callbackResult, callbackError, onUnload)
        {
            if (!m_callReceiver.IsProductConnected())
                return false;

            if (methodName === "nms")
            {
                if (!m_caller.nmsCallSupported)
                {
                    ns.LogError("Unsupported nms call", "common");
                    return;
                }

                var method = typeof argsObj === "object" ? "nms" + ns.JSONStringify(argsObj) : argsObj;
                return m_caller.Call("nms", method, null, !onUnload, null, null);
            }
            var data = (argsObj) 
                ? ns.JSONStringify(
                    {
                        result: 0,
                        method: methodName,
                        parameters: ns.JSONStringify(argsObj)
                    }
                    )
                : null;


            var callback = function callback(result, args, method)
                {
                    if (callbackResult)
                        callbackResult(result, args ? ns.JSONParse(args) : null, method);
                };

            return m_caller.Call("to", methodName, data, !onUnload, callback, callbackError);
        }

        function Call(methodName, arrayOfArgs, callbackResult, callbackError)
        {
            CallImpl(methodName, arrayOfArgs, callbackResult, callbackError, false);
        }

        function OnUnloadCall(methodName, arrayOfArgs, callbackResult, callbackError)
        {
            return CallImpl(methodName, arrayOfArgs, callbackResult, callbackError, true);
        }

        function Stop()
        {
            try
            {
                m_callReceiver.UnregisterAll();
                ns.Log("session stopped");
                if (m_callReceiver.IsProductConnected())
                {
                    if (!m_caller.Call("shutdown", null, null, false))
                        m_caller.Call("shutdown");
                }

                if (m_caller.Shutdown)
                    m_caller.Shutdown();
            }
            catch (e)
            {
            }
        }

        function DeactivatePlugin(pluginId)
        {
            ns.Log("DeactivatePlugin " + pluginId);
            m_callReceiver.UnregisterPlugin(pluginId);
            if (m_callReceiver.IsEmpty())
                Stop();
        }

        function ActivatePlugin(pluginId, callbackPing, callbackError)
        {
            ns.Log("ActivatePlugin " + pluginId);

            m_callReceiver.RegisterPlugin(pluginId, callbackPing, function RegisterPluginOnError(e)
            {
                callbackError && callbackError(e);
                m_callReceiver.UnregisterPlugin(pluginId);
                if (m_callReceiver.IsEmpty())
                    Stop();
            });
        }

        function RegisterMethod(methodName, callback)
        {
            ns.Log("RegisterMethod " + methodName);
            m_callReceiver.RegisterMethod(methodName, callback);
        }

        function ReloadImpl()
        {
            window.location.reload(true);
        }

        function ReloadPage()
        {
            if (navigator && navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.state === "activated")
            {
                ns.SetTimeout(ReloadImpl, 1000);
                navigator.serviceWorker.getRegistrations()
                    .then(function getRegistrationsThen(regs)
                        {
                            var countUnregistered = 0;
                            var rest = function rest()
                                {
                                    ++countUnregistered;
                                    if (countUnregistered === regs.length)
                                        ReloadImpl();
                                }; 
                            for (var i = 0; i < regs.length; ++i)
                            {
                                regs[i].unregister()
                                    .then(rest)
                                    .catch(rest);
                            }
                        })
                    .catch(ReloadImpl);
            }
            else
            {
                ns.SetTimeout(ReloadImpl, 0);
            }
        }

        function StartInjector(param)
        {
            var pluginStartData = {};
            var runner = runners[param.injectorName];
            if (runner && runner.getParameters)
                pluginStartData = { plugin: runner, parameters: ns.JSONStringify(runner.getParameters()) };

            m_caller.StartCall(
                param.injectorName,
                pluginStartData,
                function StartCallCallback(plugin)
                {
                    if (runner && plugin)
                    {
                        var settings = null;
                        if (ns.IsDefined(plugin.settingsJson))
                            settings = (plugin.settingsJson) ? ns.JSONParse(plugin.settingsJson) : null;
                        else
                            settings = plugin.settings;

                        var localization = ns.IsDefined(plugin.localizationDictionary) ? LocalizationObjectFromDictionary(plugin.localizationDictionary) : null;
                        runner.runner(KasperskyLab, kaspersyLabSessionInstance, settings, localization);
                    }
                },
                function StartCallOnError()
                { OnStartError(param.injectorName); }
                );
        }

        function OnStartError(injectorName)
        {
            try 
            {
                var connectionErrorCallback = runners[injectorName].onConnectionError;
                if (connectionErrorCallback)
                    connectionErrorCallback();
            }
            catch (e)
            {
                ns.Log(e);
            }
        }

        function StopInjector(param)
        {
            var runner = runners[param.injectorName];

            m_caller.StopCall(
                param.injectorName,
                function StopCallCallback(plugin)
                {
                    if (runner && plugin && runner.stop)
                        runner.stop(KasperskyLab, kaspersyLabSessionInstance);
                },
                function StopCallOnError() { OnStopError(param.injectorName); }
                );
        }

        function OnStopError(injectorName)
        {
            ns.Log("Stop " + injectorName + "injector failed");
        }
        RegisterMethod("reload", ReloadPage);
        RegisterMethod("start", StartInjector);
        RegisterMethod("stop", StopInjector);


        this.Reload = function Reload()
        {
            ReloadPage();
        };

        this.Log = function Log(error) 
        {
            try
            {
                if (!this.IsProductConnected())
                    return;
                var msg = String(error.message || error);
                if (error.stack)
                    msg += "\r\n" + error.stack;
                msg && m_caller.SendLog(msg.length <= 2048 ? msg : (msg.substring(0, 2048) + "<...>"));
            }
            catch (e)
            {
                ns.Log(e.message || e);
            }
        };

        this.LogError = function LogError(error, injector)
        {
            try
            {
                if (!m_callReceiver.IsProductConnected())
                    return;
                if (!injector)
                    injector = "common"; 

                var result = { injector: injector };

                if (typeof error === "object")
                {                    
                    result.error2 = error.message ? error.message : "unknown";
                    result.stack = error.stack;
                    result.details = error.details; 
                    result.error = result.error2 + "\n" +  result.details + "\n" + result.stack;
                }                
                else
                {
                    result.error  = error;
                    var m = error.split("\n");
                    result.error2 = m[0];
                    result.details = m.slice(1).join("\n");
                }

                m_caller.Call("logerr", null, ns.JSONStringify(result));
            }
            catch (e)
            {
                ns.Log(e.message || e);
            }        
        };

        this.UnhandledException = function UnhandledException(e)
        {
            try
            {
                if (!m_callReceiver.IsProductConnected())
                    return;
                if (!e.filename)
                    return;
                if (e.klSkipUnhandled)
                    return;
                var val = browsersApi.runtime.id;
                if (!val || e.filename.indexOf(val) === -1)
                    return;

                var errInfo = {};
                errInfo.error = e.message && e.message.length > 1024 ? (e.message.substring(0, 1019) + "<...>") : e.message;
                errInfo.script = e.filename && e.filename.length > 1024 ? (e.filename.substring(0, 1019) + "<...>") : e.filename;
                errInfo.line = e.lineno;
                errInfo.column = e.colno;
                if (e.error)
                    errInfo.stack = e.error.stack && e.error.stack.length > 2048 ? (e.error.stack.substring(0, 2043) + "<...>") : e.error.stack;

                m_caller.Call("except", null, ns.JSONStringify(errInfo));
                return;
            }
            catch (ex)
            {
                ns.Log(ex.message || ex);
            }
        };
        this.ForceReceive = function ForceReceive()
        {
            m_callReceiver.ForceReceive();
        };

        this.IsProductConnected = function IsProductConnected()
        {
            return m_callReceiver.IsProductConnected();
        };

        this.InitializePlugin = function InitializePlugin(init)
        {
            init(
                function OnInitActivatePlugin()
                {
                    ActivatePlugin.apply(self, arguments);
                },
                function OnInitRegisterMethod()
                {
                    RegisterMethod.apply(self, arguments);
                },
                function OnInitCall()
                {
                    Call.apply(self, arguments);
                },
                function OnInitDeactivatePlugin()
                {
                    DeactivatePlugin.apply(self, arguments);
                },
                function OnInitOnUnloadCall()
                {
                    return OnUnloadCall.apply(self, arguments);
                }
            );
        };

        this.GetResource = function GetResource(resourcePostfix, callbackSuccess, callbackError)
        {
            if (!m_caller.ResourceCall)
                throw new Error("Not implemented on transport GetResource");

            m_caller.ResourceCall(resourcePostfix, callbackSuccess, callbackError);
        };

        ns.AddEventListener(window, "unload", function onUnload() 
            {
                if (!m_callReceiver.IsEmpty())
                    Stop();
            });
    };

    var runners = {};
    ns.AddRunner = function AddRunner(pluginName, runnerFunc, initParameters, onConnectionError)
    {
        var options = {
            name: pluginName,
            runner: runnerFunc
        };
        if (initParameters)
            options.getParameters = function getParameters() { return initParameters; };
        if (onConnectionError)
            options.onConnectionError = onConnectionError;
        ns.AddRunner2(options);
    };

    ns.AddRunner2 = function AddRunner2(options)
    {
        var runnerItem = {
            runner: options.runner
        };
        if (options.onConnectionError)
            runnerItem.onConnectionError = options.onConnectionError;
        if (options.getParameters)
            runnerItem.getParameters = options.getParameters;
        if (options.stop)
            runnerItem.stop = options.stop;
        runners[options.name] = runnerItem;
    };

    ns.SessionLog = function SessionLog(e)
    {
        if (kaspersyLabSessionInstance && kaspersyLabSessionInstance.IsProductConnected())
            kaspersyLabSessionInstance.Log(e);
        else
            ns.Log(e);
    };

    ns.SessionError = function SessionError(e, injector)
    {
        if (kaspersyLabSessionInstance && kaspersyLabSessionInstance.IsProductConnected())
            kaspersyLabSessionInstance.LogError(e, injector);
        else
            ns.Log(e);
    };

    ns.AddEventListener(window, "error", function onError(e)
    {
        if (kaspersyLabSessionInstance)
            kaspersyLabSessionInstance.UnhandledException(e);
        else
            ns.Log(e);
    });

    ns.ContentSecurityPolicyNonceAttribute = ns.CSP_NONCE;

    function OnInitError()
    {
        PostponeInit();
        for (var runner in runners)
        {
            if (!Object.prototype.hasOwnProperty.call(runners, runner))
                continue;
            try
            {
                var connectionErrorCallback = runners[runner].onConnectionError;
                if (connectionErrorCallback)
                    connectionErrorCallback();
            }
            catch (e)
            {
                ns.Log(e);
            }
        }
    }

    var SupportedCallerProvider = function SupportedCallerProvider()
    {
        var m_current = 0;
        var m_supportedCallers = [];
        if (ns.NMSTransportSupported)
            m_supportedCallers.push(new ns.NMSCaller());
        if (ns.WebSocketTransportSupported)
            m_supportedCallers.push(new ns.WebSocketCaller());
        if (ns.AjaxTransportSupported)
            m_supportedCallers.push(new ns.AjaxCaller());

        function FindSupportedImpl(callbackSuccess)
        {
            if (m_current < m_supportedCallers.length)
            {
                var caller = m_supportedCallers[m_current++];
                caller.Start(function StartCallback() 
                    { 
                        callbackSuccess(caller); 
                    }, 
                    function StartError() 
                    { 
                        FindSupportedImpl(callbackSuccess); 
                    });
            }
            else
            {
                m_current = 0;
                OnInitError();
            }
        }

        this.FindSupported = function FindSupported(callbackSuccess)
        {
            FindSupportedImpl(callbackSuccess);
        };
    };

    function LocalizationObjectFromDictionary(dictionary)
    {
        if (!dictionary)
            return null;

        var object = {};
        for (var i = 0; i < dictionary.length; i++)
            object[dictionary[i].name] = dictionary[i].value;
        return object;
    }

    var ajaxId = "";
    var sessionId = "";
    function Init()
    {
        var callerProvider = new SupportedCallerProvider();
        callerProvider.FindSupported(
            function FindSupportedCallback(caller) 
            {
                var injectors = "";
                var pluginsInitData = [];
                for (var runner in runners)
                {
                    if (!Object.prototype.hasOwnProperty.call(runners, runner))
                        continue;

                    if (injectors)
                        injectors += "&";
                    injectors += runner;

                    if (runners[runner].getParameters)
                        pluginsInitData.push({ plugin: runner, parameters: ns.JSONStringify(runners[runner].getParameters()) });
                }

                caller.InitCall(
                    injectors,
                    pluginsInitData,
                    function InitCallCallback(initSettings)
                    {
                        ns.IsRtl = initSettings.rtl;
                        ajaxId = initSettings.ajaxId;
                        sessionId = initSettings.sessionId;
                        kaspersyLabSessionInstance = new KasperskyLabSessionClass(caller);
                        ns.SetInterval(function IntervalCallback() { if (!kaspersyLabSessionInstance.IsProductConnected()) PostponeInit(); }, 60000);
                        var plugins = initSettings.plugins;
                        if (!plugins)
                        {
                            ns.SessionLog("Empty plugins list recieved on init reponse");
                            return;
                        }
                        for (var i = 0, pluginsCount = plugins.length; i < pluginsCount; ++i)
                        {
                            try
                            {
                                var plugin = plugins[i];
                                var runnerItem = runners[plugin.name];

                                if (runnerItem)
                                {
                                    var settings = null;
                                    if (ns.IsDefined(plugin.settingsJson))
                                        settings = (plugin.settingsJson) ? ns.JSONParse(plugin.settingsJson) : null;
                                    else
                                        settings = plugin.settings;
                                    var localization = ns.IsDefined(plugin.localizationDictionary) 
                                        ? LocalizationObjectFromDictionary(plugin.localizationDictionary) 
                                        : plugin.localization;
                                    runnerItem.runner(KasperskyLab, kaspersyLabSessionInstance, settings, localization);
                                }
                            }
                            catch (e)
                            {
                                ns.SessionError(e);
                            }
                        }
                    },
                    OnInitError
                    );
            }
            );
    }

    var lastPostponedInitTime = (new Date()).getTime();
    var postponedInitTimeout = null;
    function PostponeInit()
    {
        var nowPostponeTime = (new Date()).getTime();
        var postponeDelay = (nowPostponeTime - lastPostponedInitTime) > 5000 ? 200 : 60 * 1000;
        lastPostponedInitTime = nowPostponeTime;
        clearTimeout(postponedInitTimeout);
        postponedInitTimeout = ns.SetTimeout(function postponedInitTimerCallback() { Init(); }, postponeDelay);
    }

    ns.StartSession = function StartSession()
    {
        ns.SetTimeout(Init, 0);
    };
})(KasperskyLab);
KasperskyLab.AddRunner("pc", function AddRunnerPc(ns, session, settings, locales)
{
    var PasswordControl = function PasswordControl()
    {
        var m_callFunction = ns.EmptyFunc;
        var m_balloon = null;


        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        session.InitializePlugin(function InitializePluginPc(activatePlugin, registerMethod, callFunction)
            {
                m_callFunction = callFunction;
                activatePlugin("pc", OnPing);
                registerMethod("pc.disable", function PcDisable()
                    {
                        if (m_balloon)
                            m_balloon.Disable();
                    });
                registerMethod("pc.showBalloon", function PcShowBalloon(obj)
                    {
                        if (m_balloon && window === window.top)
                            m_balloon.ShowBalloon(obj);
                    });
                registerMethod("pc.hideBalloon", function PcHideBalloon()
                    {
                        if (m_balloon && window === window.top)
                            m_balloon.HideBalloon();
                    });
            });

        m_balloon =  new ns.PasswordControlBalloon(settings, locales, m_callFunction, session);
    };


    var instance = null;
    ns.RunModule(function RunModulePasswordControl()
    {
        if (!instance)
            instance = new PasswordControl();
    });
});
(function PasswordControlBalloonMain(ns)
{

ns.PasswordControlBalloon = function PasswordControlBalloon(settings, locales, callFunction, session)
{
    var m_balloon = (window === window.top) 
        ? new ns.Balloon2("pc", "/pc/password_control_balloon.html", "/pc/tooltip.css", session, GetCoord, OnCloseHandler, locales, OnGetDataCallback) 
        : null;
    var m_focusedElement = null;
    var m_lastChange = null;
    var m_hideTimer = null;
    var m_displayBalloon = false;
    var m_currentVerdictClassName = "";
    var m_currentPasswordStrength = null;
    var m_currentArrowClassName = "left";
    var m_restoreFocusTimeout = null;

    var m_frameInfo = { fromFrame: false };

    var m_focusEventName = "";
    var m_blurEventName = "";
    var m_focusTimeOut = null;

    var m_domParser = ns.GetDomParser(session);

    var m_delaySkipFocusEvent = false;
    var m_delayTimeout = 200;

    if (window.addEventListener)
    {
        m_focusEventName = "focus";
        m_blurEventName = "blur";
    }
    else
    {
        m_focusEventName = "focusin";
        m_blurEventName = "focusout";
    }

    function OnCloseHandler(closeAction)
    {
        m_displayBalloon = false;
        m_delaySkipFocusEvent = true;

        switch (closeAction)
        {
        case 1:
            OnCloseButton();
            break;
        case 2:
            OnSkipNotification();
            break;
        case 3:
            OnInstallButton();
            break;
        default:
            ns.SessionError({ message: "Unknown close action", details: "action: " + closeAction }, "pc");
            break;
        }

        clearTimeout(m_focusTimeOut);
        ns.SetTimeout(function TimerCallback() { m_delaySkipFocusEvent = false; }, m_delayTimeout);
    }

    function OnGetDataCallback(data)
    {
        if (data.isNeedRestoreFocus && m_focusedElement)
        {
            clearTimeout(m_hideTimer);
            m_focusedElement.focus();
        }
    }

    function Unsubscribe(element)
    {
        ns.RemoveEventListener(element, "input", OnInput);
        ns.RemoveEventListener(element, "keyup", OnInput);
        ns.RemoveEventListener(element, "keydown", OnInput);
        ns.RemoveEventListener(element, m_blurEventName, OnBlur);
    }

    function OnCloseButton()
    {
        var element = m_focusedElement;
        m_focusedElement = null;
        m_lastChange = null;
        if (element)
        {
            Unsubscribe(element);
            m_restoreFocusTimeout = ns.SetTimeout(function TimerCallback()
                {
                    if (m_balloon && m_balloon.IsFocused())
                        element.focus();
                }, 500);
            element.focus();
        }
        ns.SessionLog("Click close button");
    }

    function OnSkipNotification()
    {
        DisableImpl();
        callFunction("pc.SkipNotification");
    }

    function OnInstallButton()
    {
        OnCloseButton();
        callFunction("pc.Download");
    }

    this.Disable = function Disable()
    {
        DisableImpl();
    };

    function DisableImpl()
    {
        if (m_balloon)
        {
            m_balloon.Hide();
            m_balloon = null;
        }
        if (m_focusedElement)
            Unsubscribe(m_focusedElement);

        ns.SessionLog("Disabling password control");
    }

    function GeneratePopupAttributes(password)
    {
        if (!password)
        {
            m_currentVerdictClassName = "popup_empty";
            m_currentPasswordStrength = null;
        }
        else
        {
            m_currentVerdictClassName = "";
            m_currentPasswordStrength = ns.CheckPasswordStrength(password);
        }
    }

    function GetCoord(balloonSize)
    {
        var coord = { x: 0, y: 0 };

        var elementRect = {};
        if (m_frameInfo.fromFrame)
        {
            elementRect = m_frameInfo.coord;
        }
        else
        {
            if (!m_focusedElement)
                return coord;
            elementRect = m_focusedElement.getBoundingClientRect();
        }
        var clientHeight = ns.GetPageHeight();
        var clientWidth = ns.GetPageWidth();

        var newArrowClassName = "";
        if (elementRect.right + balloonSize.width <= clientWidth)
        {
            newArrowClassName = "left";
            coord.x = elementRect.right;
            coord.y = elementRect.top - 80 + ((elementRect.bottom - elementRect.top) / 2);
        }
        else if (elementRect.left - balloonSize.width >= 0)
        {
            newArrowClassName = "right";
            coord.x = elementRect.left - balloonSize.width;
            coord.y = elementRect.top  - 80 + ((elementRect.bottom - elementRect.top) / 2);
        }
        else if (elementRect.bottom + balloonSize.height < clientHeight)
        {
            newArrowClassName = "top";
            coord.x = elementRect.left  - 13;
            coord.y = elementRect.bottom;
        }
        else if (elementRect.top - balloonSize.height > 0)
        {
            newArrowClassName = "bottom";
            coord.x = elementRect.left  - 13;
            coord.y = elementRect.top - balloonSize.height;
        }
        else
        {
            newArrowClassName = "top";
            coord.x = elementRect.left - 13;
            coord.y = elementRect.bottom;
        }

        if (newArrowClassName !== m_currentArrowClassName)
        {
            m_currentArrowClassName = newArrowClassName;
            ns.SetTimeout(UpdateBalloon, 0);
        }

        var scroll = ns.GetPageScroll();
        coord.x += scroll.left;
        coord.y += scroll.top;

        return coord;
    }

    function GetBalloonData()
    {
        return { strength: m_currentPasswordStrength, arrow: m_currentArrowClassName };
    }

    function UpdateBalloon()
    {
        if (!m_balloon)
            return;
        m_balloon.Update(m_currentVerdictClassName, GetBalloonData());
    }

    function ShowBalloonImpl(password)
    {
        if (!m_balloon)
        {
            ns.SessionLog("Balloon is undefined, not possible to show it.");
            return;
        }

        GeneratePopupAttributes(password);
        if (!m_displayBalloon)
        {
            callFunction("pc.Tooltip");
            m_displayBalloon = true;
            m_balloon.Show(m_currentVerdictClassName, GetBalloonData());
        }
        else
        {
            UpdateBalloon();
        }
    }

    this.ShowBalloon = function ShowBalloon(obj)
    {
        if (window !== window.top)
            return;
        m_frameInfo.fromFrame = true;
        m_frameInfo.coord = {};

        var r = m_frameInfo.frameElement.getBoundingClientRect();

        m_frameInfo.coord.top = obj.top + r.top;
        m_frameInfo.coord.bottom = obj.bottom + r.top;
        m_frameInfo.coord.left = obj.left + r.left;
        m_frameInfo.coord.right = obj.right + r.left;

        OnPasswordFocused(obj.password);
    };

    this.HideBalloon = function HideBalloon()
    {
        if (window !== window.top)
            return;

        m_frameInfo.fromFrame = true;
        HideBalloonImpl();
    };

    function HideBalloonImpl()
    {
        m_balloon.Hide();
        m_displayBalloon = false;
    }

    function OnHideBalloon()
    {
        if (window === window.top)
            HideBalloonImpl();
        else
            callFunction("pc.NeedToHideBalloon");
    }

    function OnInput()
    {
        try
        {
            if (!m_focusedElement)
                return;
            if (m_lastChange === m_focusedElement.value)
                return;

            if (window === window.top)
            {
                ShowBalloonImpl(m_focusedElement.value);
            }
            else
            {
                var r = m_focusedElement.getBoundingClientRect();
                callFunction("pc.NeedToShowBalloon", { top: r.top, bottom: r.bottom, right: r.right, left: r.left, password: m_focusedElement.value });
            }

            m_lastChange = m_focusedElement.value;
        }
        catch (e)
        {
            ns.SessionError(e, "pc");
        }
    }

    function AddRemovableEventListener(element)
    {
        m_focusedElement = element;

        ns.AddRemovableEventListener(element, m_blurEventName, OnBlur);
        ns.AddRemovableEventListener(element, "input", OnInput);

        ns.AddRemovableEventListener(element, "keyup", OnInput);
        ns.AddRemovableEventListener(element, "keydown", OnInput);
    }

    function OnPasswordFocused(password)
    {
        clearTimeout(m_restoreFocusTimeout);
        clearTimeout(m_hideTimer);
        ShowBalloonImpl(password);
        m_balloon.UpdatePosition();
    }

    function IsPasswordInputCallback(result, passwords, element)
    {
        if (result === 0 && element && passwords)
        {
            for (var i = 0; i < passwords.length; i++)
            {
                if (element === document.querySelector(passwords[i]))
                {
                    if (window === window.top)
                    {
                        m_frameInfo.fromFrame = false;
                        return true;
                    }
                    var r = element.getBoundingClientRect();
                    AddRemovableEventListener(element);
                    callFunction("pc.NeedToShowBalloon", { top: r.top, bottom: r.bottom, right: r.right, left: r.left, password: m_focusedElement.value });
                    return false;
                }
            }
        }

        return false;
    }

    function CheckSelectorCallback(element)
    {
        return function CheckSelector(result, passwords) 
        {
            if (IsPasswordInputCallback(result, passwords, element))
            {
                AddRemovableEventListener(element);
                OnPasswordFocused(m_focusedElement.value);
            }
        };
    }

    function ShowBalloonOnPasswordInput(element)
    {
        m_domParser.GetNewPasswordSelectors(CheckSelectorCallback(element));
    }


    function OnFocus(evt)
    {
        if (m_delaySkipFocusEvent)
        {
            ns.SessionLog("Skip focus event after click button in balloon");
            return;
        }

        var element = evt.target || evt.srcElement;

        m_focusTimeOut = ns.SetTimeout(function TimerCallback()
        {
            if (element.type === "password")   
                ShowBalloonOnPasswordInput(element);
            else
                ns.SessionLog("Skip focus event for element with type: " + element.type);
        }, 0);
    }

    function OnBlur()
    {
        try
        {
            clearTimeout(m_focusTimeOut);

            if (m_focusedElement)
            {
                clearTimeout(m_hideTimer);
                m_hideTimer = ns.SetTimeout(function TimerCallback() { OnHideBalloon(); }, 500);

                Unsubscribe(m_focusedElement);
                m_lastChange = null;
            }
        }
        catch (e)
        {
            ns.SessionError(e, "pc");
        }
    }

    function OnMouseOver(evt)
    {
        var element = evt.target || evt.srcElement;
        if (element.nodeName.toLowerCase() !== "iframe")
            return;

        m_frameInfo.frameElement = element;
    }

    ns.AddEventListener(document, m_focusEventName, OnFocus);

    if (window === window.top)
        ns.AddEventListener(document, "mouseover", OnMouseOver);
};

})(KasperskyLab || {});
(function CfrEngine(ns)
{
var PasswordStrengthChecker = (function () {
    var checker = null;

    function KasPassCheck() {
        var reasons = maa(5);

        this.tbls = [
            {
                vp: [[0, 0.0866, 0.408, 0.474], [0.0193, 0.413, 0.488, 0.683], [0, 0.106, 0.606, 0.756]],
                sf: [0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0361, 0.0295, 0.0328, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0393, 0.0361],
                lf: [[0xc0000200, 0x880a2202, 0xa002002a, 696320, 664064, 0xaa000002, 0x80a02ac0, 10248, 548044800, 35782688, 704643106, 545390754, 33564680, 59944, 8388608, 713687048, 0x80000aa, 0x88008008, 569504, 2, 686293120, 570468874, 2048, 9080320, 0, 548929536, 0x88000002, 0xc008202a, 131874, 545423360, 8915490, 0x82800802, 805838850, 0xa88000c0, 0x82a28000, 33687680, 0x80000088, 772317184, 164002, 663584, 44091400, 526464, 587202560], [0xc0000000, 512, 0, 524288, 0, 536870912, 128, 0, 131072, 0, 0x8000000, 32, 0, 49152, 0, 33554432, 12, 0, 12288, 0, 8388608, 2, 0, 3072, 0, 3145728, 0, 0x80000000, 512, 0, 524288, 0, 536870912, 128, 0, 131072, 0, 0xc000000, 32, 0, 32768, 0, 33554432], [0xc0202000, 525056, 0, 571211776, 0xa0000000, 807411712, 192, 131072, 0x88030200, 0, 0xc080008, 8240, 536870912, 51200, 0x82000802, 50331648, 0x8000888, 557056, 539500704, 2048, 0xc00020, 8388611, 8192, 134144, 0x8800800, 538970112, 32768, 0xe0000000, 2824, 2056, 786432, 524288, 813694976, 139456, 8, 197248, 2050, 0xc0a0000, 33554480, 8388616, 49664, 2, 50331648]]
            },
            {
                vp: [[0.0208, 0.0443, 0.0808, 0.128], [0.0217, 0.0396, 0.0617, 0.0921], [0.0179, 0.0351, 0.0588, 0.0911], [0.0201, 0.0378, 0.0606, 0.0913]],
                sf: [0.0746, 0.0367, 0.0419, 0.0391, 0.0767, 0.0307, 0.029, 0.0354, 0.0546, 0.026, 0.0283, 0.0454, 0.0349, 0.0568, 0.0501, 0.0291, 0.0136, 0.0551, 0.0557, 0.0541, 0.0315, 0.0214, 0.0187, 0.0149, 0.0303, 0.0155],
                lf: [[704676528, 973081256, 0x8228228, 0x8888388, 673316874, 772407426, 0xa8088a80, 44055040, 0x8aa28a2, 0x82280880, 0xcaa2282a, 0x800e0e0a, 8398848, 0x8a8802b0, 704645288, 547522602, 0x8a0e0a0, 0x880a808c, 738992256, 0xa808e8c0, 0x808a0880, 0x88ac8802, 0x80a0002a, 178730, 0x880c0a28, 547530752, 0xaa828222, 0xaaa88c2c, 0x80080a8, 8946304, 0xa0b8008, 0x8c280282, 0xa808aaa8, 0xa2a22a00, 0xa0e0a00, 0x80a000e0, 0xc280282a, 698888, 0x8a2a028, 0xa8a02228, 0xa0088a8, 0x8a2802a, 0xa000000], [0xcac2ca28, 704645802, 0xa2282a0, 0x8a2e0a2, 0xa82a800a, 0xa828ab82, 0xa008cac2, 0x82282f00, 0xb8a0a2a, 0x82a008aa, 0x82a2282a, 698376, 732143624, 0xcaca8a28, 704643754, 598344352, 0x88a8082, 0xb82a808a, 0xa8080b82, 0xa2088a80, 0x82383a00, 0x8ac28aa, 0x82a00882, 0xc08a282a, 567304, 581148672, 0xaaeaa02a, 0xaa80aaac, 673874080, 0x8c8c0c2, 0xa82a800a, 0x8e082b83, 0xa008aaea, 0x8a282a80, 0x8a828a3, 0x83a008a2, 0x8082283a, 9087530, 0xaa82a828, 0xaa82a828, 0xaaa02aaa, 0xaaaa2a0, 0xa000000], [0xcac2c2a8, 713067178, 0xaaa282a0, 0x8aae282, 0xaa2aa08a, 0xaaaaaa82, 0xa008cac2, 0x82a82a80, 0x8aaa2aaa, 0x82b00aaa, 0xaaa2a82a, 9087658, 0xaaa2a008, 0xcac282a8, 713067178, 715817642, 0x8aaaaaa, 0xa82a008a, 0xaea8aa82, 0xa008caca, 0xcaa82a80, 0xaae28aa, 0x82a808ca, 0xc2c2a82a, 0x808aaaa8, 0xaaa2e008, 0xaaaaaaaa, 0xaaaaaaac, 0xa8ab82a0, 0x88ac88a, 0xba3a800a, 0xaeaaab82, 0xa008cac2, 0xc2a82a80, 0x8aaaaaaa, 0x82aa08ab, 0xaa8aaa2b, 9087658, 0xaaaaaa28, 0xaaaaaaa8, 715164330, 0xaaaaaaaa, 704643072], [0xcac08238, 704645806, 682263200, 0x8aae08a, 0xa82a008a, 0xae2aaa82, 0xa0088ac0, 0x82b83a00, 0x8aaa2aaa, 0x82a208aa, 0xeaaa282a, 9088554, 0xa282a008, 0xcac082b8, 973114026, 715784866, 0x8aaa2aa, 673849484, 0xac282282, 0xa008cac2, 0x82a82a80, 0x8aac0822, 0x82a008ca, 0xc082382a, 8956968, 578985992, 0xaaaaaaaa, 0xabaa8cac, 673350304, 0x8cac28a, 0xa82a000a, 0xae28a282, 0xa0088ac0, 0x82b83a80, 0x8aae2aa2, 0x82a80882, 0xc28aa82a, 9087530, 0xaaa2a22a, 0xaaa2aaa8, 715164330, 0xaaaa8aaa, 0xa000000]]
            }
        ];
        this.prob = function (i, j, l) {
            return p(i, j, l, this.tbls[0].lf);
        };
        this.calc = function (t) {
            var rval = 0;
            for (var i = 0; i < this.tbls.length; ++i) {
                var s = Math.max.apply(null, avg(clc(t, this.tbls[i])));
                reasons[i] = (s < 1.5 ? 0 : (s / 1.5));
                rval = Math.max(s, rval);
            }

            var l = lk(t);
            reasons[2] = (l >= 1 ? 0 : 1 / l);
            this.reasons = reasons;
            return rval / (vrs(t) * l);
        };
        this.mkrval = function (r) {
            var rs = maa(5);
            for (var i = 0; i < 5; ++i) rs[i] = [i, reasons[i]];
            rs.sort(function (a, b) {
                if (a[1] < b[1]){ return 1; };
                if (a[1] > b[1]){ return -1; };
                return 0;
            });
            for (var i = 0; i < 5; ++i) rs[i] = rs[i][0];
            return {quality: r, reasons: rs};
        };

        function cc(t, i) {
            return t.charCodeAt(i);
        }

        function _cd(t, i) {
            return cc(t, i) - 97;
        }

        function avg(a) {
            var r = a.p;
            for (var i = 0; i < a.p.length; ++i) r[i] = (a.c[i] != 0 ? r[i] / a.c[i] : 1.5);
            return r;
        }

        function maa(l, f) {
            var a = [];
            for (var k = 0; k < l; k++) a.push(f === undefined ? 0 : f);
            return a;
        }

        function ma(l) {
            return {p: maa(l), c: maa(l)};
        }

        function suma(a, b) {
            var r = a;
            for (var i = 0; i < a.length; ++i) r[i] = a[i] + b[i];
            return r;
        }

        function sum(a, b) {
            return {p: suma(a.p, b.p), c: suma(a.c, b.c)};
        }

        function p(i, j, l, lf) {
            var c = i * 26 + j;
            var b = lf[l][~~(c / 16)];
            return ((b >> (30 - 2 * (c % 16))) & 3);
        }

        function se(i, t, ctx) {
            var c = _cd(t, i);
            var r = ma(ctx.lf.length);
            for (var j = i + 1, l = 0; j < t.length; ++j, ++l) {
                r.p[l] += p(c, _cd(t, j), l, ctx.lf);
                r.c[l]++;
                if (l == (ctx.lf.length - 1)) break;
            }

            return r;
        }

        function prep(t) {
            t = t.toLowerCase();
            return t.replace(/[^a-z]/g, '');
        }

        function clc(t, tbl) {
            t = prep(t);
            var r = ma(tbl.lf.length);
            if (t != '') {
                for (var i = 0; i < t.length; ++i) r = sum(r, se(i, t, tbl))
            }

            return r;
        }

        function cap(a) {
            return cc(a, 0) > 96;
        }

        function ctp(a) {
            var c = cc(a, 0);
            if ((c > 64 && c < 91) || (c > 96 && c < 123)) return 0;
            if (c > 47 && c < 58) return 1;
            return (c > 126 ? 3 : 2)
        }

        function vrq(a, b) {
            var t = ctp(a);
            if (t != ctp(b)) return 0.04;
            if (t == 0 && cap(a) != cap(b)) return 0.01;
            return 0;
        }

        function uni(a) {
            if (a.length <= 1) return a;
            var t = [a[0]], p = a[0];
            for (var i = 1; i < a.length; ++i) {
                if (a[i] != p) {
                    t.push(a[i]);
                    p = a[i];
                }

            }

            return t;
        }

        function dvrs(t) {
            if (t.length <= 1) return 1;
            var d = [], p = cc(t, 0);
            for (var i = 1; i < t.length; ++i) {
                var c = cc(t, i);
                d.push(c - p);
                p = c;
            }

            d.sort();
            var dsz = d.length;
            d = uni(d);
            if (d.length <= 2) return 0.5;
            if (d.length < dsz / 2) return (0.5 + d.length / dsz);
            return 1.1;
        }

        function ovrs(t) {
            if (t.length <= 1) return 1;
            var q = 1;
            var p = t.charAt(0);
            for (var i = 1; i < t.length; ++i) {
                q += vrq(p, t.charAt(i));
                p = t.charAt(i);
            }
            return q;
        }

        function vrs(t) {
            var d = dvrs(t);
            reasons[4] = 1 / d;
            var o = ovrs(t);
            reasons[3] = 1 / o;
            return Math.min(d, o);
        }

        function lk(t) {
            if (t.length <= 0) return 0.01;
            if (t.length >= 80) return Math.log(t.length);
            return Math.log(t.length) / Math.log(11 - (~~(t.length / 10)));
        }
    }

    function retv(v) {
        if (v <= 1) return 0;
        if (v <= 1.5) return 1;
        if (v <= 2) return 2;
        return 3;
    }

    function getPasswordStrength(value) {
        if (!checker) {
            checker = new KasPassCheck();
        }
        var val = retv(checker.calc(value));

        if (val == 3 || val == 2 || value.length >= 8) {
            return checker.mkrval(val);
        }
        checker.reasons[2] = 0;

        return checker.mkrval(2);
    }

    return {
        getPasswordStrength: getPasswordStrength
    };
})();
function NeedToShowBalloon(elem){
	if(!elem)return false;
	if(!elem.tagName||elem.tagName.toLowerCase()!="input")return false;
	if(!elem.type||elem.type.toLowerCase()!='password')return false;
	var inputs=document.getElementsByTagName('input');
	var p=-1,pp=-1,f=false;
	function p_near(i,j){
		function r(x){return Math.round(x);}
		function bnd(e){return e.getBoundingClientRect();}
		function hid(p){if (p&&(((p.right-p.left)==0)||((p.top-p.bottom)==0)))return true;return false;}
		function abs(a){return Math.abs(a);}
		var r1=bnd(inputs[i]);
		var r2=bnd(inputs[j]);
		if (hid(r1))return false;
		if (hid(r2))return false;
		var dx=abs(r(r2.left-r1.left));
		var dy=abs(r(r2.top-r1.top));
		var dxw=abs(r(r2.left-r1.right));
		var dyh=abs(r(r2.top-r1.bottom));
		var n=10,m=130;
		if(dy<=n&&dxw<=m)return true;
		if(dy<=m&&dxw<=n)return true;
		if(dx<=n&&dyh<=m)return true;
		if(dx<=m&&dyh<=n)return true;
		return false;
	};
	function in_double_set(i,j)
	{
		if(elem==inputs[i]||elem==inputs[j])return true;
		return false;
	}
	function check_double()
	{
		if(f)
		{
			if(p>=0&&pp>=0&&in_double_set(p,pp))return true;
			f=false;
		}
		p=-1;pp=-1;
		return false;
	}
	for(var i=0;i<inputs.length;++i){
		if(inputs[i].type.toLowerCase()=="password"){
			if (p>=0){
				if(p_near(p,i)){
					if(pp>=0){
						if(in_double_set(i,p))return true;
						p=-1;pp=-1;
					}else{
						if((i==inputs.length-1)&&(in_double_set(i,p)))return true;
						f=true;
					}
				}else{
					if(check_double())return true;
				}
				pp=p;
			}
			p=i;
		}else{
			if(check_double())return true;
		}
	}
	return false;
}
ns.CheckPasswordStrength = PasswordStrengthChecker.getPasswordStrength;
ns.NeedToShowBalloon = NeedToShowBalloon;

})(KasperskyLab || {});
KasperskyLab.AddRunner("cb", function AddRunnerCB(ns, session)
{

    function ContentBlocker()
    {
        var m_idleStartTime = ns.GetCurrentTime();

        var m_callFunction = ns.EmptyFunc;

        session.InitializePlugin(function InitializePluginContentBlocker(activatePlugin, registerMethod, callFunction, deactivatePlugin)
        {
            m_callFunction = callFunction;

            activatePlugin("cb", OnPing);
            registerMethod("cb.reloadUrl", ReloadUrl);
            registerMethod("cb.blockImage", BlockImage);
            registerMethod("cb.shutdown",
                function ShutdownCB()
                {
                    deactivatePlugin("cb");
                });

        });

        function OnPing(currentTime)
        {
            var idleTime = (currentTime >= m_idleStartTime) ? currentTime - m_idleStartTime : 0;

            return idleTime <= 10000 ? 500 : ns.MaxRequestDelay;
        }

        function ReloadUrl()
        {
            m_idleStartTime = ns.GetCurrentTime();
            session.Reload();
        }

        function blockImageByPath(url, blockImageResponse)
        {
            var endsWithUrl = function endsWithUrl(pattern)
                {
                    var d = pattern.length - url.length;
                    return d >= 0 && pattern.lastIndexOf(url) === d;
                };

            var images = document.getElementsByTagName("img");
            for (var i = 0; i !== images.length; ++i)
            {
                if (endsWithUrl(images[i].src) && images[i].style.display !== "none")
                {
                    images[i].style.display = "none";
                    ++blockImageResponse.blockedImagesCount;
                }
            }
        }

        function BlockImage(blockImageRequest)
        {
            var blockImageResponse = { blockedImagesCount: 0, requestId: "" };

            var SendResponse = function SendResponseImpl() 
            {
                m_callFunction("cb.BlockResults", blockImageResponse);
                SendResponse = ns.EmptyFunc;
            };

            try
            {
                blockImageResponse.requestId = blockImageRequest.requestId;

                for (var i = 0; i !== blockImageRequest.urls.length; ++i)
                    blockImageByPath(blockImageRequest.urls[i], blockImageResponse);

                SendResponse();
            }
            catch (e)
            {
                SendResponse();
                throw e;
            }
        }
    }

    var m_contentBlocker = new ContentBlocker(); 
});
(function(ns)
{

ns.IsPositionEqual = function(prevPos, currentPos)
{
    return prevPos && currentPos && prevPos.top === currentPos.top && prevPos.left === currentPos.left;
};
ns.GetAbsoluteElementPosition = function(element)
{
    var box = element.getBoundingClientRect();
    var scroll = ns.GetPageScroll();
    return {
            left: box.left + scroll.left,
            top: box.top + scroll.top,
            right: box.right + scroll.left,
            bottom: box.bottom + scroll.top
        };
};

})(KasperskyLab || {});
(function(ns) 
{

function Includes(list, text)
{
    var i = 0, count = list.length;
    for (; i < count; ++i)
        if (list[i] === text)
            return true;
    return false;
}

ns.ProtectableElementDetector = function(protectMode)
{
    var m_typesForbidden = ["hidden", "submit", "radio", "checkbox", "button", "image", "number", "tel"];
    var m_protectMode = protectMode;

    this.Test = function(element)
    {
        if (m_protectMode < 2 || m_protectMode > 3)
            return false;
        var elementType = element.getAttribute("type");
        elementType = elementType && elementType.toLowerCase();
        if (m_protectMode === 2)
        {
            if (elementType !== "password")
                return false;
        }
        else if (Includes(m_typesForbidden, elementType))
        {
            return false;
        }
        if (GetComputedStyle(element, "display") === "none")
            return false;
        var maxLength = parseInt(element.getAttribute("maxlength"), 10);
        return typeof maxLength === "number" && maxLength <= 3 ? false : !element.readOnly;

    };

    function GetComputedStyle(element, property)
    {
        var value;
        if (element.currentStyle)
        {
            value = element.currentStyle[property];
        }
        else
        {
            var styles = window.getComputedStyle(element, "");
            if (styles)
                value = styles.getPropertyValue(property);
        }
        return typeof value !== "string" ? "" : value.toLowerCase();
    }
}

var vkAttributeName = "kl_vk.original_type_" + ns.GetCurrentTime();

ns.ProtectableElementDetector.ChangeTypeIfNeeded = function(element)
{
    var m_typesToChange = ["email"];
    var originalType = element.getAttribute("type");
    if (Includes(m_typesToChange, originalType))
    {
        element.setAttribute(vkAttributeName, originalType);
        element.setAttribute("type", "text");
    }
};

ns.ProtectableElementDetector.RestoreTypeIfNeeded = function(element)
{
    if (element.hasAttribute(vkAttributeName))
    {
        element.setAttribute("type", element.getAttribute(vkAttributeName));
        element.removeAttribute(vkAttributeName);
    }
};

})(KasperskyLab || {});
(function(ns)
{

ns.SecureInputTooltip = function(locales, session)
{
    var m_balloon = new ns.Balloon2("vk_si", "/vk/secure_input_tooltip.html", "/vk/secure_input_tooltip.css", session, GetCoords, OnCloseHandler, locales);
    var m_currentElement = null;
    var m_timer;

    var that = this;

    var Top = 0;
    var Bottom = 1;

    var m_lastTooltipPosition = Bottom;

    function GetClassName(position)
    {
        if (position === Top)
            return "top_balloon";
        else if (position === Bottom)
            return "bottom_balloon";
        else 
            return null;
    }

    function UpdateBalloon()
    {
        if (!m_balloon)
            return;
        m_balloon.Update(GetClassName(m_lastTooltipPosition));
    }

    function SetPosition(position)
    {
        if (m_lastTooltipPosition === position)
            return;

        m_lastTooltipPosition = position;
        UpdateBalloon();
    }

    function GetCoords(tooltipSize)
    {
        if (!m_timer)
        {
            m_timer = ns.SetInterval(UpdateBalloonByTimer, 100);
            ns.SetTimeout(function() { that.Hide(); }, 3000);
        }

        var inputPosition = ns.GetAbsoluteElementPosition(m_currentElement);
        var coords = { x: inputPosition.left, y: inputPosition.top };

        var inputTopRelative = inputPosition.top - ns.GetPageScroll().top;
        var clientHeightUnderInput = ns.GetPageHeight() - inputTopRelative - m_currentElement.offsetHeight;

        if ((clientHeightUnderInput > tooltipSize.height - 1) || 
            (inputPosition.top - tooltipSize.height + 1 < 0))
        {
            coords.y = inputPosition.top + m_currentElement.offsetHeight - 1;
            SetPosition(Top);
        }
        else
        {
            coords.y = inputPosition.top - tooltipSize.height + 1;
            SetPosition(Bottom);
        }

        return coords;
    }

    function UpdateBalloonByTimer()
    {
        if (!m_balloon)
            return;
        m_balloon.UpdatePosition();
    }

    function RestoreFocusForLastElement()
    {
        if (m_currentElement) 
            m_currentElement.focus();
    }

    function OnCloseHandler(closeAction)
    {
        switch (closeAction)
        {
        case 1:
            ns.SetTimeout(RestoreFocusForLastElement, 0);
            break;
        default:
            ns.SessionError({ message: "Unknown close action", details: "action: " + closeAction }, "vk");
            break;
        }
    }


    this.Show = function(element)
    {
        m_currentElement = element;
        m_balloon.Show();

        this.Hide = function()
        {
            clearInterval(m_timer);

            ns.SetTimeout(function() { m_balloon.Destroy(); }, 200);

            this.Show = function() {};
            this.Hide = function() {};
        };
    };
    this.Hide = function() {};
};

})(KasperskyLab || {});
(function(ns)
{
ns.VirtualKeyboardInputIcon = function(clickCallback, session)
{
    var m_element;
    var m_visible = false;
    var m_balloon = new ns.Balloon2("vk_icon", "/vk/virtual_keyboard_input_icon.html", "/vk/virtual_keyboard_icon.css", session, GetCoords, null, null, DataReceive);
    var m_iconHideTimer;
    var m_updatePosInterval;
    ns.AddEventListener(window, "scroll", TriggerUpdatePosition);

    function ControlIconDisplaying(e)
    {
        try
        {
            var eventArg = e || window.event;
            if (eventArg.keyCode === 9 || eventArg.keyCode === 16)
                return;

            if (m_element.value === "")
                ShowInternal();
            else
                HideInternal();
        }
        catch (e)
        {
            ns.SessionError(e, "vk");
        }
    }

    function HideInternal()
    {
        if (!m_visible)
            return;
        clearInterval(m_updatePosInterval);
        m_balloon.Destroy();
        m_visible = false;
    }

    function ShowInternal()
    {
        if (m_visible)
            return;
        m_balloon.Show();
        m_balloon.UpdatePosition(); 
        m_updatePosInterval = ns.SetInterval(TriggerUpdatePosition, 500);
        m_visible = true;
    }

    function TriggerUpdatePosition()
    {
        if (!m_visible)
            return;

        var scroll = ns.GetPageScroll();
        if (scroll.top === 0)
            ns.SetTimeout(function() { m_balloon.UpdatePosition(); }, 10);
        else
            m_balloon.UpdatePosition();
    }

    function DataReceive(data)
    {
        if (data.showKeyboard && m_element)
            clickCallback();
    }

    function GetCoords(tooltipSize)
    {
        var inputPosition = ns.GetAbsoluteElementPosition(m_element);
        var coords = {x: inputPosition.left + m_element.offsetWidth - 20, y: inputPosition.top + (m_element.offsetHeight - 16) / 2};
        return coords;
    }   
    this.Show = function(element)
    {
        m_element = element;

        if (m_iconHideTimer)
        {
            clearTimeout(m_iconHideTimer);
            HideInternal();
        }

        ShowInternal();
        ns.AddRemovableEventListener(m_element, "keyup", ControlIconDisplaying)

        this.Hide = function()
        {
            m_iconHideTimer = ns.SetTimeout(function() { HideInternal(); }, 500);
            this.Hide = function() {};
            ns.RemoveEventListener(m_element, "keyup", ControlIconDisplaying);
        };
    };

    this.Hide = function() {};
};

})(KasperskyLab || {});
(function VirtualKeyboardBalloonMain(ns) 
{
    ns.VirtualKeyboardBalloon = function VirtualKeyboardBalloon(session, locales, onBalloonDataReceiveHandler)
    {
        var m_balloon = new ns.Balloon2("vk_mac", "/vk/virtual_keyboard_balloon.html", "/vk_mac/balloon.css", session, GetCoordsCallback, OnCloseHandler, locales, OnDataReceiveHandler);

        var m_balloonX = 0;
        var m_balloonY = 0;
        var m_pageMouseX = 0;
        var m_pageMouseY = 0;
        var m_isAlreadyAppeared = false;
        var m_isDrag = false;
        var m_isButtonPressed = false;
        var m_firstAppearanceHandler = ns.EmptyFunc;

        function GetCoordsCallback(balloonSize) 
        {
            var coord = {x: m_balloonX, y: m_balloonY};
            return coord;
        }

        function OnCloseHandler(arg)
        {
            if (arg === 0)
                m_balloon.Hide();
        }

        function OnDragStart(mouseX, mouseY) 
        {
            m_isDrag = true;
            m_pageMouseX = m_balloonX + mouseX;
            m_pageMouseY = m_balloonY + mouseY;

            document.addEventListener("mouseup", OnDragEnd);
            document.addEventListener("mousemove", OnPageMouseMove);
        }

        function OnDragEnd() 
        {
            document.removeEventListener("mouseup", OnDragEnd);
            document.removeEventListener("mousemove", OnPageMouseMove);
            m_isDrag = false;
        }

        function OnDrag(offsetX, offsetY) 
        {
            m_balloonX += offsetX;
            m_balloonY += offsetY;

            m_balloon.LightUpdatePosition(m_balloonX, m_balloonY);

            m_pageMouseX += offsetX;
            m_pageMouseY += offsetY;
        }

        function OnPageMouseMove(event) 
        {
            m_balloonX += event.clientX - m_pageMouseX;
            m_balloonY += event.clientY - m_pageMouseY;

            m_balloon.LightUpdatePosition(m_balloonX, m_balloonY);

            m_pageMouseX = event.clientX;
            m_pageMouseY = event.clientY;
        }

        function OnDataReceiveHandler(data)
        {
            switch (data.msg) 
            {
                case "vk.pressedKey":
                    m_isButtonPressed = true;
                    onBalloonDataReceiveHandler(data);
                    break;
                case "vk.releasedKey":
                    m_isButtonPressed = false;
                    break;
                case "vk.dragStart":
                    OnDragStart(data.mouseX, data.mouseY);
                    break;
                case "vk.drag":
                    OnDrag(data.offsetX, data.offsetY);
                    break;
                case "vk.dragEnd":
                    OnDragEnd();
                    break;
                case "vk.created":
                    m_firstAppearanceHandler(data.width, data.height);
                    m_balloon.LightUpdatePosition(m_balloonX, m_balloonY);
                    break;
            }
        }

        this.IsClicked = function IsClicked()
        {
            return m_isDrag || m_isButtonPressed;
        }

        this.HideBalloon = function HideBalloon()
        {
            m_balloon.Hide();
        }

        function MoveAfterPasswordFieldFocus(x, y)
        {
            return function(w, h) {
                m_balloonX = x - w/2;
                m_balloonY = y;
            }
        }

        function MoveAfterPopupVkOpenClicked(w, h)
        {
            m_balloonX = window.outerWidth/2 - w/2;
            m_balloonY = window.outerHeight/2 - h/2;
        }

        function Show(handler)
        {
            if (!m_isAlreadyAppeared)
            {
                m_firstAppearanceHandler = handler;
                m_isAlreadyAppeared = true;
            }
            m_balloon.Show("", {});
        }

        this.OnFocusPasswordTextFieldHandler = function OnFocusPasswordTextFieldHandler(rect)
        {
            Show(MoveAfterPasswordFieldFocus(rect.x + rect.width/2, rect.y));
        }

        this.ShowBalloon = function ShowBalloon()
        {
            Show(MoveAfterPopupVkOpenClicked);
        }
    };

}) (KasperskyLab || {});
var KasperskyLab = (function FocusChangeObserverMain(ns)
{

ns.FocusChangeObserver = function FocusChangeObserver(focusHandler, blurHandler, settingsChangedHandler)
{
    var m_targetPropertyName = "";
    if (document.addEventListener)
    {
        ns.AddEventListener(document, "focus", onFocus);
        ns.AddEventListener(document, "blur", onBlur);
        m_targetPropertyName = "target";
    }
    else
    {
        ns.AddEventListener(document, "focusin", onFocus);
        ns.AddEventListener(document, "focusout", onBlur);
        m_targetPropertyName = "srcElement";
    }

    var m_focusedElement = tryToGetFocusedInput();

    this.settingsChanged = function SettingsChanged()
    {
        if (m_focusedElement)
            settingsChangedHandler(m_focusedElement);
    }

    this.unbind = function Unbind()
    {
        if (document.removeEventListener)
        {
            document.removeEventListener("focus", onFocus, true);
            document.removeEventListener("blur", onBlur, true);
        }
        else
        {
            document.detachEvent("onfocusin", onFocus);
            document.detachEvent("onfocusout", onBlur);
        }
        if (m_focusedElement)
        {
            blurHandler(m_focusedElement);
            m_focusedElement = null;
        }
    }

    if (m_focusedElement)
        focusHandler(m_focusedElement);


    function tryToGetActiveElement()
    {
        try
        {
            return document.activeElement;
        }
        catch (e)
        {}

        return null;
    }

    function tryToGetFocusedInput()
    {
        var element = tryToGetActiveElement();
        return (document.hasFocus() && isInputElement(element)) ? element : null;
    }

    function isInputElement(element)
    {
        return element &&
            element.tagName &&
            element.tagName.toLowerCase() === "input";
    }

    function onBlur(event)
    {
        if (m_focusedElement)
        {
            var element = m_focusedElement;
            m_focusedElement = null;
            blurHandler(element);
        }
    }

    function onFocus(event)
    {
        var element = event[m_targetPropertyName];
        if (isInputElement(element))
        {
            m_focusedElement = element;
            focusHandler(element);
        }
    }
};
return ns;

})(KasperskyLab || {});
KasperskyLab.AddRunner("vk_mac", function AddRunnerVirtualKeyboardMac(ns, session, settings, locales)
{
    var VirtualKeyboardMac = function VirtualKeyboardMac()
    {
        var m_virtualKeyboardBalloon = new ns.VirtualKeyboardBalloon(session, locales, OnBallonDataReceived);
        var m_activeElement = null;
        var m_shutdown = false;
        var m_protectChangeTimeout = null;
        var m_postponeStart = null;

        session.InitializePlugin(function InitializePluginVKMac(activatePlugin, registerMethod, callFunction, deactivatePlugin, syncCallFunction) 
        {
            activatePlugin("vk", OnPing);
        });

        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        function SubscribeOnFocusPasswordField()
        {
            if (!document.body)
            {
                ns.AddEventListener(window, "load", SubscribeOnFocusPasswordField);
                return;
            }

            var inputs = document.getElementsByTagName("input");

            for (var i = 0; i < inputs.length; i++)
            {
                var input = inputs[i];
                if (input.type.toLowerCase() == "password")
                {
                    input.addEventListener("focus", function ShowVirtualKeyboard() {
                        m_virtualKeyboardBalloon.OnFocusPasswordTextFieldHandler(this.getBoundingClientRect()); 
                    });
                    input.addEventListener("blur", function HideVirtualKeyboard() {
                        var isClickedWhenBlur = m_virtualKeyboardBalloon.IsClicked();
                        ns.SetTimeout(function WaitIsDragEvent() 
                        { 
                            if (!(m_virtualKeyboardBalloon.IsClicked() || isClickedWhenBlur))
                                m_virtualKeyboardBalloon.HideBalloon(); 
                        }, 100);
                    });
                }
            }
        }

        function SubscribeWhenMutation()
        {
            if (window.MutationObserver)
            {
                const observer = new MutationObserver(SubscribeOnFocusPasswordField);
                observer.observe(document.getRootNode(), { attributes: true, childList: true, subtree: true });
            }
        }

        function Init()
        {
            SubscribeOnFocusPasswordField();
            SubscribeWhenMutation();
            browsersApi.runtime.onMessage.addListener(OnMessage);
        }

        function OnMessage(request, sender, sendResponse)
        {
            try
            {
                if ("vk.showMacKeyboard" === request.command && window.top === window)
                    m_virtualKeyboardBalloon.ShowBalloon();
            }
            catch (e)
            {
                ns.SessionError(e, "vk_mac");
            }
        }

        function StayFocusedAt(pos)
        {
            var cashedActiveElement = m_activeElement;
            ns.SetTimeout(function StayFocused() 
            { 
                cashedActiveElement.focus();
                cashedActiveElement.setSelectionRange(pos,pos);
            }, 100);
        }

        function OnBackspacePressed() 
        {
            var start = m_activeElement.value.length;
            var end = m_activeElement.value.length;
            if (m_activeElement.selectionStart && m_activeElement.selectionEnd) 
            {
                start = m_activeElement.selectionStart;
                end = m_activeElement.selectionEnd;
            }
            if (end === start)
                start -= 1;
            var lhs = m_activeElement.value.substring(0, start);
            var rhs = m_activeElement.value.substring(end, m_activeElement.value.length);
            m_activeElement.value = lhs + rhs;
            m_activeElement.selectionStart = start;
            m_activeElement.selectionEnd = start;
        }

        function OnBallonDataReceived(data)
        {
            if (data.key === "symbol")
            {
                InsertCharacter(data.text);
                GenerateInputEvent("input", data.text);
            }
            else if (data.key === "return")
            {
                const ke = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, keyCode: 13 });
                m_activeElement.dispatchEvent(ke);
            }
            else if (data.key === "backspace")
            {
                OnBackspacePressed();
            }
            if (m_activeElement)
                StayFocusedAt(m_activeElement.selectionStart);
        }

        function InsertCharacter(character)
        {
            var start = m_activeElement.selectionStart;
            var end = m_activeElement.selectionEnd;
            m_activeElement.value = m_activeElement.value.substring(0, start) + character + m_activeElement.value.substring(end);
            m_activeElement.setSelectionRange(start + character.length, start + character.length);
            m_protectedText = m_activeElement.value;
        }

        function GenerateInputEvent(eventName, data)
        {
            var inputEvent = new InputEvent(eventName, {"data": data, "bubbles": true, "inputType": "insertText", "cancelable": true});
            return m_activeElement.dispatchEvent(inputEvent);
        }

        function GenerateChangeEvent()
        {
            m_protectedText = null;
            var changeEvent = new Event("change", {"bubbles" : true});
            m_activeElement.dispatchEvent(changeEvent);
        }

        function OnElementFocus(element)
        {
            if (m_shutdown)
                return;

            m_activeElement = element;

            ns.ProtectableElementDetector.ChangeTypeIfNeeded(element);

            clearTimeout(m_postponeStart);
            clearTimeout(m_protectChangeTimeout);
            m_protectChangeTimeout = ns.SetTimeout(function OnFocus() { ProcessFocus(element); }, 0);
        }

        function OnElementBlur(element)
        {
            setTimeout(function Blur() {
                if (m_shutdown)
                return;

                if (m_activeElement === element)
                    GenerateChangeEvent();
                ns.ProtectableElementDetector.RestoreTypeIfNeeded(element);

                clearTimeout(m_protectChangeTimeout);
                m_protectChangeTimeout = ns.SetTimeout(function OnBlur() { ProcessBlur(); }, 0);
                m_activeElement = null;
            }, 50);
        }

        function OnSettingsChanged(element) {}

        ns.AddEventListener(window, "unload", function OnUnload()
        {
            clearTimeout(m_protectChangeTimeout);
            clearTimeout(m_postponeStart);
            m_shutdown = true;
            m_observer.unbind();
        });

        var m_observer = new ns.FocusChangeObserver(OnElementFocus, OnElementBlur, OnSettingsChanged);

        Init();
    };

    var instance = null;
    ns.RunModule(function RunModuleVirtualKeyboardMac()
    {
        if (!instance)
            instance = new VirtualKeyboardMac();
    }, 2000);
});
KasperskyLab.AddRunner("vk", function(ns, session, settings, locales)
{

var VirtualKeyboard = function()
{
    var m_callFunction, m_syncCallFunction;
    var m_virtualKeyboardIconShowMode = 0;
    var m_secureInputProtectMode = 0;

    var m_activeElement = null;
    var m_lastFocusedElement = null;
    var ProtectState = {NOT_PROTECTED : 0, STARTING_PROTECT : 1, PROTECTED : 2, STOPPING_PROTECT : 3};
    var m_protectedState = ProtectState.NOT_PROTECTED;
    var m_enabledSecureInput = false;
    var m_protectChangeTimeout;
    var m_protectableVirtualKeyboardChecker = new ns.ProtectableElementDetector(settings.vkProtectMode);
    var m_protectableSecureInputChecker = null;
    var m_protectableVirtualKeyboardIconChecker = null;
    var m_attributeName = "vk_" + Math.floor((1 + Math.random()) * 0x10000).toString(16);
    var m_protectedText = null;

    function ShowVirtualKeyboard()
    {
        if (m_lastFocusedElement)
            m_lastFocusedElement.focus();
        m_callFunction("vk.showKeyboard");
    }

    var m_tooltip = new ns.SecureInputTooltip(locales, session);
    var m_icon = new ns.VirtualKeyboardInputIcon(ShowVirtualKeyboard, session);
    var m_postponeStart;
    var m_shutdown = false;
    var m_port;
    var m_unsupportedLayouts = [
                                "00000411" , 
                                "00000804" , 
                                "00000404" , 
                                "00000c04" , 
                                "00001404" , 
                                "00001004" ];
    var m_isUnsupportedLayout = false;

    session.InitializePlugin(function(activatePlugin, registerMethod, callFunction, deactivatePlugin, syncCallFunction)
    {
        m_callFunction = callFunction;
        m_syncCallFunction = syncCallFunction;
        activatePlugin("vk", OnPing);
        registerMethod("vk.settings", SetSettings);
        registerMethod("vk.keyDown", KeyDown);
        registerMethod("vk.keyUp", KeyUp);
        registerMethod("vk.keyboardLayout", GetKeyboardLayout);
        ns.AddEventListener(document, "keyup", OnDocumentKeyUp);
        ns.AddEventListener(document, "mouseenter", OnDocumentKeyUp);
        m_callFunction("nms", "CheckKeyboardLayout");
    });

    function OnPing()
    {
        return (m_protectedState === ProtectState.STARTING_PROTECT || m_protectedState === ProtectState.PROTECTED) ? 500 : ns.MaxRequestDelay;
    }
    function SetSettings(argument)
    {
        SetSettingsImpl(argument.virtualKeyboardIconShowMode, argument.secureInputProtectMode);
    }
    function SetSettingsImpl(newVirtualKeyboardIconShowMode, newSecureInputProtectMode)
    {
        if (newSecureInputProtectMode !== m_secureInputProtectMode)
            m_protectableSecureInputChecker = new ns.ProtectableElementDetector(newSecureInputProtectMode);
        if (newVirtualKeyboardIconShowMode !== m_virtualKeyboardIconShowMode)
            m_protectableVirtualKeyboardIconChecker = new ns.ProtectableElementDetector(newVirtualKeyboardIconShowMode);
        var needToUpdate = (newSecureInputProtectMode > m_secureInputProtectMode ||
            newVirtualKeyboardIconShowMode > m_virtualKeyboardIconShowMode);

        m_secureInputProtectMode = newSecureInputProtectMode;
        m_virtualKeyboardIconShowMode = newVirtualKeyboardIconShowMode;

        if (needToUpdate && m_observer)
            m_observer.settingsChanged();
    }

    function InsertCharacter(character)
    {
        var start = m_activeElement.selectionStart;
        var end = m_activeElement.selectionEnd;
        m_activeElement.value = m_activeElement.value.substring(0, start) + character + m_activeElement.value.substring(end);
        m_activeElement.setSelectionRange(start + character.length, start + character.length);
        m_protectedText = m_activeElement.value;
    }

    function CheckPasswordLength(character)
    {
        if (m_activeElement.maxLength && m_activeElement.maxLength > 0)
            return (m_activeElement.value.length + character.length) <= m_activeElement.maxLength;
        return true;
    }

    function GenerateKeyboardEvent(eventName, key, scanCodeValue, virtualCode, shiftKey)
    {
        var keyboardEventOptions = {"key":key, "keyCode":virtualCode, "code":scanCodeValue, "bubbles":true, "shiftKey":shiftKey, "cancelable":true, "which": virtualCode};
        if (eventName === "keypress")
            keyboardEventOptions.charCode = virtualCode;
        var keyboardEvent = new KeyboardEvent(eventName, keyboardEventOptions);
        return m_activeElement.dispatchEvent(keyboardEvent);
    }

    function GenerateInputEvent(eventName, data)
    {
        var inputEvent = new InputEvent(eventName, {"data": data, "bubbles": true, "inputType": "insertText", "cancelable":true});
        return m_activeElement.dispatchEvent(inputEvent);
    }

    function GenerateChangeEvent()
    {
        m_protectedText = null;
        var changeEvent = new Event("change", {"bubbles" : true})
        m_activeElement.dispatchEvent(changeEvent);
    }
    function KeyDown(keyInfo)
    {
        if (!m_activeElement)
            return;
        var key = (keyInfo.isDeadKey) ? "Dead" : String.fromCharCode(keyInfo.symbols[0]);
        if (GenerateKeyboardEvent("keydown", key, keyInfo.scanCodeValue, keyInfo.virtualCode, keyInfo.shift) === false)
            return;

        for (var symbolIndex = 0; symbolIndex < keyInfo.symbols.length; ++symbolIndex)
        {
            var character = String.fromCharCode(keyInfo.symbols[symbolIndex]);
            if (GenerateKeyboardEvent("keypress", character, keyInfo.scanCodeValue, keyInfo.symbols[symbolIndex], keyInfo.shift) === false)
                continue;
            if (GenerateInputEvent("beforeinput", character) === false)
                continue;
            if (!CheckPasswordLength(character))
                break;

            InsertCharacter(character);
            GenerateInputEvent("input", character);
        }
    }

    function KeyUp(keyInfo)
    {
        if (!m_activeElement)
            return;

        var key = (keyInfo.isDeadKey) ? "Dead" : String.fromCharCode(keyInfo.symbols[0]);
        GenerateKeyboardEvent("keyup", key, keyInfo.scanCodeValue, keyInfo.virtualCode, keyInfo.shift);
    }

    function GetKeyboardLayout(keyboardLayoutInfo)
    {
        if (m_unsupportedLayouts.includes(keyboardLayoutInfo.layout))
        {
            m_isUnsupportedLayout = true;
            if (m_activeElement && m_protectedState === ProtectState.STARTING_PROTECT || m_protectedState === ProtectState.PROTECTED)
                StopProtect();
        }
        else
        {
            m_isUnsupportedLayout = false;
            if (m_activeElement && NeedProtectElement(m_activeElement) &&
                (m_protectedState === ProtectState.NOT_PROTECTED || m_protectedState === ProtectState.STOPPING_PROTECT))
                StartProtect();
        }
    }

    function OnDocumentKeyUp(event)
    {
        m_callFunction("nms", "CheckKeyboardLayout");

        if (m_activeElement === event.target && event.keyCode === 13 && m_protectedText === m_activeElement.value)
            GenerateChangeEvent();
    }
    function NeedProtectElement(element)
    {
        return m_protectableSecureInputChecker.Test(element) || m_protectableVirtualKeyboardChecker.Test(element);
    }
    function HandleStartProtectCallback(result, args, needSecureInputCall)
    {
        if (m_protectedState === ProtectState.STOPPING_PROTECT)
        {
            if (result === 0)
                StopProtect();
            else
                m_protectedState = ProtectState.NOT_PROTECTED;
            return;
        }
        if (result === 0)
        {
            if (!args)
            {
                ns.SessionLog("ERR VK - unexpected arguments");
                return;
            }
            m_enabledSecureInput = args.isSecureInput;
            m_protectedState = ProtectState.PROTECTED;
            var needSecureInput = m_protectableSecureInputChecker.Test(m_activeElement);
            if (needSecureInput === needSecureInputCall)
                ShowBalloons();
            else
                CheckProtectModeAndShowBalloons();
            return;
        }
        else if (result === 1)
        {
            m_postponeStart = ns.SetTimeout(function() { OnElementFocus(m_activeElement); }, 100);
        }
        m_protectedState = ProtectState.NOT_PROTECTED;
    }

    function StartProtect()
    {
        if (!document.hasFocus())
        {
            m_protectedState = ProtectState.NOT_PROTECTED;
            ns.SessionLog("No focus on StartProtect");
            return;
        }
        var needSecureInput = m_protectableSecureInputChecker.Test(m_activeElement);
        m_protectedState = ProtectState.STARTING_PROTECT;
        m_callFunction("vk.startProtect", {isSecureInput : needSecureInput}, function(result, args) { HandleStartProtectCallback(result, args, needSecureInput);});
    }
    function ChangeMode()
    {
        var needSecureInput = m_protectableSecureInputChecker.Test(m_activeElement);
        m_protectedState = ProtectState.STARTING_PROTECT;
        m_callFunction("vk.changeMode", {isSecureInput : needSecureInput}, function(result, args) { HandleStartProtectCallback(result, args, needSecureInput);});
    }

    function StopProtect()
    {
        m_protectedState = ProtectState.STOPPING_PROTECT;
        m_callFunction("vk.stopProtect", null, function(result)
            {
                if (m_protectedState === ProtectState.STARTING_PROTECT && result === 0)
                {
                    StartProtect();
                    return;
                }

                m_protectedState = ProtectState.NOT_PROTECTED;
                m_icon.Hide();
                m_tooltip.Hide();
            });
    }

    function ShowBalloons()
    {
        if (m_enabledSecureInput)
            m_tooltip.Show(m_activeElement);
        if (m_protectableVirtualKeyboardIconChecker.Test(m_activeElement))
            m_icon.Show(m_activeElement);
    }

    function CheckProtectModeAndShowBalloons()
    {
        var needSecureInput = m_protectableSecureInputChecker.Test(m_activeElement);
        if (needSecureInput !== m_enabledSecureInput)
            ChangeMode();
        else
            ShowBalloons();
    }

    function OnElementFocus(element)
    {
        if (m_shutdown)
            return;

        m_activeElement = element;
        m_lastFocusedElement = element;

        if (!NeedProtectElement(element))
            return;

        ns.ProtectableElementDetector.ChangeTypeIfNeeded(element);

        clearTimeout(m_postponeStart);
        clearTimeout(m_protectChangeTimeout);
        m_protectChangeTimeout = ns.SetTimeout(function() { ProcessFocus(element); }, 0);
    }

    function OnElementBlur(element)
    {
        if (m_shutdown)
            return;

        if (m_activeElement === element && m_protectedText === m_activeElement.value)
            GenerateChangeEvent();
        clearTimeout(m_postponeStart);
        m_icon.Hide();
        m_tooltip.Hide();

        ns.ProtectableElementDetector.RestoreTypeIfNeeded(element);

        clearTimeout(m_protectChangeTimeout);
        m_protectChangeTimeout = ns.SetTimeout(function() { ProcessBlur(); }, 0);
        m_activeElement = null;
    }

    function OnSettingsChanged(element)
    {
        var needProtectElement = NeedProtectElement(element);
        if ((m_activeElement !== element) ^ needProtectElement)
            return;

        if (needProtectElement)
            OnElementFocus(element);
        else
            OnElementBlur(element);
    }

    function ProcessFocus(element)
    {
        if (m_protectedState === ProtectState.NOT_PROTECTED && !m_isUnsupportedLayout)
        {
            if (element === document.activeElement)
                StartProtect();
        }
        else if (m_protectedState === ProtectState.PROTECTED)
            CheckProtectModeAndShowBalloons();
        else if (m_protectedState === ProtectState.STOPPING_PROTECT)
            m_protectedState = ProtectState.STARTING_PROTECT;
    }

    function ProcessBlur()
    {
        if (m_protectedState === ProtectState.PROTECTED)
            StopProtect();
        else if (m_protectedState === ProtectState.STARTING_PROTECT)
            m_protectedState = ProtectState.STOPPING_PROTECT;
    }

    SetSettingsImpl(settings.vkMode, settings.skMode);

    ns.AddEventListener(window, "unload", function()
    {
        clearTimeout(m_protectChangeTimeout);
        clearTimeout(m_postponeStart);
        m_shutdown = true;
        m_observer.unbind();
    });

    var m_observer = new ns.FocusChangeObserver(OnElementFocus, OnElementBlur, OnSettingsChanged);
};

var instance = null;
ns.RunModule(function()
{
    if (!instance)
        instance = new VirtualKeyboard();
}, 2000);

});
(function AbpProcessor(ns)
{

function AddSelectorProcessor(selector, processors) 
{
    if (!selector)
        return;

    var str = ((selector[0] === ">") ? ":scope " : "* ") + selector;
    processors.push(function pusher(objects) 
        {
            var resultObjects = [];
            for (var i = 0; i < objects.length; ++i) 
            {
                var list = objects[i].querySelectorAll(str);
                Array.prototype.push.apply(resultObjects, list);
            }
            return resultObjects;
        });
}

function GetTextInsideBracket(queryParts)
{
    var result = "";
    for (var parentheses = 1; queryParts.index < queryParts.parts.length; ++queryParts.index)
    {
        if (!queryParts.parts[queryParts.index])
            continue;

        var part = queryParts.parts[queryParts.index];
        if (part === ")")
        {
            --parentheses;
            if (!parentheses)
                break;
        }
        else if (part === "(")
        {
            ++parentheses;
        }
        result += part;
    }
    return result;
}

function RemoveChilds(objects)
{
    for (var i = 0; i < objects.length;)
    {
        if (objects.some(
            function checker(element)  
            {
                var object = objects[i];
                if (element === object)
                    return false;

                return element.contains(object);
            }
            ))
            objects.splice(i, 1);
        else
            i++;
    }
}

function PreprocessProperties(properties)
{
    if (properties.length >= 2 && properties[0] === "/" && properties[properties.length - 1] === "/")
        return properties.substring(1, properties.length - 1);

    var props = properties.replace(/\*+/g, "*");
    props = props.replace(/\^\|$/, "^");
    props = props.replace(/\W/g, "\\$&");
    props = props.replace(/\\\*/g, ".*");
    props = props.replace(/^\\\|/, "^");
    return props.replace(/\\\|$/, "$");
}

function GetMatcherFromText(inputText)
{
    try 
    {
        var expression = "";
        var flags = ""; 
        var execResult = (/^\/(.*)\/([imu]*)$/).exec(inputText);
        if (execResult)
        {
            expression = execResult[1];
            if (execResult[2])
                flags = execResult[2];
        }
        else
        {
            expression = inputText.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"); 
        }
        return new RegExp(expression, flags);
    }
    catch (e)
    {
        return null;
    }
}

function GetMatchedStylesheetSelectors(stylesheet, propertiesMatcher)
{
    var selectors = [];
    try 
    {
        for (var i = 0; i < stylesheet.cssRules.length; ++i)
        {
            var rule = stylesheet.cssRules[i];
            if (rule.type !== rule.STYLE_RULE)
                continue;

            var properties = "";
            for (var j = 0; j < rule.style.length; j++)
            {
                var propertyName = rule.style.item(j);
                properties += propertyName + ": " + rule.style.getPropertyValue(propertyName) + ";";
            }

            if (!propertiesMatcher.test(properties))
                continue;

            selectors.push(rule.selectorText);
        }
    }
    catch (e)
    {
        return [];
    }
    return selectors;
}

function GetDomStylesStrings(propertiesMatcher)
{
    var matcher = new RegExp(propertiesMatcher, "i");
    var selectorsGroup = "";
    for (var i = 0; i < this.document.styleSheets.length; ++i)
    {
        var matchedSelectors = GetMatchedStylesheetSelectors(this.document.styleSheets[i], matcher);
        for (var selectorIndex = 0; selectorIndex < matchedSelectors.length; ++selectorIndex)
            selectorsGroup += matchedSelectors[selectorIndex] + ", ";
    }

    if (selectorsGroup.length)
        selectorsGroup = selectorsGroup.substring(0, selectorsGroup.length - 2);

    return selectorsGroup;
}


function AbpHasProcessorFactory(queryParts)
{
    var innerSelectorsProcessor = ParseQuery(queryParts);
    return function AbpHasProcessor(objects)
    {
        var resultObjects = [];
        for (var i = 0; i < objects.length; ++i)
        {
            if (innerSelectorsProcessor([objects[i]]).length)
                resultObjects.push(objects[i]);
        }
        return resultObjects;
    };
}

function AbpContainsProcessorFactory(queryParts)
{
    var textInsideBracket = GetTextInsideBracket(queryParts);
    var matcher = GetMatcherFromText(textInsideBracket);
    return function AbpContainsProcessor(objects)
        {
            var resultObjects = [];
            if (!matcher)
                return resultObjects;

            RemoveChilds(objects);
            for (var i = 0; i < objects.length; ++i)
            {
                if (matcher.test(objects[i].textContent))
                    resultObjects.push(objects[i]);
            }
            return resultObjects;
        };
}

function IsObjectPropertiesMatch(object, selectors)
{
    var parent = object.parentNode || document;
    if (object === document)
        return false;

    var selectedObjects = Array.from(parent.querySelectorAll(selectors));
    return selectedObjects.some(function checker(item) { return item === object; });
}

function AbpPopertiesProcessorFactory(queryParts)
{
    var textInsideBracket = GetTextInsideBracket(queryParts);
    var selectorRegexp = PreprocessProperties(textInsideBracket);
    var selectorsGroup = GetDomStylesStrings(selectorRegexp);

    return function AbpPopertiesProcessor(objects)
    {
        var resultObjects = [];

        if (!selectorsGroup)
            return resultObjects;

        for (var i = 0; i < objects.length; ++i)
        {
            var object = objects[i];
            if (IsObjectPropertiesMatch(object, selectorsGroup))
                resultObjects.push(object);
        }
        return resultObjects;
    };
}

function ParseQuery(queryParts)
{
    var functions = [];
    var collectedPart = "";
    for (; queryParts.index < queryParts.parts.length; ++queryParts.index)
    {
        if (!queryParts.parts[queryParts.index])
            continue;

        var part = queryParts.parts[queryParts.index];
        if (part === ")")
            break;

        var processorFactory = void 0;
        if (part === ":-abp-has(")
            processorFactory = AbpHasProcessorFactory;
        else if (part === ":-abp-contains(")
            processorFactory = AbpContainsProcessorFactory;
        else if (part === ":-abp-properties(")
            processorFactory = AbpPopertiesProcessorFactory;

        if (processorFactory)
        {
            ++queryParts.index;
            AddSelectorProcessor(collectedPart, functions);
            collectedPart = "";
            functions.push(processorFactory(queryParts));
            continue;
        }

        if (part === "(")
        {
            ++queryParts.index;
            part += GetTextInsideBracket(queryParts);
            if (queryParts.index < queryParts.parts.length)
                part += queryParts.parts[queryParts.index];
        }

        collectedPart += part;
    }

    AddSelectorProcessor(collectedPart, functions);
    return function parser(objects)
    {
        var outputObjects = objects;
        for (var i = 0; i < functions.length; ++i)
        {
            var tempObjects = functions[i](outputObjects);
            outputObjects = tempObjects;
        }

        return outputObjects;
    };
}

ns.FindElementsByAbpRule = function FindElementsByAbpRule(abpRule)
{
    var result = [];
    try 
    {
        var partsValues = abpRule.split(/(:-abp-has\()|(:-abp-contains\()|(:-abp-properties\()|(\()|(\))/g);
        var operation = ParseQuery({ parts: partsValues, index: 0 });
        result = operation([document]);
    }
    catch (e)
    {
        ns.SessionError({ message: "ERR processing abp rule", details: "rule: " + abpRule + "\r\n" + (e.message || e) }, "ab_abp");
        return [];
    }
    return result;
};

return ns;

})(KasperskyLab);
KasperskyLab.AddEventListener(document, "click", function onClick(event) {
    var element = event.target.closest("a[href]");
    if ( element !== null && typeof element.href === "string" )
        browsersApi.runtime.sendMessage({command: "sendPopupUrl", url: element.href});
    else
        browsersApi.runtime.sendMessage({command: "sendPopupUrl", url: ""});
});

function GetCommonLink()
{
    var commonLink = KasperskyLab.GetResourceSrc("/abn/main.css");
    if (!KasperskyLab.IsRelativeTransport())
        return commonLink;

    return "/" + commonLink.substr(KasperskyLab.GetBaseUrl().length);
}

function FindCommonLink()
{
    if (document.querySelector)
        return document.querySelector("link[href^=\"" + GetCommonLink() + "\"]");

    for (var i = 0; i < document.styleSheets.length; ++i)
    {
        var currentStyleSheet = document.styleSheets[i];
        if (currentStyleSheet.href && currentStyleSheet.href.indexOf(GetCommonLink()) !== -1)
            return document.styleSheets[i].ownerNode || document.styleSheets[i].owningElement;
    }

    return null;
}

var abnRunner = function abnRunner(ns, session, settings)
{
    function AntiBanner()
    {
        var m_callFunction = ns.EmptyFunc;
        var m_usingStyles = [];
        var m_deferredProcess = null;
        var m_processedIdentifier = "kl_abn_" + ns.GetCurrentTime();
        var m_firstRun = true;
        var m_randColorAttribute = settings.randomColor;
        var m_randBackgroundColorAttribute = settings.randomBackgroundColor;

        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        function ScheduleCalculateProcessedItems()
        {
            clearTimeout(m_deferredProcess);
            m_deferredProcess = ns.SetTimeout(CalculateNewProcessedItems, 500);
        }
        function GetOwnerNode(sheet)
        {
            return sheet.ownerNode || sheet.owningElement;
        }

        function GetStyleSheetFromNode(node)
        {
            return node.sheet || node.styleSheet;
        }

        function AddUsingStyle(sheetNodes)
        {
            for (var i = 0; i < document.styleSheets.length; ++i)
            {
                var ownerNode = GetOwnerNode(document.styleSheets[i]);
                if (sheetNodes.indexOf(ownerNode) !== -1)
                    AddAntiBannerStyleSheet(document.styleSheets[i]);
            }
        }

        function ApplyAbpRulesDelay(rule)
        {
            ns.SetTimeout(function ApplyAbpRulesTimerCallback() 
                {
                    var elements = ns.FindElementsByAbpRule(rule);
                    var newProcessedCount = 0;
                    for (var i = 0; i < elements.length; ++i)
                    {
                        if (!elements[i][m_processedIdentifier])
                        {
                            elements[i][m_processedIdentifier] = true;
                            elements[i].style.display = "none";
                            ++newProcessedCount;
                        }
                    }
                    if (newProcessedCount)
                        SendAntibannerStat(newProcessedCount);
                }, 0);
        }

        function ApplyAbpRules(rules)
        {
            if (!ns.FindElementsByAbpRule)
            {
                ns.SessionError("Function for abp rules is not defined", "ab_abp");
                return;
            }

            for (var i = 0; i < rules.length; i++)
                ApplyAbpRulesDelay(rules[i]);
        }

        function SetCss(rules)
        {
            if (rules)
            {
                if (rules.rules)
                {
                    var sheetNodes = ns.AddStyles(rules.rules);
                    ns.SetTimeout(function SetCssTimerCallback() { AddUsingStyle(sheetNodes); }, 0);
                }

                if (rules.abpRules && rules.abpRules.length)
                    ApplyAbpRules(rules.abpRules);
            }

            ScheduleCalculateProcessedItems();
        }

        function CalculateNewProcessedItemsBySelector(selector)
        {
            var newProcessedCount = 0;
            var elementList = document.querySelectorAll(selector);
            for (var i = 0; i < elementList.length; ++i)
            {
                if (!elementList[i][m_processedIdentifier])
                {
                    elementList[i][m_processedIdentifier] = true;
                    ++newProcessedCount;
                }
            }
            return newProcessedCount;
        }

        function DeferredProcessCssRules(rules, i)
        {
            try
            {
                SendAntibannerStat(CalculateNewProcessedItemsBySelector(rules[i].selectorText));
            }
            catch (e)
            {
                e.detail = "number: " + i + "\r\nrule: " + rules[i].selectorText;
                ns.SessionError(e, "abn");
            }
        }

        function GetDeferredHandler(rules, i)
        {
            return function GetDeferredHandlerImpl() { DeferredProcessCssRules(rules, i); };
        }

        function ProcessCssRules(rules)
        {
            for (var i = 0; i < rules.length; ++i)
                ns.SetTimeout(GetDeferredHandler(rules, i), 0);
        }

        function CalculateNewProcessedItemsByStyle()
        {
            var newProcessedCount = 0;
            var elementList = document.getElementsByTagName("*");
            for (var i = 0; i < elementList.length; ++i)
            {
                if (!elementList[i][m_processedIdentifier]
                    && elementList[i].currentStyle.color === m_randColorAttribute
                    && elementList[i].currentStyle.backgroundColor === m_randBackgroundColorAttribute)
                {
                    elementList[i][m_processedIdentifier] = true;
                    ++newProcessedCount;
                }
            }
            return newProcessedCount;
        }

        function CalculateNewProcessedItems()
        {
            if (document.querySelectorAll)
            {
                var atLeastOneStyleExist = false;
                for (var i = 0; i < m_usingStyles.length; ++i)
                {
                    var cssRules = m_usingStyles[i].cssRules || m_usingStyles[i].rules;
                    if (cssRules && cssRules.length)
                    {
                        ProcessCssRules(cssRules);
                        atLeastOneStyleExist = true;
                    }
                }
                if (!atLeastOneStyleExist)
                {
                    SendAntibannerStat(0);
                    ns.SessionLog("No one style exist. Count of using styles nodes: " + m_usingStyles.length);
                }
            }
            else
            {
                SendAntibannerStat(CalculateNewProcessedItemsByStyle());
            }
        }

        function SendAntibannerStat(newProcessedCount)
        {
            if (m_firstRun || newProcessedCount !== 0)
            {
                m_callFunction("abn.statInfo", { count: newProcessedCount });
                m_firstRun = false;
            }
        }

        function AddAntiBannerStyleSheet(styleSheet)
        {
            if (!styleSheet)
                return;

            m_usingStyles.push(styleSheet);
        }
        function OnLoadCommonCss(arg)
        {
            var target = arg.target || arg.srcElement;
            var sheetNode = GetStyleSheetFromNode(target);
            if (!sheetNode)
            {
                ns.SessionError("OnLoadCommonCss fail with not exist sheet", "abn");
                return;
            }
            AddAntiBannerStyleSheet(sheetNode);
            ScheduleCalculateProcessedItems();
        }

        session.InitializePlugin(
            function InitializePluginABN(activatePlugin, registerMethod, callFunction)
            {
                m_callFunction = callFunction;
                activatePlugin("abn", OnPing);
            }
            );

        if (settings.insertCommonLink)
        {
            var link = document.createElement("link");
            link.setAttribute("type", "text/css");
            link.setAttribute("rel", "stylesheet");
            link.setAttribute("href", ns.GetResourceSrc("/abn/main.css"));
            link.setAttribute("crossorigin", "anonymous");
            ns.AddEventListener(link, "load", OnLoadCommonCss);
            if (document.head)
                document.head.appendChild(link);
            else
                document.getElementsByTagName("head")[0].appendChild(link);
        }

        SetCss(settings);
    }


    var instance = null;
    ns.RunModule(function RunModuleAB()
    {
        if (!instance)
            instance = new AntiBanner();
    });
};

var abnOptions = {
    name: "abn",
    runner: abnRunner,
    getParameters: function getParameters() { return { isCssUrlInjected: Boolean(FindCommonLink()) }; }
};

KasperskyLab.AddRunner2(abnOptions);
(function UrlAdvisorBalloonMain(ns)
{

ns.UrlAdvisorBalloon = function UrlAdvisorBalloon(session, locales)
{
    var m_balloon = new ns.Balloon2("ua", "/ua/url_advisor_balloon.html", "/ua/balloon.css", session, GetCoordsCallback, OnCloseHandler, locales, OnDataReceiveHandler);
    var m_currentVerdict = null;

    var m_mouseX = 0;
    var m_mouseY = 0;
    var ratingIds = [
        { className: "green", headerNode: locales["UrlAdvisorBalloonHeaderGood"], textNode: locales["UrlAdvisorSetLocalContentOnlineGood"] },
        { className: "grey", headerNode: locales["UrlAdvisorBalloonHeaderSuspicious"], textNode: locales["UrlAdvisorSetLocalContentOnlineSuspicious"] },
        { className: "red", headerNode: locales["UrlAdvisorBalloonHeaderDanger"], textNode: locales["UrlAdvisorSetLocalContentOnlineDanger"] },
        { className: "yellow", headerNode: locales["UrlAdvisorBalloonHeaderWmuf"], textNode: locales["UrlAdvisorSetLocalContentOnlineWmuf"] },
        { className: "orange", headerNode: locales["UrlAdvisorBalloonHeaderCompromised"], textNode: locales["UrlAdvisorSetLocalContentOnlineCompromised"] }
    ];

    function GetCoordsCallback(balloonSize)
    {
        return GetCoord(balloonSize, m_mouseX, m_mouseY);
    }

    function OnCloseHandler(arg)
    {
        if (arg === 0)
            m_balloon.Hide();
    }

    function OnDataReceiveHandler()
    {

    }

    function GetCoord(balloonSize, clientX, clientY)
    {
        var coord = { x: 0, y: 0 };
        var clientWidth = ns.GetPageWidth();
        var halfWidth = balloonSize.width / 2;
        if (halfWidth > clientX)
            coord.x = 0;
        else if (halfWidth + clientX > clientWidth)
            coord.x = clientWidth - balloonSize.width;
        else
            coord.x = clientX - halfWidth;

        var clientHeight = ns.GetPageHeight();
        coord.y = (clientY + balloonSize.height > clientHeight) ? clientY - balloonSize.height : clientY;
        if (coord.y < 0)
            coord.y = 0;

        var scroll = ns.GetPageScroll();
        coord.y += scroll.top;
        coord.x += scroll.left;
        return coord;
    }

    this.HideBalloon = function HideBalloon()
    {
        m_balloon.Hide();
    };

    this.ShowBalloon = function ShowBalloon(clientX, clientY, verdict)
    {
        m_mouseX = clientX;
        m_mouseY = clientY;

        m_currentVerdict = verdict;
        m_balloon.Show(ratingIds[m_currentVerdict.rating - 1].className + " " + ns.md5(verdict.url), { verdict: m_currentVerdict, locales: locales });
    };
};

})(KasperskyLab || {});
var PostponeCheckAtributeName = "kl_" + KasperskyLab.GetCurrentTime();
var IconName = "kl_" + KasperskyLab.GetCurrentTime();

KasperskyLab.AddRunner("ua", function AddRunnerUa(ns, session, settings, locales)
{

var UrlAdvisor = function UrlAdvisor()
{
    var m_urlAdvisorBalloon = new ns.UrlAdvisorBalloon(session, locales);
    var m_enabled = settings.enable;
    var m_checkOnlySearchResults = settings.mode;
    var m_linkSelector = settings.linkSelector;
    var m_elementAfterSelector = settings.elementAfterSelector;
    var m_emptySearchResultSent = false;
    var m_isVerdictSuitableForContinueFunc = function AlwaysSuitable() { return true; };

    var m_postponeCategorizeStarted = false;
    var m_urlCategorizeRequestTime = 0;
    var m_observer = null;

    var m_callFunction = ns.EmptyFunc;
    var m_categorizingObjects = {};
    var m_clearCategorizingObjectsTimerId = null;

    function AddToCategorizeList(url, linkElement)
    {
        if (url in m_categorizingObjects)
            m_categorizingObjects[url].push(linkElement);
        else
            m_categorizingObjects[url] = [linkElement];
    }

    session.InitializePlugin(function InitializePluginUa(activatePlugin, registerMethod, callFunction) 
        {
            m_callFunction = callFunction;

            if (settings.needCheckVerdicts)
            {
                m_isVerdictSuitableForContinueFunc = function CheckVerdict(verdict) 
                    {
                        return verdict.rating === 3 || verdict.rating === 4 || verdict.rating === 5;
                    };
            }
            activatePlugin("ua", OnPing);
            registerMethod("ua.verdict", SetVerdictDelayed);
            registerMethod("ua.settings", SetSettings);
        });

    Run();
    function OnPing(currentTime)
    {
        var timeFormRequest = (currentTime >= m_urlCategorizeRequestTime) ? currentTime - m_urlCategorizeRequestTime : 0;

        return timeFormRequest <= 10000 ? 500 : ns.MaxRequestDelay;
    }

    function GetHref(link)
    {
        try { return link.href; } 
        catch (e) {}
        try { return link.getAttribute("href"); } 
        catch (e) {}
        return "";
    }

    function CreateIcon()
    {
        var icon = document.createElement("img");
        icon.name = IconName;
        icon.width = 16;
        icon.height = 16;
        icon.style.cssText = "width: 16px!important; height: 16px!important;";
        icon.onclick = function onclick(evt) { ns.StopProcessingEvent(evt); };
        return icon;
    }

    function GetLinkIcon(linkElement)
    {
        var nextElement = linkElement.nextSibling;
        if (m_elementAfterSelector)
        {
            nextElement = linkElement.querySelector(m_elementAfterSelector);
            if (nextElement)
                nextElement = nextElement.nextSibling;
            else
                nextElement = linkElement.nextSibling;
        }
        return (nextElement !== null && nextElement.name === IconName) ? nextElement : null;
    }

    function GetOrCreateLinkIcon(linkElement)
    {
        var icon = GetLinkIcon(linkElement);
        if (icon)
            return icon;

        var nextElement = linkElement;
        if (m_elementAfterSelector)
        {
            nextElement = linkElement.querySelector(m_elementAfterSelector);
            if (!nextElement)
                nextElement = linkElement;
        }
        nextElement.parentNode.insertBefore(CreateIcon(), nextElement.nextSibling);
        return nextElement.nextSibling;
    }

    function GetLinkElementByIcon(icon)
    {
        if (!m_elementAfterSelector)
            return icon.previousSibling;
        var searchLinks = document.querySelectorAll(m_linkSelector);
        for (var i = 0; i < searchLinks.length; i++)
        {
            var elem = searchLinks[i].querySelector(m_elementAfterSelector);
            if (searchLinks[i].nextSibling === icon || (elem && elem.nextSibling === icon))
                return searchLinks[i];
        }
        return icon.previousSibling;
    }

    function UpdateIconImage(icon, verdict)
    {
        if (verdict.rating === 1)
        {
            icon.src = locales["UrlAdvisorGoodImage.png"];
            icon["kis_status"] = 16;
        }
        else if (verdict.rating === 2)
        {
            icon.src = locales["UrlAdvisorSuspiciousImage.png"];
            icon["kis_status"] = 8;
        } 
        else if (verdict.rating === 3)
        {
            icon.src = locales["UrlAdvisorDangerImage.png"];
            icon["kis_status"] = 4;
        }
        else if (verdict.rating === 4)
        {
            icon.src = locales["UrlAdvisorwmufImage.png"];
        }
        else if (verdict.rating === 5)
        {
            icon.src = locales["UrlAdvisorCompromisedImage.png"];
        }
    }
    function SubscribeIconOnMouseEvents(icon, verdict)
    {
        var balloonTimerId = 0;
        ns.AddEventListener(icon, "mouseout", function OnMouseout()
            {
                if (balloonTimerId)
                {
                    clearTimeout(balloonTimerId);
                    balloonTimerId = 0;
                }
            });

        ns.AddEventListener(icon, "mouseover", function OnMouseover(args)
            {
                if (!balloonTimerId)
                {
                    var clientX = args.clientX;
                    var clientY = args.clientY;
                    balloonTimerId = ns.SetTimeout(function TimerCallback()
                        {
                            m_urlAdvisorBalloon.ShowBalloon(clientX, clientY, verdict);
                            balloonTimerId = 0;
                        }, 300);
                }
            });
    }
    function IsElementEmpty(linkElement)
    {
        return !linkElement.offsetHeight && !linkElement.offsetWidth
            && !linkElement.outerText && !linkElement.text;
    }

    function SetVerdictForUrl(verdict)
    {
        try
        {
            if (!(verdict.url in m_categorizingObjects))
                return;

            var linkElements = m_categorizingObjects[verdict.url];
            for (var linkIndex = 0; linkIndex < linkElements.length; ++linkIndex)
            {
                if (IsElementEmpty(linkElements[linkIndex]))
                    continue;
                linkElements[linkIndex][PostponeCheckAtributeName] = false;
                if (!m_isVerdictSuitableForContinueFunc(verdict))
                    continue;
                var icon = GetOrCreateLinkIcon(linkElements[linkIndex]);
                if (!icon)
                    continue;

                UpdateIconImage(icon, verdict);
                SubscribeIconOnMouseEvents(icon, verdict);
            }
        }
        catch (e)
        {
            ns.SessionError(e, "ua");
        }
        delete m_categorizingObjects[verdict.url];
    }

    function SetVerdict(argument)
    {
        for (var currentVerdict = 0; currentVerdict < argument.verdicts.length; currentVerdict++)
            SetVerdictForUrl(argument.verdicts[currentVerdict]);
    }

    function SetVerdictDelayed(argument)
    {
        ns.SetTimeout(function TimerCallback() { SetVerdict(argument); }, 1000);
    }

    function SetSettingsImpl(argument)
    {
        m_enabled = argument.enable;
        if (!m_enabled)
            return;

        m_checkOnlySearchResults = argument.mode;
    }

    function ClearImages()
    {
        var images = document.getElementsByName(IconName);
        while (images.length > 0)
            images[0].parentNode.removeChild(images[0]);
    }
    function ClearAttributes()
    {
        for (var i = 0; i < document.links.length; ++i)
        {
            if (document.links[i][PostponeCheckAtributeName])
                document.links[i][PostponeCheckAtributeName] = false;
        }
    }

    function SetSettings(argument)
    {
        ClearImages();
        ClearAttributes();
        SetSettingsImpl(argument);
        CategorizeUrl();
    }

    function IsNeedCategorizeLink(linkElement)
    {
        try
        {
            return !linkElement.isContentEditable && Boolean(linkElement.parentNode)
                && !GetLinkIcon(linkElement) && !linkElement[PostponeCheckAtributeName]
                && !IsElementEmpty(linkElement);
        }
        catch (e)
        {
            ns.SessionLog("check link exception: " + (e.message || e));
            return false;
        }
    }

    function ProcessDomChange()
    {
        try
        {
            ns.SessionLog("UA: Process dom change");
            if (!m_postponeCategorizeStarted)
            {
                ns.SetTimeout(CategorizeUrl, 500);
                m_postponeCategorizeStarted = true;
            }
            var images = document.getElementsByName(IconName);
            for (var i = 0; i < images.length; ++i)
            {
                var linkNode = GetLinkElementByIcon(images[i]);
                if (!linkNode || !linkNode.nodeName || linkNode.nodeName.toLowerCase() !== "a")
                {
                    var imageNode = images[i];
                    imageNode.parentNode.removeChild(imageNode);
                }
            }
        }
        catch (e)
        {
            ns.SessionError(e, "ua");
        }
    }
    function CategorizeUrl()
    {
        try
        {
            if (!m_enabled)
            {
                ns.SessionLog("skip categorize links because UA disabled");
                return;
            }

            ns.SessionLog("UA: collect links for categorize");
            m_postponeCategorizeStarted = false;
            var linksForCategorize = [];

            var linksForCheck = [];
            if (!m_checkOnlySearchResults)
                linksForCheck = document.links;
            else if (m_linkSelector && m_checkOnlySearchResults)
                linksForCheck = document.querySelectorAll(m_linkSelector);

            for (var i = 0; i < linksForCheck.length; i++)
            {
                var link = linksForCheck[i];
                if (IsNeedCategorizeLink(link))
                {
                    link[PostponeCheckAtributeName] = true; 
                    var href = GetHref(link);
                    if (href)
                    {
                        linksForCategorize.push(href); 
                        AddToCategorizeList(href, link);
                    } 
                    else 
                    {
                        ns.Log("access to href blocked by browser"); 
                    }
                }
            }
            var isEmptySearchResult = m_linkSelector && m_checkOnlySearchResults && linksForCheck.length === 0;
            if (isEmptySearchResult || linksForCategorize.length)
            {
                if (isEmptySearchResult)
                {
                    if (m_emptySearchResultSent)
                        return;
                    m_emptySearchResultSent = true;
                }
                var args = { links: linksForCategorize };
                m_callFunction("ua.categorize", args);
                m_urlCategorizeRequestTime = ns.GetCurrentTime();


                clearTimeout(m_clearCategorizingObjectsTimerId);
                m_clearCategorizingObjectsTimerId = ns.SetTimeout(function TimerCallback()
                {
                    m_categorizingObjects = {};
                }, 1000 * 60 * 5);
            }
            else
            {
                ns.SessionLog("UA not found links for categorization");
            }
        }
        catch (e)
        {
            ns.SessionError(e, "ua");
        }
    }

    function Run()
    {
        CategorizeUrl();

        m_observer = ns.GetDomChangeObserver("a");
        m_observer.Start(ProcessDomChange);
        ns.AddEventListener(window, "load", CategorizeUrl);
    }
};

var instance = null;
ns.RunModule(function RunModuleUrlAdvisor()
{
    if (!instance)
        instance = new UrlAdvisor();
}, 2500);

});
KasperskyLab.AddRunner("wsm", function AddRunnerWsm(ns, session)
{
    if (window !== window.top)
        return;

    var m_callFunction = null;

    var m_activatedState = 0;
    var m_activatedStateChangeTimeout = null;
    var m_documentTitleIsAvailable = false;
    var m_stateChangeDelayTimeout = null;

    function Initialize()
    {
        session.InitializePlugin(function InitializePluginWsm(activatePlugin, registerMethod, callFunction)
        {
            m_callFunction = callFunction;
            activatePlugin("wsm", OnPing);
            registerMethod("wsm.forceRedirect", ForceRedirect);
        });
    }

    function OnPing()
    {
        return ns.MaxRequestDelay;
    }

    function ForceRedirect(args)
    {
        ns.SessionLog("Force reload to address: " + args.url);
        document.location.href = args.url;
    }

    function FireActivateEventImpl()
    {
        m_callFunction("wsm.sessionActivated", { title: document.title }, function SessionActivatedCallback()
        {
            if (m_activatedState === 3)
                ProcessDeactivate();
            m_activatedState = 2;
        });
        m_activatedState = 1;
    }

    function FireDeactivateEventImpl()
    {
        m_callFunction("wsm.sessionDeactivated", { title: document.title }, function SessionDeactivatedCallback()
        {
            if (m_activatedState === 1)
                ProcessActivate();
            m_activatedState = 0;
        });
        m_activatedState = 3;
    }

    function FireActivateEvent()
    {
        clearTimeout(m_stateChangeDelayTimeout);

        if (m_documentTitleIsAvailable || document.title)
        {
            m_documentTitleIsAvailable = true;
            FireActivateEventImpl();
        }
        else
        {
            m_stateChangeDelayTimeout = ns.SetTimeout(function TimerCallback()
                {
                    m_documentTitleIsAvailable = true;
                    ProcessActivate();
                }, 500);
        }
    }

    function FireDeactivateEvent()
    {
        if (m_documentTitleIsAvailable)
            FireDeactivateEventImpl();
        else
            clearTimeout(m_stateChangeDelayTimeout);
    }

    function ProcessActivate()
    {
        clearTimeout(m_activatedStateChangeTimeout);
        m_activatedStateChangeTimeout = ns.SetTimeout(function TimerCallback()
            {
                if (m_activatedState === 0)
                    FireActivateEvent();
                else if (m_activatedState === 3)
                    m_activatedState = 1;
            }, 0);
    }

    function ProcessDeactivate()
    {
        clearTimeout(m_activatedStateChangeTimeout);
        m_activatedStateChangeTimeout = ns.SetTimeout(function TimerCallback()
            {
                if (m_activatedState === 2)
                    FireDeactivateEvent();
                else if (m_activatedState === 1)
                    m_activatedState = 3;
            }, 0);
    }

    function OnFocus()
    {
        if (m_callFunction)
            ProcessActivate();
    }

    function OnBlur()
    {
        if (m_callFunction && !document.hasFocus())
            ProcessDeactivate();
    }

    Initialize();
    if (document.hasFocus())
    {
        FireActivateEvent();
        ns.AddEventListener(window, "load", function OnLoad()
            {
                if (!document.hasFocus())
                    ProcessDeactivate();
            });
    }

    if (window.addEventListener)
    {
        ns.AddEventListener(window, "focus", OnFocus);
        ns.AddEventListener(window, "blur", OnBlur);
    }
    else
    {
        ns.AddEventListener(document, "focusin", OnFocus);
        ns.AddEventListener(document, "focusout", OnBlur);
    }

    ns.AddEventListener(window, "unload", function OnUnload()
        {
            clearTimeout(m_activatedStateChangeTimeout);
            m_activatedStateChangeTimeout = null;
            m_callFunction = null;
        });

    if ("onhashchange" in window)
    {
        window.addEventListener("hashchange", function OnHashchange()
        {
            var args = { newLocationUrl: document.location.href };
             if (m_callFunction)
                m_callFunction("wsm.onHashChange", args);
        });
    }
}, {
    referrer: document.referrer,
    stubId: (function stubId()
    {
        var scripts = [];
        if (document.querySelectorAll)
        {
            scripts = document.querySelectorAll("[stubid]");
        }

        if (scripts && scripts.length > 0)
            return scripts[0].getAttribute("stubid");
        return "";
    })()
});
var LastSearchRequest = {};

KasperskyLab.AddRunner("sam", function AddRunnerSam(ns, session, settings)
{

var SearchMonitor = function SearchMonitor()
{
    var m_callFunction = ns.EmptyFunc;
    var m_postponeSendStarted = false;
    var m_pingTimeout = ns.MaxRequestDelay;
    var m_getSearchSiteRequest = ns.EmptyFunc;
    var m_getTypedSearchRequest = ns.EmptyFunc;
    var m_getRealSearchRequest = ns.EmptyFunc;
    var m_originalPushState = ns.EmptyFunc;

    if (ns.IsDefined(settings.realSearchResultSelector) && settings.realSearchResultSelector.length > 0)
        settings.realSearchResultSelectorList = [settings.realSearchResultSelector];

    function DecodeURI(query)
    {
        return decodeURIComponent(query.replace(/\+/g, " "));
    }

    function GetSearchRequest(parameterName)
    {
        var parameters = document.location.href.split(/[?#&]/);
        var result = "";
        for (var i = 0; i < parameters.length; ++i)
        {
            var parameter = parameters[i];
            var parameterSeparatorPos = parameter.indexOf("=");
            if (parameterSeparatorPos === -1)
                continue;
            if (parameter.substr(0, parameterSeparatorPos) !== parameterName)
                continue;

            result = DecodeURI(parameter.substr(parameterSeparatorPos + 1));
        }
        return result;
    }

    function NotSearchSiteRequest()
    {
        return "";
    }

    function GetSearchParamsFromSettings(settingsRule)
    {
        try
        {
            m_getSearchSiteRequest = function getSearchSiteRequestImpl() 
            {
                var result = "";
                for (var i = 0; i < settingsRule.searchResultSelector.length; ++i)
                    result = result || GetSearchRequest(settingsRule.searchResultSelector[i]);

                return result;
            };

            if (settingsRule.typedSearchRequest)
            {
                m_getTypedSearchRequest = function getTypedSearchRequestImpl() 
                {
                    var t = document.getElementById(settingsRule.typedSearchRequest);
                    if (t && t.tagName.toLowerCase() === "input")
                        return t.value;
                    return m_getSearchSiteRequest();
                };
            }
            else
            {
                m_getTypedSearchRequest = m_getSearchSiteRequest;
            }

            if (settingsRule.realSearchResultSelectorList)
            {
                m_getRealSearchRequest = function getRealSearchRequestImpl(request) 
                {
                    for (var i = 0; i < settingsRule.realSearchResultSelectorList.length; i++)
                    {
                        var elements = document.querySelectorAll(settingsRule.realSearchResultSelectorList[i]);
                        if (elements && elements.length > 0)
                        {
                            var res = elements[0].innerText || elements[0].value || elements[0].text || "";
                            if (res !== request)
                                return res;
                            ns.SessionLog("Real and type search request are equal");
                        }
                        else
                        {
                            ns.SessionLog("No elements found for real search request");
                        }
                    }
                    return "";
                };
            }
            else
            {
                m_getRealSearchRequest = NotSearchSiteRequest;
                ns.SessionLog("No selectors found for real search request");
            }
        }
        catch (e)
        {
            m_getSearchSiteRequest = NotSearchSiteRequest;
            m_getTypedSearchRequest = NotSearchSiteRequest;
            m_getRealSearchRequest = NotSearchSiteRequest;
        }
    }

    function IsSameRequest(left, right)
    {
        if (!left || !right)
            return false;
        return left.queryText === right.queryText && left.typedText === right.typedText && left.queryTextForSearchResults === right.queryTextForSearchResults;
    }

    function CollectAndSendSearchResults()
    {
        m_postponeSendStarted = false;
        var request = m_getSearchSiteRequest();
        ns.SessionLog("SAM: Collect and send search results for request \"" + request + "\"");
        var queryTextForSearchResults = m_getRealSearchRequest(request);
        var searchResult =
        {
                url: document.location.href,
                queryText: request,
                typedText: m_getTypedSearchRequest(),
                queryTextForSearchResults_initialized: Boolean(queryTextForSearchResults.length),  
                queryTextForSearchResults: queryTextForSearchResults
            };

        if (IsSameRequest(searchResult, LastSearchRequest) || !request)
            return;

        ns.SetTimeout(CollectAndSendSearchResults, 5000);
        var onSuccess = function onSuccess() { LastSearchRequest = searchResult; };
        m_callFunction("sam.SearchResult2", searchResult, onSuccess);
    }

    function PostponeCollectAndSendSearchResult()
    {
        ns.SessionLog("SAM: Postpone collect and send search result: " + !m_postponeSendStarted);
        if (!m_postponeSendStarted)
        {
            ns.SetTimeout(CollectAndSendSearchResults, 500);
            m_postponeSendStarted = true;
        }
    }

    function OnPing()
    {
        return m_pingTimeout;
    }

    function ReloadPage(argument)
    {
        if (argument && argument.url !== document.location.href)
            window.history.pushState(0, document.title, ns.StartLocationHref);

        m_callFunction("sam.onReload");
        session.Reload();
    }


    ns.SessionLog("SAM: Start");
    GetSearchParamsFromSettings(settings);

    session.InitializePlugin(function InitializePluginSam(activatePlugin, registerMethod, callFunction)
    {
        m_callFunction = callFunction;
        activatePlugin("sam", OnPing);
        registerMethod("sam.reloadStart", function SamReloadStart() { m_pingTimeout = 500; });
        registerMethod("sam.reloadEnd", function SamReloadEnd() { m_pingTimeout = ns.MaxRequestDelay; });
        registerMethod("sam.reload", ReloadPage);
    });

    CollectAndSendSearchResults();

    var m_observer = ns.GetDomChangeObserver("a");
    m_observer.Start(PostponeCollectAndSendSearchResult);
    ns.AddEventListener(window, "unload", function OnUnload()
        {
            ns.SessionLog("SAM: Stop observer");
            if (m_observer)
                m_observer.Stop();
        });
    ns.SessionLog("SAM: Started");
};

var instance = null;

function RunSearchMonitor() 
{
    if (!instance)
        instance = new SearchMonitor();
}

ns.RunModule(RunSearchMonitor, 10000);

});
KasperskyLab.AddRunner("wsc", function AddRunnerWsc(ns, session)
{
    var WebsiteCredentials = function WebsiteCredentials()
    {
        var m_callFunction = ns.EmptyFunc;
        var m_syncCallFunction = ns.EmptyFunc;
        var m_lastPasswordSended = null;
        var m_subscribedAttributeName = "kl_wsc_" + ns.GetCurrentTime();
        var m_passwordInputObserver = ns.GetDomChangeObserver("input");

        Initialize();

        function Initialize()
        {
            session.InitializePlugin(function InitializePluginWsc(activatePlugin, registerMethod, callFunction, deactivate, syncCall)
            {
                m_callFunction = callFunction;
                m_syncCallFunction = syncCall;
                activatePlugin("wsc", OnPing);
            });

            SetEventListeners();
            m_passwordInputObserver.Start(SetEventListeners);
            ns.AddEventListener(window, "load", SetEventListeners);
            ns.AddEventListener(window, "unload", function OnUnload()
                {
                    ns.SessionLog("Stop observe input for WSC");
                    if (m_passwordInputObserver)
                        m_passwordInputObserver.Stop();
                });
            ns.SessionLog("WSC finish initialize");
        }

        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        function IsVisible(element)
        {
            var style = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;
            return style.display !== "none";
        }
        function IsSubscribedElement(element)
        {
            return element[m_subscribedAttributeName];
        }
        function MarkSubscribedElement(element)
        {
            element[m_subscribedAttributeName] = true;
        }
        function GetElements(element, tag, type)
        {
            if (element.querySelectorAll)
                return element.querySelectorAll(tag + "[type='" + type + "']");

            var result = [];
            var childrens = element.getElementsByTagName(tag);
            for (var i = 0; i < childrens.length; i++)
            {
                if (childrens[i].type.toLowerCase() === type)
                    result.push(childrens[i]);
            }
            return result;
        }

        function GetFormAction(parentForm)
        {
            var formAction = parentForm.action;
            if (typeof parentForm.action !== "string" && parentForm.getAttribute)
            {
                var tmp = document.createElement("form");
                tmp.setAttribute("action", parentForm.getAttribute("action"));
                formAction = tmp.action;
            }
            if (formAction && (formAction.toLowerCase().indexOf("http://") === 0 || formAction.toLowerCase().indexOf("https://") === 0))
                return formAction;
            return "";
        }

        function OnSubmitEventListener(element, parentForm)
        {
            if (IsVisible(element) && Boolean(element.value) && element.value !== m_lastPasswordSended)
            {
                m_lastPasswordSended = element.value;
                var hash = ns.md5(element.value) || "";
                var url = GetFormAction(parentForm) || document.location.toString() || "";
                var args = { url: url, passwordHash: hash };
                if (!m_syncCallFunction("wsc.WebsiteCredentialSendPasswordHash", args))
                    m_callFunction("wsc.WebsiteCredentialSendPasswordHash", args);
            }
        }

        function GetCallback(element, parentForm)
        {
            return function callback()
            {
                OnSubmitEventListener(element, parentForm);
            };
        }

        function GetSubmitButtons(parentForm)
        {
            return GetElements(parentForm, "input", "submit");
        }
        function GetSingleButton(parentForm)
        {
            var buttons = GetElements(parentForm, "button", "submit"); 
            if (buttons.length > 0) 
                return buttons;

            buttons = parentForm.getElementsByTagName("button");
            var result = [];
            for (var i = 0; i < buttons.length; i++)
            {
                if (IsVisible(buttons[i])) 
                    result.push(buttons[i]);
            }
            return result;
        }
        function SetEnterKeyEventListener(element, callback)
        {
            ns.AddEventListener(element, "keydown", function OnKeydown(e) { if (e.keyCode === 13) callback(); });
        }
        function SetButtonClickEventListener(element, callback)
        {
            ns.AddEventListener(element, "click", callback);
        }
        function SetFormEventListeners(parentForm, elements, callback)
        {
            for (var i = 0; i < elements.length; ++i) 
            {
                SetButtonClickEventListener(elements[i], callback);
                SetEnterKeyEventListener(elements[i], callback);
            }
            SetEnterKeyEventListener(parentForm, callback);
            ns.AddEventListener(parentForm, "submit", callback);
        }
        function SetEventListeners()
        {
            var passwordEditors = GetElements(document, "input", "password");
            ns.SessionLog("Founded password inputs count " + passwordEditors.length);
            for (var i = 0, length = passwordEditors.length; i < length; ++i)
            {
                if (IsSubscribedElement(passwordEditors[i]))
                    continue;
                var passwordForm = passwordEditors[i].form || document;
                if (passwordForm)
                {
                    var buttons = GetSubmitButtons(passwordForm);
                    if (buttons.length === 0)
                        buttons = GetSingleButton(passwordForm);
                    ns.SessionLog("Buttons count " + buttons.length);
                    var callback = GetCallback(passwordEditors[i], passwordForm);

                    SetFormEventListeners(passwordForm, buttons, callback);
                    SetEnterKeyEventListener(passwordEditors[i], callback);
                }
                MarkSubscribedElement(passwordEditors[i]);
            }
        }
    };

    var instance = null;
    ns.RunModule(function RunModuleWebsiteCredentials()
    {
        if (!instance)
            instance = new WebsiteCredentials();
    }, 2000);
});
var compromisedAccountHandler = KasperskyLab.EmptyFunc;
var eventHandler = function eventHandler(arg) { compromisedAccountHandler(arg); };
KasperskyLab.AddEventListener(document, "click", eventHandler);
KasperskyLab.AddEventListener(document, "keydown", eventHandler);
KasperskyLab.AddEventListener(document, "submit", eventHandler);
KasperskyLab.AddRunner("ca", function AddRunnerCA(ns, session, settings)
{
    var m_callFunction = ns.EmptyFunc;
    var m_onUnloadCallFunction = ns.EmptyFunc;
    var m_bodySended = false;
    var m_lastSendedTime = 0;
    var m_domParser = ns.GetDomParser(session);
    var m_inputs = [];
    var m_forms = [];
    var m_buttons = [];
    var m_settings = settings;
    var m_submitCall = false;

    function CallService(commandName, argObject)
    {
        m_callFunction("ca." + commandName, argObject, null, null);
    }

    function TryOnUnloadCallService(commandName, argObject, resultCallback)
    {
        return m_onUnloadCallFunction("ca." + commandName, argObject, resultCallback);
    }

    function OnKeyDown()
    {
        if (m_bodySended)
            return;

        ns.SessionLog("Find login selectors.");
        m_bodySended = true;

        if (m_settings && m_settings.submitHandlerEnabled)
            compromisedAccountHandler = OnSubmitWithAutofill;

        m_domParser.GetLoginSelectors(OnInputCallback);
    }

    function GetElements(root, tag, type)
    {
        if (root.querySelectorAll)
            return root.querySelectorAll(tag + "[type='" + type + "']");

        var result = [];
        var childrens = root.getElementsByTagName(tag);
        for (var i = 0; i < childrens.length; i++) 
        {
            if (childrens[i].type.toLowerCase() === type) 
                result.push(childrens[i]);
        }
        return result;
    }

    function IsVisible(element)
    {
        var style = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;
        return style.display !== "none";
    }

    function GetSingleButton()
    {
        var buttons = GetElements(document, "button", "submit"); 
        if (buttons && buttons.length > 0) 
            return buttons;
        buttons = document.getElementsByTagName("button");
        if (buttons && buttons.length === 1) 
            return buttons[0];
        var result = [];
        for (var i = 0; i < buttons.length; i++) 
        {
            if (IsVisible(buttons[i])) 
                result.push(buttons[i]);
        }
        return result.length === 1 ? result[0] : [];
    }

    function OnInputCallback(result, onInputData)
    {
        m_submitCall = false;

        if (result !== 0 || onInputData.length === 0)
        {
            ns.SessionLog("Couldn't get login selectors. Result: " + result + " selectors size: " + onInputData.length);
            m_bodySended = false;
            return;
        }

        compromisedAccountHandler = OnSubmit;
        for (var i = 0; i < onInputData.length; ++i)
        {
            var accountElement = document.querySelector(onInputData[i]);
            if (!accountElement)
            {
                ns.SessionLog("Couldn't find element for selector " + onInputData[i]);
                continue;
            }

            AddInputToList(accountElement);
        }
    }

    function IsInList(element, elementList)
    {
        for (var i = 0; i < elementList.length; ++i)
        {
            if (element === elementList[i])
                return true;
        }
        return false;
    }

    function OnSubmitWithAutofill(arg)
    {
        ns.SessionLog("=> OnSubmit with autofill eventType: " + arg.type);

        if (m_submitCall)
            return;

        m_submitCall = true;

        ns.AddEventListener(window, "beforeunload", function OnUnload()
        {
            if (!m_submitCall)
                return;

            var domWithWfd = m_domParser.GetHtmlWithWfd(m_settings);
            if (!TryOnUnloadCallService("onHtml", { dom: domWithWfd }))
                CallService("onHtml", { dom: domWithWfd });
        });
    }

    function OnSubmit(arg)
    {
        ns.SessionLog("=> OnSubmit eventType: " + arg.type);
        var target = arg.target || arg.srcElement;
        if (arg.type === "keydown")
        {
            if (arg.keyCode !== 13)
                return;

            if (!IsInList(target, m_buttons) && !IsInList(target, m_inputs) && !IsInList(target, m_forms))
                return;
        }
        else if (arg.type === "click")
        {
            if (!IsInList(target, m_buttons))
                return;
        }
        else if (arg.type === "submit")
        {
            if (!IsInList(target, m_forms))
                return;
        }

        var currentTime = ns.GetCurrentTime();
        if (currentTime - 500 < m_lastSendedTime)
        {
            ns.SessionLog("skipping OnSubmit due to timing");
            return; 
        }

        var accounts = [];
        for (var i = 0; i < m_inputs.length; ++i)
        {
            var accountElement = m_inputs[i];
            if (accountElement.value)
                accounts.push(ns.ToBase64(accountElement.value));
        }

        if (accounts.length > 0)
        {
            if (!TryOnUnloadCallService("onAccount", { accounts: accounts }))
                CallService("onAccount", { accounts: accounts });

            m_lastSendedTime = currentTime;
        }
        else
        {
            ns.SessionLog("CA: OnSubmit with no data occure");
        }

        ns.SessionLog("<= OnSubmit");
    }

    function AddButtonsToList(submitButtons)
    {
        for (var i = 0; i < submitButtons.length; ++i)
        {
            var button = submitButtons[i];
            if (!IsInList(button, m_buttons))
                m_buttons.push(button);
        }
    }

    function AddInputToList(accountElement)
    {
        if (IsInList(accountElement, m_inputs))
            return;

        ns.SessionLog("setting Enter Key event handlers for " + accountElement.id);

        m_inputs.push(accountElement);
        if (accountElement.form)
        {
            var parentForm = accountElement.form;
            if (!IsInList(parentForm, m_forms))
            {
                ns.SessionLog("setting form submit event handlers for " + accountElement.id);
                m_forms.push(parentForm);
            }

            ns.SessionLog("setting button click event handlers for " + accountElement.id);
            AddButtonsToList(GetElements(parentForm, "input", "submit"));
            AddButtonsToList(GetElements(parentForm, "button", "button"));
        }
        else
        {
            ns.SessionLog("setting button click event handlers for " + accountElement.id);
            AddButtonsToList(GetSingleButton());
        }
    }

    function OnPing()
    {
        return ns.MaxRequestDelay;
    }

    function OnInitializeCallback(activatePlugin, registerMethod, callFunction, deactivate, onUnloadCall)
    {
        m_callFunction = callFunction;
        m_onUnloadCallFunction = onUnloadCall;
        activatePlugin("ca", OnPing);
        ns.AddEventListener(document, "keydown", OnKeyDown);
    }

    function InitializePlugin()
    {
        session.InitializePlugin(OnInitializeCallback);
    }

    InitializePlugin();
});
(function KpmBalloonMain(ns) 
{
    ns.KpmPromoBalloon = function KpmPromoBalloon(session, locales, callFunction) 
    {
        var m_balloon = (window === window.top) 
            ? new ns.Balloon2("kpm", "/kpm/kpm_promo_balloon.html", "/kpm/tooltip.css", session, GetCoordsCallback, OnCloseHandler, locales, OnDataReceiveHandler) 
            : null;
        var m_balloonWasShowed = false;
        var m_balloonState = 0;
        var m_centerCoord = { x: 0, y: 0 };
        var m_observer = null;
        var m_currentElement = null;
        var m_balloonStyle = "icon";

        var m_frameInfo = { fromFrame: false };

        var m_domParser = ns.GetDomParser(session);

        function GetCoordsCallback(balloonSize)
        {
            return GetCoord(balloonSize);
        }

        function OnCloseHandler(arg)
        {
            if (arg === 1)
                callFunction("kpm.onTooltipClosed");
            if (arg === 2)
                callFunction("kpm.onInstallPluginClicked");
            if (arg === 3)
                callFunction("kpm.onSkipNotificationsClicked");

            ns.RemoveEventListener(document, "focus", OnFocus);
            ns.RemoveEventListener(window, "resize", OnResize);
            if (!m_balloonWasShowed)
            {
                ns.RemoveEventListener(document, "keydown", OnKeyDown);
                ns.RemoveEventListener(document, "change", OnChange);
            }       
            if (window === window.top)
                ns.RemoveEventListener(document, "mouseover", OnMouseOver);


            if (m_observer)
                m_observer.Stop();
            m_balloon.Destroy();
        }

        function OnDataReceiveHandler(data)
        {
            if (data && data.balloonShowed && m_balloon)
            {
                m_balloonState = 1;
                m_balloonStyle = "balloon";
                m_balloon.Update(m_balloonStyle);
                callFunction("kpm.onTooltipShowed");
            }
        }

        function GetCoord(balloonSize)
        {
            var coord = { x: 0, y: 0 };

            if (!m_currentElement && !m_frameInfo.fromFrame)
                return coord;         

            var elementRect = {};
            if (m_frameInfo.fromFrame)
                elementRect = m_frameInfo.coord;
            else
                elementRect = m_currentElement.getBoundingClientRect();

            var clientWidth = ns.GetPageWidth();

            if (m_balloonState === 0)
            {
                if (elementRect.right + balloonSize.width <= clientWidth)
                {
                    coord.x = elementRect.right;
                    coord.y = elementRect.top + ((elementRect.bottom - elementRect.top) / 2) - (balloonSize.height / 2);
                }
                else
                {
                    coord.x = elementRect.left - balloonSize.width;
                    coord.y = elementRect.top + ((elementRect.bottom - elementRect.top) / 2) - (balloonSize.height / 2);
                }
                m_centerCoord.x = coord.x + (balloonSize.width / 2);
                m_centerCoord.y = coord.y + (balloonSize.height / 2);
            }
            else
            {
                coord.x = m_centerCoord.x - (balloonSize.width / 2);
                coord.y = m_centerCoord.y - (balloonSize.height / 2);
            }

            if (coord.x < 0)
                coord.x = 0;
            if (coord.y < 0)
                coord.y = 0;

            if (coord.x + balloonSize.width > clientWidth)
                coord.x = clientWidth - balloonSize.width;

            var scroll = ns.GetPageScroll();
            coord.x += scroll.left;
            coord.y += scroll.top;

            return coord;
        }

        function ShowBalloonImpl()
        {
            if (!m_balloonWasShowed)
            {
                ns.RemoveEventListener(document, "keydown", OnKeyDown);
                ns.RemoveEventListener(document, "change", OnChange);
                m_balloonWasShowed = true;
                if (window === window.top)
                {
                    m_frameInfo.fromFrame = false;
                    m_balloon.Show("icon");
                    callFunction("kpm.onIconShowed");
                }
            }

            if (window === window.top)
            {
                m_frameInfo.fromFrame = false;
                m_balloon.Show(m_balloonStyle);
                m_balloon.UpdatePosition();
            }
            else
            {
                var r = m_currentElement.getBoundingClientRect();
                callFunction("kpm.NeedToShowTooltip", { top: r.top, bottom: r.bottom, right: r.right, left: r.left });
                m_balloonWasShowed = true;
            }
        }

        function ShowBalloonIfNeed(result, selectors, currentElement)
        {
            if (result)
                return;

            if (m_currentElement && m_currentElement.offsetParent)
            {
                ShowBalloonImpl();
                return;
            }

            selectors.forEach(function forEachCallback(selector)
            {
                var element = document.querySelector(selector);
                if (element && element === currentElement)
                {
                    m_currentElement = element;
                    ShowBalloonImpl();
                }
            });
        }

        function OnMouseOver(evt)
        {
            try
            {
                var element = evt.target || evt.srcElement;
                if (element.nodeName.toLowerCase() !== "iframe")
                    return;

                m_frameInfo.frameElement = element;
            }
            catch (e)
            {
                ns.SessionError(e, "kpm");
            }
        }

        this.ShowBalloon = function ShowBalloon(obj)
        {
            if (window !== window.top)
                return;
            m_frameInfo.fromFrame = true;
            m_frameInfo.coord = {};

            var r = m_frameInfo.frameElement.getBoundingClientRect();

            m_frameInfo.coord.top = obj.top + r.top;
            m_frameInfo.coord.bottom = obj.bottom + r.top;
            m_frameInfo.coord.left = obj.left + r.left;
            m_frameInfo.coord.right = obj.right + r.left;

            ShowBalloonImpl();
        };

        function ProcessForField(field)
        {
            var ShowBalloonIfNeedForField = function ShowBalloonIfNeedForField(result, selectors)
            {
                ShowBalloonIfNeed(result, selectors, field);
            };
            m_domParser.GetLoginSelectors(ShowBalloonIfNeedForField);
            m_domParser.GetPasswordSelectors(ShowBalloonIfNeedForField);
            m_domParser.GetNewPasswordSelectors(ShowBalloonIfNeedForField);
        }

        function OnFocus(evt)
        {
            try
            {
                if (!m_balloonWasShowed)
                    return;
                ProcessForField(evt.target);
            }
            catch (e)
            {
                ns.SessionError(e, "kpm");
            }
        }

        function OnResize()
        {
            try
            {
                if (!m_balloonWasShowed || !m_currentElement)
                    return;
                ShowBalloonImpl();
            }
            catch (e)
            {
                ns.SessionError(e, "kpm");
            }
        }

        function OnKeyDown(evt)
        {
            try
            {
                if (m_balloonWasShowed && window === window.top)
                    return;
                if (evt && evt.target && evt.target.tagName && evt.target.tagName.toLowerCase() === "input")
                    ProcessForField(evt.target);
            }
            catch (e)
            {
                ns.SessionError(e, "kpm");
            }
        }

        function OnChange(evt)
        {
            try
            {
                if (evt && evt.target && evt.target.tagName && evt.target.tagName.toLowerCase() === "input" && evt.target.type && evt.target.type.toLowerCase() === "password")
                {
                    if (evt.target.value !== "")
                        ProcessForField(evt.target);
                }
            }
            catch (e)
            {
                ns.SessionError(e, "kpm");
            }
        }

        ns.AddRemovableEventListener(document, "focus", OnFocus);
        ns.AddRemovableEventListener(window, "resize", OnResize);
        if (window === window.top)
            ns.AddRemovableEventListener(document, "mouseover", OnMouseOver);

        ns.AddRemovableEventListener(document, "change", OnChange);
        ns.AddRemovableEventListener(document, "keydown", OnKeyDown);
        function CheckFieldsByCSS(selector, checkFn)
        {
            try
            {
                var fields = document.querySelectorAll(selector);
                for (let field of fields)
                {
                    if (checkFn(field))
                        ProcessForField(field);
                }
            }
            catch (e)
            {
                return false;
            }
            return true;
        }

        function CheckFields()
        {
            if (m_balloonWasShowed && m_currentElement && !m_currentElement.offsetParent && m_balloon)
            {
                m_currentElement = null;
                m_balloon.Hide();
            }
            if (!m_balloonWasShowed)
            {
                if (!CheckFieldsByCSS("input:-webkit-autofill", function checker() { return true; }))
                    CheckFieldsByCSS("input[type='password']", function checker(field) { return field.value !== ""; });
            }
            else
            {
                ProcessForField(document.activeElement);
            }
        }
        CheckFields();

        m_observer = ns.GetDomChangeObserver("input");
        m_observer.Start(CheckFields);
        ns.AddEventListener(window, "unload", function OnUnload()
            {
                if (m_observer)
                    m_observer.Stop();
            });
    };

})(KasperskyLab || {});
KasperskyLab.AddRunner("kpm", function AddRunnerKpm(ns, session, settings, locales)
{
    var KpmPromo = function KpmPromo()
    {
        var m_callFunction = ns.EmptyFunc;
        var m_balloon = null;

        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        session.InitializePlugin(
            function InitializePluginCallback(activatePlugin, registerMethod, callFunction)
            {
                m_callFunction = callFunction;
                activatePlugin("kpm", OnPing);
                registerMethod("kpm.disable", function KpmDisable()
                {
                    if (m_balloon)
                        m_balloon.Disable();
                });
                registerMethod("kpm.showTooltip", function KpmShowTooltip(obj)
                {
                    if (m_balloon && window === window.top)
                        m_balloon.ShowBalloon(obj);
                });
            }
            );

        m_balloon = new ns.KpmPromoBalloon(session, locales, m_callFunction);
    };


    var instance = null;
    ns.RunModule(function RunModuleKpm()
    {
        if (!instance)
            instance = new KpmPromo();
    });
});
(function BallonMain(ns)
{

ns.Balloon2 = function Balloon2(pluginName, balloonSrc, balloonCssPostfix, session, getCoordCallback, onCloseHandler, locales, onDataReceiveHandler)
{
    var m_balloon = document.createElement("iframe");
    var m_balloonId = pluginName + "_b";
    var m_balloonSize = null;
    var m_sizeCache = {};
    var m_initStyleDataPair = {};
    var m_isInitSent = false;
    var m_updateTimeout = null;
    var m_firstCreate = true;

    var m_initData = null;
    var m_cssDataReady = false;
    var m_cssData = "";
    var m_port = null;
    var m_uniqueId = Math.floor((1 + Math.random()) * 0x10000).toString(16);

    function OnConnect(port)
    {
        if (port.name === GetResourceUrl())
        {
            m_port = port;
            m_port.onMessage.addListener(OnFrameDataMessage);
            m_port.onDisconnect.addListener(function onDisconnectDefault() {m_port = null;});
            SendInitOnReady();
        }
    }

    function OnCssLoad(data)
    {
        m_cssData = data;
        m_cssDataReady = true;
        SendInitOnReady();
    }

    function OnCssLoadError()
    {
        m_cssDataReady = true;
    }

    function SendInitOnReady()
    {
        if (m_cssDataReady && m_port)
        {
            m_initData.cssData = m_cssData;
            SendInit(m_initData);
        }
    }

    function InitializeBalloon()
    {
        m_balloon.scrolling = "no";
        m_balloon.frameBorder = "0";
        m_balloon.style.border = "0";
        m_balloon.style.height = "1px";
        m_balloon.style.width = "1px";
        m_balloon.style.left = "1px";
        m_balloon.style.top = "1px";
        m_balloon.allowTransparency = "true"; 
        m_balloon.style.zIndex = "2147483647";
        m_balloon.style.position = "absolute";
        document.body.appendChild(m_balloon);
        HideBalloon();
    }

    function OnPing()
    {
        return IsDisplayed() ? 100 : ns.MaxRequestDelay;
    }

    function SendToFrame(args)
    {
        var isFrameExist = document.body.contains(m_balloon);
        if (m_port && isFrameExist)
            m_port.postMessage(args);
    }

    function OnSizeMessage(sizeMessage)
    {
        var size = {
            height: sizeMessage.height,
            width: sizeMessage.width
        };
        if (size.height !== 0 && size.width !== 0)
            PutSizeInCache(sizeMessage.style, size);
        SetupBalloon(size);
    }

    function OnCloseMessage(closeData)
    {
        HideBalloon();
        if (onCloseHandler && closeData.closeAction)
            onCloseHandler(closeData.closeAction);
    }

    function OnDataMessage(data)
    {
        if (onDataReceiveHandler)
            onDataReceiveHandler(data);
    }

    function GetResourceUrl()
    {
        return snapshot_resources.GetUrl(balloonSrc) + "?id=" + m_uniqueId;
    }

    function CreateBalloon(style, data, size)
    {
        if (m_firstCreate)
        {
            InitializeBalloon();
            m_firstCreate = false;
        }
        DisplayBalloon();

        if (m_balloon.src)
        {
            UpdateBalloon(style, data);
            return;
        }

        m_initStyleDataPair = { style: style, data: data };

        m_balloon.src = GetResourceUrl();

        var balloonSize = size ? size : GetSizeFromCache(style);
        var dataToFrame = {
            command: "init",
            pluginName: m_balloonId,
            isRtl: ns.IsRtl,
            needSize: !balloonSize,
            style: style
        };
        if (data)
            dataToFrame.data = data;
        if (size)
            dataToFrame.explicitSize = size;
        if (locales)
            dataToFrame.locales = locales;
        m_initData = dataToFrame;
        if (balloonSize)
        {
            clearTimeout(m_updateTimeout);
            m_updateTimeout = ns.SetTimeout(function UpdateTimerCallback() { SetupBalloon(balloonSize); }, 0);
        }
    }

    function SendInit(dataToFrame)
    {
        dataToFrame.style = m_initStyleDataPair.style;
        dataToFrame.data = m_initStyleDataPair.data;
        m_isInitSent = true;
        SendToFrame(dataToFrame);
        session.ForceReceive();
    }

    function DisplayBalloon()
    {
        m_balloon.style.display = "";
        session.ForceReceive();
    }

    function IsDisplayed()
    {
        return !m_firstCreate && m_balloon.style.display === "";
    }

    function HideBalloon()
    {
        m_balloon.style.display = "none";
    }

    function DestroyBalloon()
    {
        m_balloon.blur(); 
        document.body.removeChild(m_balloon);
        m_firstCreate = true;
        m_balloonSize = null;
    }

    function PositionBalloon()
    {
        if (!m_balloonSize)
            return;

        var coords = getCoordCallback(m_balloonSize);

        var newHeight = m_balloonSize.height + "px";
        var newWidth = m_balloonSize.width + "px";
        if (newHeight !== m_balloon.style.height 
            || newWidth !== m_balloon.style.width)
        {
            m_balloon.style.height = newHeight;
            m_balloon.style.width = newWidth;
            ns.SessionLog("Change balloon size " + m_balloonId + " height: " + newHeight + " width: " + newWidth);
        }

        var newX = Math.round(coords.x).toString() + "px";
        var newY = Math.round(coords.y).toString() + "px";
        if (newX !== m_balloon.style.left 
            || newY !== m_balloon.style.top)
        {
            m_balloon.style.left = newX;
            m_balloon.style.top = newY;
            ns.SessionLog("Change balloon position " + m_balloonId + " x: " + newX + " y: " + newY);
        }
    }

    function SetupBalloon(balloonSize)
    {
        m_balloonSize = balloonSize;
        PositionBalloon();
    }

    function UpdateBalloon(style, data)
    {
        if (!m_isInitSent)
            m_initStyleDataPair = { style: style, data: data };

        var sizeFromCache = GetSizeFromCache(style);
        clearTimeout(m_updateTimeout);
        if (sizeFromCache)
        {
            m_updateTimeout = ns.SetTimeout(function UpdateTimerCallback() { SetupBalloon(sizeFromCache); }, 0);
        }
        else
        {
            m_balloon.style.height = "1px";
            m_balloon.style.width = "1px";
            m_balloonSize = { height: 1, width: 1 };
        }

        var dataToFrame = {
            command: "update",
            style: style,
            data: data,
            needSize: !sizeFromCache
        };
        SendToFrame(dataToFrame);
    }

    function GetSizeFromCache(style)
    {
        return m_sizeCache[style ? style.toString() : ""];
    }

    function PutSizeInCache(style, size)
    {
        m_sizeCache[style ? style.toString() : ""] = size;
    }

    this.Show = function Show(style, data)
    {
        CreateBalloon(style, data);
    };
    this.ShowWithSize = function ShowWithSize(style, data, size)
    {
        CreateBalloon(style, data, size);
    };

    this.Resize = function Resize(size)
    {
        SetupBalloon(size);
    };

    this.Hide = function Hide()
    {
        HideBalloon();
    };

    this.Update = function Update(style, data)
    {
        UpdateBalloon(style, data);
    };

    this.UpdatePosition = function UpdatePosition()
    {
        PositionBalloon();
    };

    this.LightUpdatePosition = function LightUpdatePosition(x, y)
    {
        var newX = Math.round(x).toString() + "px";
        var newY = Math.round(y).toString() + "px";
        if (newX !== m_balloon.style.left 
            || newY !== m_balloon.style.top)
        {
            m_balloon.style.left = newX;
            m_balloon.style.top = newY;
        }
        var dataToFrame = {
            command: "update",
            data: {}
        };
        SendToFrame(dataToFrame);
    };

    this.Destroy = function Destroy()
    {
        DestroyBalloon();
    };

    this.IsFocused = function IsFocused()
    {
        if (!m_balloon)
            return false;
        return document.activeElement === m_balloon;
    };

    function OnFrameDataMessage(argument)
    {
        var message = argument;
        if (message.type === "size")
            OnSizeMessage(message.data);
        else if (message.type === "close")
            OnCloseMessage(message.data);
        else if (message.type === "data")
            OnDataMessage(message.data);
        else if (message.type === "trace")
            ns.SessionLog(message.data);
        else
            ns.SessionError({ message: "Unknown message type", details: "type: " + message.type }, "balloon");
    }

    function Init()
    {
        session.InitializePlugin(function InitializePluginBalloon(activatePlugin, registerMethod)
            {
                activatePlugin(m_balloonId, OnPing);
            });
        browsersApi.runtime.onConnect.addListener(OnConnect);
        if (balloonCssPostfix)
            session.GetResource(balloonCssPostfix, OnCssLoad, OnCssLoadError);
    }

    Init();
};
return ns;

})(KasperskyLab);
(function DomParserMain(ns)
{

function DomParser(session)
{
    var m_callFunction = ns.EmptyFunc;
    var m_logins = [];
    var m_passwords = [];
    var m_newPasswords = [];
    var m_address = [];
    var m_card = [];
    var m_cachedFlag = false;
    var m_pathName = document.location.pathname;

    var m_selectorsRequested = false;
    var m_callbacksQueue = [];

    function OnGetFieldsCallback(result, selectors)
    {
        if (result === 0 && selectors)
        {
            if (selectors.loginSelectors)
                Array.prototype.push.apply(m_logins, selectors.loginSelectors);
            if (selectors.passwordSelectors)
                Array.prototype.push.apply(m_passwords, selectors.passwordSelectors);
            if (selectors.newPasswordSelectors)
                Array.prototype.push.apply(m_newPasswords, selectors.newPasswordSelectors);
            if (selectors.addressSelectors)
                Array.prototype.push.apply(m_address, selectors.addressSelectors);
            if (selectors.cardSelectors)
                Array.prototype.push.apply(m_card, selectors.cardSelectors);
            m_cachedFlag = true;
        }
        m_selectorsRequested = false;

        for (var i = 0; i < m_callbacksQueue.length; ++i)
            m_callbacksQueue[i](result);
    }
    function CleanupElements()
    {
        if (!document.querySelectorAll)
            return;
        var elements = document.querySelectorAll("[wfd-id],[wfd-value],[wfd-invisible]");
        for (var i = 0; i < elements.length; ++i)
        {
            var element = elements[i];
            if (element.hasAttribute("wfd-id"))
                element.removeAttribute("wfd-id");

            if (element.hasAttribute("wfd-value"))
                element.removeAttribute("wfd-value");

            if (element.hasAttribute("wfd-invisible"))
                element.removeAttribute("wfd-invisible");
        }
    }

    function CallService(argObject)
    {
        m_callFunction("dp.onGetFields", argObject, OnGetFieldsCallback);
        CleanupElements();
    }

    function IsVisible(element)
    {
        var style = window.getComputedStyle ? window.getComputedStyle(element) : element.currentStyle;
        return style.display !== "none";
    }

    function ProcessChilds(childNodes)
    {
        for (var i = 0; i < childNodes.length; ++i)
        {
            var element = childNodes[i];
            if (element.nodeType !== Node.ELEMENT_NODE)
                continue;

            if (!IsVisible(element))
                element.setAttribute("wfd-invisible", true);
            else
                ProcessChilds(element.childNodes);
        }
    }

    function ProcessNextGroupElement(tree, finishCallback)
    {
        var counter = 0;
        while (tree.nextNode())
        {
            ++counter;
            tree.currentNode.setAttribute("wfd-invisible", true);
            if (counter === 100)
            {
                ns.SetTimeout(function TimerCallback() { ProcessNextGroupElement(tree, finishCallback); }, 0);
                return;
            }
        }
        finishCallback();
    }

    function GetSelectorsWithTreeWalker()
    {
        if (!document.body)
        {
            ns.AddEventListener(window, "load", GetSelectorsWithTreeWalker);
            return;
        }
        var filter = {
            acceptNode: function acceptNode(node)
            {
                if (node && node.parentNode && node.parentNode.getAttribute("wfd-invisible") === true)
                    return NodeFilter.FILTER_REJECT;
                if (node && !IsVisible(node))
                    return NodeFilter.FILTER_ACCEPT;
                return NodeFilter.FILTER_SKIP;
            }
        };
        var tree = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, filter.acceptNode, false);
        function finishCallback()
        {
            CallService({ dom: "<body>" + document.body.innerHTML + "</body>" });
        }
        ProcessNextGroupElement(tree, finishCallback);
    }

    function GetSelectorsFromService()
    {
        try
        {
            ProcessChilds(document.body.childNodes);
        }
        catch (e)
        {
            ns.SessionLog(e);
        }
        CallService({ dom: document.documentElement.innerHTML });
    }

    function GetSelectorsInternal(callback, selectors)
    {
        if (m_cachedFlag)
        {
            if (selectors.length > 0)
                callback(0, selectors);
            return;
        }

        function clientCallback(result) { callback(result, selectors); }
        m_callbacksQueue.push(clientCallback);
        if (!m_selectorsRequested)
        {
            m_selectorsRequested = true;
            if (document.createTreeWalker)
                GetSelectorsWithTreeWalker();
            else
                GetSelectorsFromService();
        }
    }

    function AddWfdAttribute(input, settings)
    {
        try
        {
            if (!input || !input.value)
                return;
            if (settings && settings.avoidTypes && input.type && settings.avoidTypes.includes(input.type))
                return;
            if (input.type === "password")
                return;

            input.setAttribute("wfd-value", ns.ToBase64(input.value));
        }
        catch (e)
        {
            ns.SessionLog(e);
        }
    }

    this.GetLoginSelectors = function GetLoginSelectors(clientCallback)
    {
        GetSelectorsInternal(clientCallback, m_logins);
    };

    this.GetPasswordSelectors = function GetPasswordSelectors(clientCallback)
    {
        GetSelectorsInternal(clientCallback, m_passwords);
    };

    this.GetNewPasswordSelectors = function GetNewPasswordSelectors(clientCallback)
    {
        GetSelectorsInternal(clientCallback, m_newPasswords);
    };

    this.GetAddressSelectors = function GetAddressSelectors(clientCallback)
    {
        GetSelectorsInternal(clientCallback, m_address);
    };

    this.GetCardSelectors = function GetCardSelectors(clientCallback)
    {
        GetSelectorsInternal(clientCallback, m_card);
    };

    this.GetHtmlWithWfd = function GetHtmlWithWfd(settings)
    {
        var inputs = document.getElementsByTagName("input");
        if (inputs)
        {
            for (var i = 0; i < inputs.length; i++)
                AddWfdAttribute(inputs[i], settings);
        }

        if (settings && settings.wfdIdSelector)
        {
            var elements = document.querySelectorAll(settings.wfdIdSelector);
            if (elements)
            {
                var count = 1;
                for (var j = 0; j < elements.length; j++)
                {
                    elements[j].setAttribute("wfd-id", count);
                    count++;
                }
            }
        }

        return document.documentElement.innerHTML;
    };

    function OnPing()
    {
        return ns.MaxRequestDelay;
    }

    function OnInitializeCallback(activatePlugin, registerMethod, callFunction)
    {
        m_callFunction = callFunction;
        activatePlugin("dp", OnPing);
    }

    function ResetCacheFlag()
    {
        m_cachedFlag = false;
    }

    function UpdateLocationPathName()
    {
        if (m_pathName !== document.location.pathname) 
        {
            m_pathName = document.location.pathname;
            ResetCacheFlag();
        }
    }

    function OnMessage(request)
    {
        try
        {
            if (request.command && request.command === "HistoryStateUpdate")
                ResetCacheFlag();
        }
        catch (e)
        {
            ns.SessionError(e, "dp");
        }
    }

    function InitializePlugin()
    {
        session.InitializePlugin(OnInitializeCallback);
        ns.AddEventListener(window, "popstate", ResetCacheFlag);
        ns.AddEventListener(document, "load", UpdateLocationPathName);
        browsersApi.runtime.onMessage.addListener(OnMessage);
    }
    InitializePlugin();
}

var gDomParser = null;

ns.GetDomParser = function GetDomParser(session)
{
    if (!gDomParser)
        gDomParser = new DomParser(session);

    return gDomParser;
};

return ns;

})(KasperskyLab);
KasperskyLab.AddRunner("wp", function(ns, session)
{
var Webpage = function()
{
    var m_callFunction = ns.EmptyFunc;

    function OnPing()
    {
        return ns.MaxRequestDelay;
    }

    function isFrameRedirected(callback)
    {
        browsersApi.runtime.sendMessage({command: "isFrameRedirected"},
            function(response)
            {
                callback(response.isRedirected);
            }
        );
    }

    function Process()
    {
        m_callFunction("wp.content", { dom: document.documentElement.innerHTML });
    }

    function DelayProcess()
    {
        if (document.readyState == "complete")
            Process();
        else
            ns.SetTimeout(Process, 1000 );
    }

    session.InitializePlugin(
        function(activatePlugin, registerMethod, callFunction)
        {
            m_callFunction = callFunction;
            activatePlugin("wp", OnPing);
            registerMethod("wp.getFrameContent", Process);
        });

    if (window !== window.top)
    {
        isFrameRedirected(function(isRedirected)
        {
            if (isRedirected)
                m_callFunction("wp.createProcessors", null, DelayProcess);
        });
    }
    else
    {
        DelayProcess();
    }
}


var instance = null;
ns.RunModule(function()
{
    if (!instance)
        instance = new Webpage();
});
});
KasperskyLab.AddRunner("vs", function AddRunnerVs(ns, session)
{
    var VisitedSites = function VisitedSites()
    {
        var m_callFunction = ns.EmptyFunc;
        var m_domParser = ns.GetDomParser(session);
        var m_subscribedElements = [];

        var m_flags = {
            onPasswordEntered: false,
            onAddressEntered: false,
            onCardEntered: false
        };

        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        function Initialize()
        {
            session.InitializePlugin(function InitializePluginVs(activatePlugin, registerMethod, callFunction)
                {
                    m_callFunction = callFunction;
                    activatePlugin("vs", OnPing);
                    ns.AddRemovableEventListener(document, "keydown", OnKeyDown);
                    ns.AddRemovableEventListener(document, "change", OnKeyDown);
                });
        }
        function IsElementSubscribed(element)
        {
            for (var i = 0; i < m_subscribedElements.length; ++i)
            {
                if (m_subscribedElements[i] === element)
                    return true;
            }
            return false;
        }

        function MakeCallFunctionCallback(flag)
        {
            return function callback()
            {
                m_flags[flag] = true;

                if (m_flags.onPasswordEntered && m_flags.onAddressEntered && m_flags.onCardEntered)
                {
                    ns.RemoveEventListener(document, "keydown", OnKeyDown);
                    ns.RemoveEventListener(document, "change", OnKeyDown);
                }

                m_callFunction("vs." + flag);
            };
        }

        function MakeCallback(flag, target)
        {
            if (m_flags[flag] || !target)
                return ns.EmptyFunc;

            var flagCallFunction = MakeCallFunctionCallback(flag);

            return function Callback(result, selectors)
            {
                if (result || m_flags[flag])
                    return;

                for (var i = 0; i < selectors.length; i++)
                {
                    if (m_flags[flag])
                        return;

                    var element = document.querySelector(selectors[i]);
                    if (window.MutationObserver && element && element.tagName && element.tagName.toLowerCase() !== "input" && !IsElementSubscribed(element))
                    {
                        var mutationObserver = new MutationObserver(flagCallFunction);
                        mutationObserver.observe(element, { childList: true, characterData: true, subtree: true });
                        m_subscribedElements.push(element);
                    }

                    if (element && element === target)
                        flagCallFunction();
                }
            };
        }

        function OnKeyDown(evt)
        {
            try 
            {
                if (!evt || !evt.target || !evt.target.tagName || evt.target.tagName.toLowerCase() !== "input")
                    return;

                m_domParser.GetPasswordSelectors(MakeCallback("onPasswordEntered", evt.target));
                m_domParser.GetNewPasswordSelectors(MakeCallback("onPasswordEntered", evt.target));
                m_domParser.GetAddressSelectors(MakeCallback("onAddressEntered", evt.target));
                m_domParser.GetCardSelectors(MakeCallback("onCardEntered", evt.target));
            }
            catch (e)
            {
                ns.SessionError(e, "vs");
            }
        }

        Initialize();
    };


    var instance = null;
    ns.RunModule(function RunModuleVisitedSites()
    {
        if (!instance)
            instance = new VisitedSites();
    });
});
(function(ns) 
{

ns.waitForApiInjection = function(isApiInjected, eventName, callback)
{
    if (isApiInjected())
    {
        callback();
        return;
    }

    var subscription = createSubscription(eventName, onApiInjected)

    function onApiInjected()
    {
        if (isApiInjected())
        {
            subscription.unsubscribe();
            callback();
        }
    }
}

function createSubscription(eventName, callback)
{
    var windowEventsSupported = document.createEvent || window.addEventListener;
    return new (windowEventsSupported ? ModernSubscription : IeLegacySubscription)(eventName, callback);
}

function ModernSubscription(eventName, callback)
{
    ns.AddRemovableEventListener(window, eventName, callback);

    this.unsubscribe = function()
    {
        ns.RemoveEventListener(window, eventName, callback);
    }
}

function IeLegacySubscription(eventName, callback)
{
    ns.AddRemovableEventListener(document.documentElement, 'propertychange', onPropertyChange);

    this.unsubscribe = function()
    {
        ns.RemoveEventListener(document.documentElement, 'propertychange', onPropertyChange);
    }

    function onPropertyChange(event)
    {
        if (event.propertyName === eventName)
            callback();
    }
}

})(KasperskyLab || {});
var tabIdPropertyName = KasperskyLab.LIGHT_PLUGIN_API_KEY || '%LIGHT_PLUGIN_API_KEY%';
var scriptPluginId = Math.floor((1 + Math.random()) * 0x10000).toString(16);

function isApiInjected()
{
    return !!window[tabIdPropertyName];
}

function removeTabIdProperty()
{
    try {
        delete window[tabIdPropertyName];
    } catch (e) {
        window[tabIdPropertyName] = undefined;
    }
}

var documentInitParameters = {tabId: String(window[tabIdPropertyName]), scriptPluginId: scriptPluginId};
var docOptions = {name: "light_doc",
    runner: function(ns, session)
    {
        session.InitializePlugin(function(activatePlugin)
        {
            activatePlugin("light_doc");
            removeTabIdProperty();
        });
    },
    getParameters: function() {return {tabId: String(window[tabIdPropertyName]), scriptPluginId: scriptPluginId}}
};
KasperskyLab.AddRunner2(docOptions);

KasperskyLab.waitForApiInjection(isApiInjected, tabIdPropertyName, function()
{
    KasperskyLab.StartSession();
});

function GetSize()
{
    try
    {
        return {
            width: window.innerWidth || window.document.documentElement.clientWidth || window.document.body.clientWidth,
            height: window.innerHeight || window.document.documentElement.clientHeight || window.document.body.clientHeight
        };
    }
    catch (e)
    {
        return { width: 0, height: 0 };
    }
}

function GetFrameInfo()
{
    return GetSize();
}

KasperskyLab.AddRunner("fi", KasperskyLab.EmptyFunc, GetFrameInfo());

