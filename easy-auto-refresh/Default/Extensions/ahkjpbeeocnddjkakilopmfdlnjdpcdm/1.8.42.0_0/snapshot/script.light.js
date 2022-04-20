var KasperskyLab = (function(ns) {
    ns.PREFIX = "http://gc.kis.v2.scr.kaspersky-labs.com/";
    ns.IsWebExtension = function(){ return true; };
    return ns;
})( KasperskyLab || {});
var KasperskyLab = (function(ns) {
    ns.PLUGINS_LIST = "light_ext";
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
var PLUGIN_ID = 'light_ext';

var productConnection = {
    _connectedSession: null,

    onSessionConnected: function(session, productServices)
    {
        if (this._connectedSession === session)
            return;

        if (this._connectedSession)
            this._reset();

        window.product = productServices;
        this._connectedSession = session;
        try
        {
            plugin.onConnect({} );
        }
        catch(e)
        {
            productServices.tracer.log(e, "light_ext");
            this._cleanup();
            throw e;
        }
    },

    onSessionDisconnected: function(session)
    {
        if (this._connectedSession === session)
        {
            productServices.tracer.log("light_ext: session disconnected");
            this._reset();
        }
    },

    _reset: function()
    {
        try
        {
            plugin.onDisconnect();
        }
        finally
        {
            this._cleanup();
        }
    },

    _cleanup: function()
    {
        window.product = null;
        this._connectedSession = null;
    }
};

KasperskyLab.AddRunner("light_ext", function(ns, session)
{
ns.SessionLog("Start light_ext");

var tabIdPropertyName = ns.LIGHT_PLUGIN_API_KEY || '%LIGHT_PLUGIN_API_KEY%';

ns.waitForApiInjection(isApiInjected, tabIdPropertyName, function()
{
    session.InitializePlugin(onPluginInitialized);
});

function onPluginInitialized(activatePlugin, registerMethod, callFunction)
{
    activatePlugin(PLUGIN_ID, onPing, onError);
    registerMethod(PLUGIN_ID + '.setDefaultButtonState', setDefaultButtonState);
    registerMethod(PLUGIN_ID + '.setButtonStateForTab', setButtonStateForTab);
    registerMethod(PLUGIN_ID + '.openNewTab', openNewTab);
    registerMethod(PLUGIN_ID + '.reload', reload);

    callFunction("light_ext.connect", [], onSessionConnected, onError);
}

function isApiInjected()
{
    return !!window.plugin;
}

function onSessionConnected(result, args)
{
    try
    {
        ns.SessionLog("Start light_ext session connection");
        if (result !== 0)
            throw new Error('Connect returned result=' + result);

        var productServices = {
            tracer: {
                log: function(message) { ns.SessionLog(message) }
            }
        };

        productConnection.onSessionConnected(session, productServices);
        ns.SessionLog("Finish light_ext session connection");
    }
    catch (e)
    {
        ns.SessionLog(e, "light_ext");
        onError(e);
    }
}

function onPing()
{
    return ns.MaxRequestDelay;
}

function onError()
{
    productConnection.onSessionDisconnected(session);
}

function setDefaultButtonState(args)
{
    plugin.toolbarButton.setDefaultState(args);
}

function setButtonStateForTab(args)
{
    plugin.toolbarButton.setStateForTab(args.tabId, args.buttonState ? args.buttonState : ns.JSONParse(args.state)); 
}

function openNewTab(args)
{
    plugin.openNewTab.call(plugin, args.url);
}

function reload(args)
{
    plugin.reloadTab.call(plugin, args.tabId);
}

});
KasperskyLab.AddRunner("erb", function(ns, session, settings)
{
    var m_callFunction = function(){};
    var m_interestingDomain = "http://touch.kaspersky.com";

    function Initialize()
    {
        session.InitializePlugin(
            function(activatePlugin, registerMethod, callFunction)
            {
                m_callFunction = callFunction;
            });
        browsersApi.tabs.onCreated.addListener(OnCreatedTab);
        browsersApi.tabs.onUpdated.addListener(OnUpdatedTab);
        browsersApi.tabs.query({url: m_interestingDomain + "/*"}, ProcessExistTabs)
        browsersApi.runtime.onMessage.addListener(OnMessage);
    }

    function GetRemoverHtmlBase()
    {
        return browsersApi.runtime.getURL("additional/extension_remover.html?id=");
    }

    function OnMessage(request, sender, sendResponse)
    {
        if (sender.url.indexOf(GetRemoverHtmlBase()) !== 0)
        {
            return; 
        }

        if (sender.id !== browsersApi.runtime.id)
        {
            ns.SessionError({message: "Security error. Unexpected sender.", details: "sender.id: " + sender.id + "\r\nsender.url: " + sender.url + "\r\nruntime.id: " + browsersApi.runtime.id}, "erb");
            return;
        }

        if ("getPluginInfo" === request.command)
        {
            HandleGetPluginInfo(request, sender, sendResponse);
            return true;
        }
        else if ("deletePlugin" === request.command)
        {
            HandleDeletePlugin(request, sender, sendResponse);
            return true;
        }
        else if ("closeTab" === request.command)
        {
            browsersApi.tabs.query({url: sender.url}, CloseTabs);
        }
    }

    function CloseTabs(tabs)
    {
        if (browsersApi.runtime.lastError)
            ns.SessionLog(browsersApi.runtime.lastError.message);
        if (!tabs || !tabs.length)
            return;

        for (var i = 0; i < tabs.length; ++i)
            browsersApi.tabs.remove(tabs[i].id);
    }

    function OnCreatedTab(tab)
    {
        ProcessTab(tab);
    }

    function OnUpdatedTab(tabId, changeInfo, tab)
    {
        if (changeInfo.url)
            ProcessTab(tab);
    }

    function ProcessExistTabs(tabs)
    {
        if (browsersApi.runtime.lastError)
            ns.SessionLog(browsersApi.runtime.lastError.message);
        if (!tabs || !tabs.length)
            return;

        for (var i = 0; i < tabs.length; ++i)
            ProcessTab(tabs[i]);
    }

    function ProcessRedirectResponse(tab, res, args)
    {
        if (res === 0)
            browsersApi.tabs.update(tab.tabId, { url: GetRemoverHtmlBase() + args.id });
    }

    function RequestRedirectTarget(tab)
    {
        m_callFunction("erb.requestRedirect", { url: tab.url }, function(res, args){ProcessRedirectResponse(tab, res, args);});
    }

    function ProcessTab(tab)
    {
        try
        {
            if (!tab.url)
                return;

            if (tab.url.indexOf(m_interestingDomain) === 0)
            {
                RequestRedirectTarget(tab);
                ns.SessionLog("Found internal url: " + tab.url);
            }
        }
        catch (e)
        {
            ns.SessionLog(e);
        }
    }

    function TrySendResponse(sendResponse, responseObject)
    {
        try {
            sendResponse(responseObject);
        } catch (e) {
            console.debug("Response was not sent, sender page was closed or redirected: ", e);
        }
    }

    function HandleGetPluginInfo(request, sender, sendResponse)
    {
        try
        {
            browsersApi.management.get(request.id, function(info)
                {
                    if (browsersApi.runtime.lastError || !info)
                    {
                        TrySendResponse(sendResponse, {errorText: browsersApi.runtime.lastError ? browsersApi.runtime.lastError.message : ""});
                    }
                    else
                    {
                        if (info.icons && info.icons.forEach)
                        {
                            info.icons.forEach(function(elem, idx, mass)
                            {
                                var img = document.createElement("img");
                                    img.src = elem.url;
                                    img.onload = function() 
                                {
                                    var key = encodeURIComponent(elem.url);
                                    var canvas = document.createElement("canvas");

                                        canvas.width = img.width;
                                        canvas.height = img.height;
                                        var ctx = canvas.getContext("2d");
                                        ctx.drawImage(img, 0, 0);
                                        mass[idx].base64 = canvas.toDataURL("image/png");
                                    var ready = true;
                                    mass.forEach(function(elem){if (!elem.base64) ready = false;})
                                    if (ready)
                                        TrySendResponse(sendResponse, info);
                                }
                            });
                        }
                        else
                        {
                            TrySendResponse(sendResponse, info);
                        }
                    }
                });
        }
        catch(e)
        {
            TrySendResponse(sendResponse, {errorText: e.message});
        }
    }

    function HandleDeletePlugin(request, sender, sendResponse)
    {
        try
        {
            browsersApi.management.uninstall(request.id, function()
            {
                if (browsersApi.runtime.lastError)
                    TrySendResponse(sendResponse, {result: "eFail", errorText: browsersApi.runtime.lastError.message});
                else
                    TrySendResponse(sendResponse, {result: "sOk"});
            });
        }
        catch(e)
        {
            TrySendResponse(sendResponse, {result: "eUnexpected", errorText: e.message});
        }
    }

    Initialize();
});

var m_spMode = false;
var m_requestErrorCallback = function() {};

function CheckSsl()
{
    try
    {
        var testPath = KasperskyLab.GetBaseUrl() + "/EA197A76-0239-4421-A1EB-1042723EEF3A";
        testPath = testPath.replace("http://", "https://");
        var testRequest = new XMLHttpRequest;
        testRequest.open("GET", testPath, true);
        testRequest.send();
        testRequest.onerror = function()
            {
                m_spMode = true;
                m_requestErrorCallback();
            };
    }
    catch (e)
    {
    }
}

CheckSsl();

KasperskyLab.AddRunner("ee", function(ns, session, settings)
{
var m_callFunction;
var m_redirectIdList = {};
var m_redirectUrlList = {};

const DomainFilteringModeSkipAll = 0; 
const DomainFilteringModeProcessAll = 1;

var m_isDomainFilteringSupported = (settings && "undefined" !== typeof(settings.queueLimit)) ? true : false;
var m_operationMode = settings.mode;
var m_queueLimit = settings.queueLimit;
var m_cacheLimit = settings.domainsCacheLimit;
var m_requestsCacheLimit = settings.requestsCacheLimit;

var m_isControledByProduct = (settings && "undefined" !== typeof(settings.isInterceptionEnabled)) ? true : false;
var m_isInterceptionEnabled = (m_isControledByProduct && settings.isInterceptionEnabled) ? true : false;
var m_isTabRedirectByBlockedResourceDisabled = (settings && "undefined" !== typeof (settings.isTabRedirectByBlockedResourceDisabled) && settings.isTabRedirectByBlockedResourceDisabled) ? true : false;

var m_domainsQueue = [];
var m_domains = new Set();
var m_pendingRequests = new Map();

function onPing()
{
    return ns.MaxRequestDelay;
}

function onError() {}

function AddOrUpdate(cache, key, redirectUrl, whiteUrl)
{
    var redirectInfo = { redirectUrl: redirectUrl };
    if (whiteUrl)
        redirectInfo.whiteUrl = whiteUrl;
    var oldInfo = cache[key];
    if (oldInfo && oldInfo.cleanupTimer)
        clearTimeout(oldInfo.cleanupTimer);

    cache[key] = redirectInfo;
    redirectInfo["cleanupTimer"] = ns.SetTimeout(function() { delete cache[key]; }, 1000 * 60 * 60);
}

function GetRedirectInfo(requestId, requestUrl)
{
    var redirectInfo = m_redirectIdList[requestId];

    if (redirectInfo)
        AddOrUpdate(m_redirectIdList, requestId, redirectInfo.redirectUrl);
    else if (redirectInfo = m_redirectUrlList[requestUrl])
        AddOrUpdate(m_redirectUrlList, requestUrl, redirectInfo.redirectUrl, redirectInfo.whiteUrl);
    else
        return null;

    return redirectInfo;
}

function GetBlockingResponseObject(requestId, requestUrl, type, canBeCanceled)
{
    var blockingResponseObject = {};
    var redirectInfo = GetRedirectInfo(requestId, requestUrl);
    if (!redirectInfo)
        return blockingResponseObject;

    if (type !== "main_frame")
    {
        if (canBeCanceled)
            blockingResponseObject.cancel = true;
    }
    else
    {
        blockingResponseObject.redirectUrl = redirectInfo.redirectUrl;
        callToService("redirectHandled", {redirected: true, requestId: requestId});
    }
    return blockingResponseObject;
}

function ProcessRedirectObject(details)
{
    var redirectInfo = GetRedirectInfo(details.requestId, details.url);
    if (!redirectInfo)
        return;

    var redirectCallback = function()
    {
        var redirected = !browsersApi.runtime.lastError;
        callToService("redirectHandled", { redirected: redirected, requestId: details.requestId });
    }

    if (details.type !== "main_frame")
    {
        if (m_isTabRedirectByBlockedResourceDisabled)
            callToService("redirectHandled", { redirected: false, requestId: details.requestId });
        else
            browsersApi.tabs.reload(details.tabId, {bypassCache: true}, redirectCallback);
    }
    else
    {
        browsersApi.tabs.update(details.tabId, { url: redirectInfo.redirectUrl }, redirectCallback);
    }
}

function onBeforeNavigate(details)
{
    var keys = Object.keys(m_redirectUrlList);
    keys.forEach(key => 
    {
        var item = m_redirectUrlList[key];
        if (!item.whiteUrl || item.whiteUrl !== details.url)
            return;

        if (item.cleanupTimer)
            clearTimeout(item.cleanupTimer);        

        delete m_redirectUrlList[key];
    });
}

function onBeforeRequestHandler(details)
{
    let eventInfo = {
        requestId: details.requestId,
        url: details.url,
        method: details.method,
        resourceType: details.type,
        tabId: details.tabId,
        frameId: details.frameId};

    ProcessEvent(details, "beforeRequest", eventInfo);
    return GetBlockingResponseObject(details.requestId, details.url, details.type, true);
}

function onBeforeSendHeaders(details)
{
    let eventInfo = {
        requestId: details.requestId,
        url: details.url,
        method: details.method,
        resourceType: details.type,
        tabId: details.tabId,
        frameId: details.frameId,
        requestHeaders: details.requestHeaders || []};
    if (!eventInfo.requestHeaders.find(header => header.name === "referer") && details.initiator)
        eventInfo.requestHeaders.push({name: "referer", value: details.initiator});

    ProcessEvent(details, "sendHeaders", eventInfo);
    return GetBlockingResponseObject(details.requestId, details.url, details.type, true);
}

function onHeadersReceived(details)
{
    let eventInfo = {
        requestId: details.requestId,
        statusLine: details.statusLine,
        statusCode: details.statusCode,
        responseHeaders: details.responseHeaders};

    ProcessEvent(details, "headersReceived", eventInfo);
    return GetBlockingResponseObject(details.requestId, details.url, details.type, true);       
}

function onAuthRequiredOptions(details)
{
    return GetBlockingResponseObject(details.requestId, details.url, details.type);
}

function SendNotificationByIndex(list, index)
{
    while (list[index].notifications.length)
    {
        let notification = list[index].notifications.shift();
        callToService(notification.methodName, notification.methodParam);
    }
    list.splice(index, 1);
}

function ProcessRequestComplete(details)
{
    if (m_spMode || !m_isDomainFilteringSupported || m_operationMode == DomainFilteringModeProcessAll)
        return true;
    let domain = new URL(details.url).hostname.toLowerCase();
    if (m_domains.has(domain))
        return true;

    let domainRequestsSlot = m_pendingRequests.get(domain);
    if (domainRequestsSlot)
    {
        let index = domainRequestsSlot.findIndex((element)=>{return element.requestId === details.requestId;})
        if (index != -1)
            domainRequestsSlot.splice(index, 1);
        if (domainRequestsSlot.length == 0)
            m_pendingRequests.delete(domain);
    }
    return false;   
}

function onCompleted(details)
{
    if (ProcessRequestComplete(details))
        callToService("requestComplete", {requestId: details.requestId});
    ProcessRedirectObject(details);
}

function onRequestError(details)
{
    if (ProcessRequestComplete(details))
        callToService("requestError", {requestId: details.requestId, error:details.error}); 
}

function callToService(commandPostfix, args)
{
    m_callFunction("ee." + commandPostfix, args);
}

function ProcessEvent(details, method, methodData)
{
    if (m_spMode)
    {
        callToService(method, methodData);
        return;
    }
    if (!m_isDomainFilteringSupported || m_operationMode == DomainFilteringModeProcessAll)
    {
        callToService(method, methodData);
        return;
    }

    let domain = new URL(details.url).hostname.toLowerCase();
    if (m_domains.has(domain))
    {
        callToService(method, methodData);
        return;
    }
    let domainRequestsSlot = m_pendingRequests.get(domain);
    if (!domainRequestsSlot)
    {
        domainRequestsSlot = [];
        m_pendingRequests.set(domain, domainRequestsSlot);
    }
    let index = domainRequestsSlot.findIndex((element)=>{return element.requestId === details.requestId;})
    if (index === -1)
    {
        domainRequestsSlot.push({requestId: details.requestId, notifications: []});
        index = domainRequestsSlot.length - 1;
    }

    domainRequestsSlot[index].notifications.push({methodName: method, methodParam: methodData});
    if (domainRequestsSlot[index].notifications.length > m_requestsCacheLimit)
        domainRequestsSlot[index].notifications.shift();
}

function OnRedirectCall(redirectDetails)
{
    if (redirectDetails.requestUrl)
        AddOrUpdate(m_redirectUrlList, redirectDetails.requestUrl, redirectDetails.url, redirectDetails.whiteUrl);
    else
        AddOrUpdate(m_redirectIdList, redirectDetails.requestId, redirectDetails.url);

    ns.SetTimeout(function()
    {
        var details = { requestId: redirectDetails.requestId, url: redirectDetails.requestUrl, type: redirectDetails.type, tabId: redirectDetails.tabId };
        ProcessRedirectObject(details);
    }, 500);
}

function OnSetSettings(settings)
{
    let isSubscriptionByOldSettings = m_spMode || m_isInterceptionEnabled && (!m_isDomainFilteringSupported || (m_isDomainFilteringSupported && m_operationMode != DomainFilteringModeSkipAll));
    m_isDomainFilteringSupported = (settings && "undefined" !== typeof(settings.queueLimit)) ? true : false;
    m_operationMode = settings.mode;
    m_queueLimit = settings.queueLimit;
    m_cacheLimit = settings.domainsCacheLimit;
    m_requestsCacheLimit = settings.requestsCacheLimit;
    m_isControledByProduct = (settings && "undefined" !== typeof(settings.isInterceptionEnabled)) ? true : false;
    m_isInterceptionEnabled = (m_isControledByProduct && settings.isInterceptionEnabled) ? true : false;
    m_isTabRedirectByBlockedResourceDisabled = (settings && "undefined" !== typeof (settings.isTabRedirectByBlockedResourceDisabled) && settings.isTabRedirectByBlockedResourceDisabled) ? true : false;

    let isSubscriptionByNewSettings = m_spMode || m_isInterceptionEnabled && (!m_isDomainFilteringSupported || (m_isDomainFilteringSupported && m_operationMode != DomainFilteringModeSkipAll));
    if (isSubscriptionByNewSettings == isSubscriptionByOldSettings)
        return;

    if (isSubscriptionByNewSettings)
    {
        webrequest.dispatcher.subscribeToRequestEvents(onBeforeRequestHandler, onBeforeSendHeaders, onHeadersReceived, onAuthRequiredOptions, onCompleted, onRequestError);
        browsersApi.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);
    }
    else
    {
        webrequest.dispatcher.unsubscribeFromRequestEvents(onBeforeRequestHandler, onBeforeSendHeaders, onHeadersReceived, onAuthRequiredOptions, onCompleted, onRequestError);
        browsersApi.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate);
    }
}

function SendCachedNotifications(domain)
{
    let domainRequestsSlot = m_pendingRequests.get(domain);
    if (!domainRequestsSlot)
        return;

    while(domainRequestsSlot.length)
        SendNotificationByIndex(domainRequestsSlot, 0);

    m_pendingRequests.delete(domain);
}

function OnDomainFilteringRequested(connectionInfo)
{
    let domain = connectionInfo.domain.toLowerCase();
    if (m_domainsQueue.length >= m_queueLimit)
        m_domainsQueue.shift();
    m_domainsQueue.push(domain);
    if (m_domains.size < m_cacheLimit)
        m_domains.add(domain);
    else
        m_domains = new Set(m_domainsQueue);
    SendCachedNotifications(domain);
}

function onPluginInitialized(activatePlugin, registerMethod, callFunction)
{
    m_callFunction = callFunction;

    activatePlugin("ee", onPing, onError);
    registerMethod("ee.redirect", OnRedirectCall);
    registerMethod("ee.setSettings", OnSetSettings);
    registerMethod("ee.onDomainFilteringRequested", OnDomainFilteringRequested);
    if (m_spMode || m_isInterceptionEnabled && (!m_isDomainFilteringSupported || (m_isDomainFilteringSupported && m_operationMode != DomainFilteringModeSkipAll)))
    {
        webrequest.dispatcher.subscribeToRequestEvents(onBeforeRequestHandler, onBeforeSendHeaders, onHeadersReceived, onAuthRequiredOptions, onCompleted, onRequestError);
        browsersApi.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);
    }
}

function InitializePlugin()
{
    var initFunction = function() {session.InitializePlugin(onPluginInitialized);};
    if (m_spMode || m_isControledByProduct)
        initFunction();
    else
        m_requestErrorCallback = initFunction;
}

InitializePlugin();

});

var m_callFunction = function() {};
var m_scriptletsRules = null;
var m_popupRules = null;
var m_scriptletBase = null;
var m_deactivateFunction = function() {};
var FromSameSiteRequestType = 0;
var FromAnotherSiteRequestType = 1;
var m_popupUrl = "";
var m_excludedDomains = null;

var m_contentFunction = function(hostname, scriptlet) {
    var m_observer = null;

    if (document.location === null || hostname !== document.location.hostname)
        return;
    let injectScriptlet = function(element) {
        let scriptNode;
        try
        {
            scriptNode = document.createElement("script");
            scriptNode.setAttribute("type", "text/javascript");
            scriptNode.text = decodeURIComponent(scriptlet);
            (element.head || element.documentElement).appendChild(scriptNode);
        }
        catch (e) {}

        if (scriptNode)
        {
            if (scriptNode.parentNode) 
                scriptNode.parentNode.removeChild(scriptNode);
        }
    }
    injectScriptlet(document);


    let processFrames = function(frames)
    {
        if (!frames)
            return;
        frames.forEach(function(frame) {
            if ( /^https?:\/\//.test(frame.src) === false )
                injectScriptlet(frame.contentDocument);
        });
    };

    let processElements = function(list)
    {
        list.forEach(function(elem) {
            if (elem.nodeType !== 1 || !elem.parentElement || !elem.contentDocument)
                return;
            if (elem.nodeName.toLowerCase() === "iframe")
                processFrames([elem]);

            if (elem.childElementCount === 0)
                return;
            processFrames(elem.querySelectorAll("iframe"));
        });
    }


    let startObserver = function(evt)
    {
        if (evt !== undefined)
            window.removeEventListener("DOMContentLoaded", startObserver);

        processFrames(document.querySelectorAll("iframe"));

        m_observer = new MutationObserver(processElements);
        m_observer.observe(document, { childList: true, subtree: true });
    }

    if ( document.readyState === "loading" ) 
        window.addEventListener("DOMContentLoaded", startObserver);
    else
        startObserver();

}.toString();

function GetRulesForHost(host)
{
    var rules = [];
    m_scriptletsRules.forEach(function(rule) {
        if ((rule.include && rule.include.test(host)) && (rule.exclude ? !rule.exclude.test(host) : true))
            rules.push(rule.rule);
    });
    return rules;
}

function IsExcludedDomain(url)
{
    return m_excludedDomains !== null && m_excludedDomains.includes(url.hostname);
}

function onCommitted(details)
{
    try
    {
        var url = new URL(details.url);
        if (IsExcludedDomain(url))
        {
            KasperskyLab.SessionLog("scriptlets skip site by exclude domain: " + details.url);
            return;
        }
        var rules = GetRulesForHost(url.hostname);

        if (rules && rules.length)
        {
            KasperskyLab.SessionLog("Exist rules for " + url.hostname + " (count: " + rules.length + ")");

            if (!m_scriptletBase)
            {
                KasperskyLab.SessionLog("Base scriptlet not loaded yet");
                return;
            }

            var scriptlet = encodeURIComponent(m_scriptletBase + "(" + JSON.stringify(rules) + ");");

            var contentScript = "(" + m_contentFunction + ")(\"" + url.hostname + "\", \"" + scriptlet + "\");";
            browsersApi.tabs.executeScript(details.tabId, {
                    code: contentScript, 
                    frameId: details.frameId,
                    matchAboutBlank: false,
                    runAt: "document_start"
                },
                ()=>
                {
                    if (browsersApi.runtime.lastError)
                        KasperskyLab.SessionLog(`Scriplets failed with error ${browsersApi.runtime.lastError.message}`);
                    else
                        KasperskyLab.SessionLog(`Scriplets for ${url.hostname} executed`);
                });
        }
        else
        {
            KasperskyLab.SessionLog("No rules for " + url.hostname);
        }
    }
    catch (e)
    {
        KasperskyLab.SessionError(e);
    }
}


function Subscribe()
{
    if (!browsersApi.webNavigation.onCommitted.hasListener(onCommitted))
        browsersApi.webNavigation.onCommitted.addListener(onCommitted);
}

function Unsubscribe()
{
    if (browsersApi.webNavigation.onCommitted.hasListener(onCommitted))
        browsersApi.webNavigation.onCommitted.removeListener(onCommitted);
}

function RunnerImpl(ns, session, settings, locales)
{
    function OnPing()
    {
        return ns.MaxRequestDelay;
    }
    function CreateRegExp(list)
    {
        if (!list || !list.length)
            return null;
        var result = "";
        list.forEach(function(el) {
            if (result)
                result += "|";
            result += "^(.*\.+)?" + el;
        });
        return new RegExp(result);
    }
    function OnSetSettings(settings)
    {
        m_excludedDomains = (settings.excludedDomains) ? settings.excludedDomains : null;
        SetScriptletsRules(settings);
        SetPopupRules(settings);
    }
    function SetPopupRules(settings)
    {
        var needSubscribe = !m_popupRules;

        if (!settings || !settings.popupRules)
            m_popupRules = null;
        else
            m_popupRules = settings.popupRules;

        if (needSubscribe && m_popupRules)
            SubscribePopups();
        if (!m_popupRules && !needSubscribe)
            UnsubscribePopups();
    }
    function SetScriptletsRules(settings)
    {
        var needSubscribe = !m_scriptletsRules;

        if (!settings || !settings.rules || !settings.rules.length)
        {
            m_scriptletsRules = null;
        }
        else
        {
            m_scriptletsRules = [];
            settings.rules.forEach(function(rule) {
                let includeRgx = "";
                let excludeRgx = "";
                m_scriptletsRules.push({
                    include: CreateRegExp(rule.includeDomains),
                    exclude: CreateRegExp(rule.excludeDomains),
                    rule: rule.rule
                });
            });
            if (!m_scriptletsRules.length)
                m_scriptletsRules = null;
        }
        if (needSubscribe && m_scriptletsRules)
            Subscribe();
        if (!m_scriptletsRules && !needSubscribe)
            Unsubscribe();
    }
    function InitScriptlets()
    {
        var path = browsersApi.runtime.getURL("/additional/scriptlets.js");
        var request = new XMLHttpRequest;
        request.open("GET", path, true);
        request.onload = function()
        {
            if (request.readyState === request.DONE && request.status === 200)
                m_scriptletBase = request.responseText;
            else
                ns.SessionError({ message: "Can't get scriptlets.js", details: "request status: " + request.status }, "abn_back");
        };
        request.send();
    }
    function CheckSite(parentUrl, targetUrl, targetTabId)
    {
        var siteFromBlackList = MatchPopupRules(m_popupRules.blackRules, parentUrl, targetUrl);
        if (!siteFromBlackList)
            return;

        var siteFromWhiteList = MatchPopupRules(m_popupRules.whiteRules, parentUrl, targetUrl);
        if (!siteFromWhiteList)
        {
            m_callFunction("abn_back.popupEvent", { url: targetUrl.href, isBlocked: true });
            browsersApi.tabs.remove(targetTabId, function()
            {
                if (browsersApi.runtime.lastError)
                    ns.SessionError({ message: "ERR popup ab", details: "Error: " + browsersApi.runtime.lastError.message ? browsersApi.runtime.lastError.message : "Remove tab error." }, "abn_back");
            });
        }
        else
        {
            m_callFunction("abn_back.popupEvent", { url: targetUrl.href, isBlocked: false });
        }
    }
    function MatchPopupRules(rules, parentUrl, targetUrl)
    {
        if (!rules)
            return false;

        for (var i = 0; i < rules.length; i++)
        {
            if (MatchPopupRule(parentUrl, targetUrl, rules[i]))
                return true;
        }

        return false;
    }
    function MatchPopupRule(parentUrl, targetUrl, rule)
    {
        var match = targetUrl.href.match(rule.urlRegex)
        if (!match || match.length === 0 || match[0].length === 0)
            return false;

        var parentDomain = parentUrl.host;
        var targetDomain = targetUrl.host;

        if (rule.requestType === FromSameSiteRequestType && parentDomain !== targetDomain)
            return false;
        else if (rule.requestType === FromAnotherSiteRequestType && parentDomain === targetDomain)
            return false;

        if (!rule.includedRefererDomains || rule.includedRefererDomains.length === 0)
            return true;

        for (var i = 0; i < rule.includedRefererDomains.length; i++)
        {
            var match = parentDomain.match("^(.+\.)?" + rule.includedRefererDomains[i] + "$");
            if (match && match.length > 0)
            {
                if (!rule.excludedRefererDomains || rule.excludedRefererDomains.length === 0)
                    return true;

                for (var j = 0; j < rule.excludedRefererDomains.length; j++)
                {
                    match = parentDomain.match("^(.+\.)?" + rule.excludedRefererDomains[j] + "$");
                    if (match && match.length > 0)
                        return false;
                }
                return true;
            }
        }

        return false;
    }
    function OnCreatedNavigationTarget(details)
    {
        try
        {
            browsersApi.tabs.get(details.sourceTabId, function(tab)
            {
                try
                {
                    let url = new URL(details.url);
                    if (browsersApi.runtime.lastError)
                        ns.SessionError({ message: "ERR popup ab", details: "Error: " + browsersApi.runtime.lastError.message ? browsersApi.runtime.lastError.message : "Get tab error." }, "abn_back");
                    else if (m_popupUrl && details.url === m_popupUrl)
                        ns.SessionLog("popup ab - Skip site by url: " + m_popupUrl);
                    else if (IsExcludedDomain(url))
                        ns.SessionLog("popup ab - Skip site by exclude domain: " + details.url);
                    else
                        CheckSite(new URL(tab.url), url, details.tabId);
                }
                catch (e)
                {
                    ns.SessionError(e, "abn_back");
                }
            });
        }
        catch (e)
        {
            ns.SessionError(e, "abn_back");
        }
    }
    function OnMessage(request, sender, sendResponse)
    {
        if (sender.id !== browsersApi.runtime.id)
        {
            ns.SessionError({ message: "Security error. Unexpected sender.", details: "sender.id: " + sender.id + "\r\ncurrent.id: " + browsersApi.runtime.id }, "abn_back");
            return;
        }

        if ("sendPopupUrl" === request.command)
            m_popupUrl = request.url || "";
    }
    function SubscribePopups()
    {
        if (!browsersApi.webNavigation.onCreatedNavigationTarget.hasListener(OnCreatedNavigationTarget))
            browsersApi.webNavigation.onCreatedNavigationTarget.addListener(OnCreatedNavigationTarget);

        browsersApi.runtime.onMessage.addListener(OnMessage);
    }
    function UnsubscribePopups()
    {
        if (browsersApi.webNavigation.onCreatedNavigationTarget.hasListener(OnCreatedNavigationTarget))
            browsersApi.webNavigation.onCreatedNavigationTarget.removeListener(OnCreatedNavigationTarget);
    }
    function Init()
    {
        InitScriptlets();
        session.InitializePlugin(
            function(activatePlugin, registerMethod, callFunction, deactivateFunction)
            {
                m_callFunction = callFunction;
                activatePlugin("abn_back", OnPing);
                registerMethod("abn_back.setSettings", OnSetSettings);
                m_deactivateFunction = deactivateFunction;
            });
        OnSetSettings(settings);
    }

    Init();
}

function StopImpl(ns, session)
{
    Unsubscribe();
    m_scriptletsRules = null;
    m_scriptletBase = null;
    m_deactivateFunction("abn_back");
}

KasperskyLab.AddRunner2({
    name: "abn_back",
    runner: RunnerImpl,
    stop: StopImpl
});
KasperskyLab.AddRunner("ab_background", function(ns, session, settings, locales)
{
    var m_callFunction = function() {};
    var m_isTaskEnabled = false;

    function OnPing()
    {
        return ns.MaxRequestDelay;
    }
    function AddContextMenu()
    {
        Cleanup();
        browsersApi.contextMenus.create({ id: "AddToBlockList", title: locales["AntiBannerContextMenuPrompt"], contexts: ["image"], targetUrlPatterns: ["http://*/*", "https://*/*"], onclick: HandleAddToBlockList });
    }

    function Cleanup()
    {
        browsersApi.contextMenus.removeAll();
    }

    function HandleAddToBlockList(args)
    {
        m_callFunction("ab_background.AddToBlockList", { src: args.srcUrl });
    }
    function SetTaskEnabled(isTaskEnabled)
    {
        if (isTaskEnabled === m_isTaskEnabled)
            return;
        m_isTaskEnabled = isTaskEnabled;
        if (m_isTaskEnabled)
            AddContextMenu();
        else
            Cleanup();
    }
    function OnSetTaskEnabled(settings)
    {
        SetTaskEnabled(settings.isTaskEnabled);
    }

    function Init()
    {
        session.InitializePlugin(
            function(activatePlugin, registerMethod, callFunction)
            {
                m_callFunction = callFunction;
                activatePlugin("ab_background", OnPing, Cleanup);
                registerMethod("ab_background.setTaskEnabled", OnSetTaskEnabled);
            });
        SetTaskEnabled(settings.isTaskEnabled);
    }

    Init();
});
(function BrowserCookie(ns) {

var m_callFunction = ns.EmptyFunc;
var m_deactivateFunction = ns.EmptyFunc;

function RunnerImpl(ns, session)
{
var m_optionalCookieFields = ["value", "domain", "path", "secure", "httpOnly", "expirationDate"];

function onPing()
{
    return ns.MaxRequestDelay;
}

function onError() {}

function ConvertTimeUnixToWindows(unixTime)
{
    var diff = 116444736000000000;
    return unixTime * 10000000 + diff;
}

function ConvertTimeWindowsToUnix(winTime)
{
    var diff = 11644473600;
    return winTime / 10000000 - diff;
}

function callToService(commandPostfix, jsonArg)
{
    m_callFunction("cm." + commandPostfix, jsonArg);
}

function OnGetCookieCall(getCookieDetails)
{
    browsersApi.cookies.getAll({ url: getCookieDetails.url }, function (cookies) { OnGetCookieCallback(getCookieDetails.callId, cookies); });
}

function OnSetCookieCall(setCookieDetails)
{
    if (setCookieDetails.cookies.length === 0)
    {
        ns.SessionError("Wrong cookies list (empty)", "cm");
        return;
    }
    SetCookieImpl(setCookieDetails.callId, setCookieDetails.url, setCookieDetails.cookies.shift(), setCookieDetails.cookies, "");
}

function OnGetCookieCallback(callId, cookies)
{
    var cookiesArg = [];
    if (browsersApi.runtime.lastError)
    {
        callToService("getCallback", { callId: callId, isSucceeded: false });
        ns.SessionError({ message: "Get cookie error occure", details: "error: " + browsersApi.runtime.lastError.message }, "cm");
        return;
    }

    for (var i = 0; i < cookies.length; ++i)
    {
        var cookie = cookies[i];
        var cookieArg = { name: cookie.name, value: cookie.value };
        for (var j = 0; j < m_optionalCookieFields.length; ++j)
        {
            var cookieField = m_optionalCookieFields[j];
            if (ns.IsDefined(cookie[cookieField]))
            {
                cookieArg[cookieField + "_initialized"] = true;
                cookieArg[cookieField] = cookie[cookieField];
            }
        }
        if (ns.IsDefined(cookieArg.expirationDate))
            cookieArg.expirationDate = ConvertTimeUnixToWindows(cookieArg.expirationDate);

        cookiesArg.push(cookieArg);
    }
    callToService("getCallback", { callId: callId, isSucceeded: true, cookies: cookiesArg });
}

function OnSetCookieCallback(callId, url, tail, errors, settedCookie)
{
    if (!settedCookie && browsersApi.runtime.lastError)
        errors += browsersApi.runtime.lastError.message + ";";

    if (!tail.length)
    {
        callToService("setCallback", { callId: callId, isSucceeded: !errors && Boolean(settedCookie) });
        return;
    }
    var cookie = tail.shift();
    SetCookieImpl(callId, url, cookie, tail, errors);
}

function SetCookieImpl(callId, url, cookie, tail, errors)
{
    var cookieArg = { url: url, name: cookie.name };
    for (var i = 0; i < m_optionalCookieFields.length; ++i)
    {
        var cookieField = m_optionalCookieFields[i];
        if (cookie[cookieField + "_initialized"])
            cookieArg[cookieField] = cookie[cookieField];
    }
    if (ns.IsDefined(cookieArg.expirationDate))
        cookieArg.expirationDate = ConvertTimeWindowsToUnix(cookieArg.expirationDate);

    browsersApi.cookies.set(cookieArg, function (settedCookie) { OnSetCookieCallback(callId, url, tail, errors, settedCookie); });
}

function onPluginInitialized(activatePlugin, registerMethod, callFunction, deactivateFunction)
{
    m_callFunction = callFunction;
    m_deactivateFunction = deactivateFunction;

    activatePlugin("cm", onPing, onError);
    registerMethod("cm.getCookie", OnGetCookieCall);
    registerMethod("cm.setCookie", OnSetCookieCall);
}

session.InitializePlugin(onPluginInitialized);
}

function StopImpl()
{
    m_deactivateFunction("cm");
}

KasperskyLab.AddRunner2({
    name: "cm",
    runner: RunnerImpl,
    stop: StopImpl
});
})(KasperskyLab);
(function WebNavigation(ns) {

var m_callFunction = ns.EmptyFunc;
var m_deactivateFunction = ns.EmptyFunc;

function onRemoved(removedTabId)
{
    m_callFunction("wn.onRemoved",
        {
            tabId: removedTabId
        });
}

function onBeforeRedirect(details)
{
    m_callFunction("wn.onBeforeRedirect",
        {
            url: details.redirectUrl,
            parentUrl: details.url,
            tabId: details.tabId
        });
}

function onBeforeNavigate(details)
{
    m_callFunction("wn.onBeforeNavigate",
        {
            tabId: details.tabId,
            url: details.url,
            isFrame: details.frameId !== 0
        });
}

function onCommitted(details)
{
    var transitionQualifiers = details.transitionQualifiers.reverse();
    if (transitionQualifiers.length === 0) {
        if (details.transitionType === "reload")
            transitionQualifiers.push("from_address_bar");
        else
            transitionQualifiers.push("unknown");
    }

    transitionQualifiers.forEach(function (item) {
        var transitionQualifierEnum = 0;
        if (item === "client_redirect")
            transitionQualifierEnum = 1;
        else if (item === "server_redirect")
            transitionQualifierEnum = 2;
        else if (item === "forward_back")
            transitionQualifierEnum = 3;
        else if (item === "from_address_bar")
            transitionQualifierEnum = 4;
        else
            transitionQualifierEnum = 0;

        m_callFunction("wn.onCommitted",
            {
                url: details.url,
                redirectType: transitionQualifierEnum,
                tabId: details.tabId,
                isFrame: details.frameId !== 0
            });
    });
}

function Subscribe()
{
    browsersApi.webNavigation.onCommitted.addListener(onCommitted);
    browsersApi.webNavigation.onBeforeNavigate.addListener(onBeforeNavigate);

    const filter = { urls: ["https://*/*", "http://*/*"] };
    browsersApi.webRequest.onBeforeRedirect.addListener(onBeforeRedirect, filter, []);

    browsersApi.tabs.onRemoved.addListener(onRemoved);
}

function Unsubscribe()
{
    if (browsersApi.webNavigation.onCommitted.hasListener(onCommitted))
        browsersApi.webNavigation.onCommitted.removeListener(onCommitted);
    if (browsersApi.webNavigation.onBeforeNavigate.hasListener(onBeforeNavigate))
        browsersApi.webNavigation.onBeforeNavigate.removeListener(onBeforeNavigate);
    if (browsersApi.webRequest.onBeforeRedirect.hasListener(onBeforeRedirect))
        browsersApi.webRequest.onBeforeRedirect.removeListener(onBeforeRedirect);
    if (browsersApi.tabs.onRemoved.hasListener(onRemoved))
        browsersApi.tabs.onRemoved.removeListener(onRemoved);
}

function RunnerImpl(ns, session)
{
function onPing()
{
    return ns.MaxRequestDelay;
}

function onPluginInitialized(activatePlugin, registerMethod, callFunction, deactivateFunction)
{
    m_callFunction = callFunction;
    activatePlugin("wn", onPing);
    m_deactivateFunction = deactivateFunction;

    Subscribe();
}

session.InitializePlugin(onPluginInitialized);
}

function StopImpl()
{
    Unsubscribe();
    m_deactivateFunction("wn");
}

KasperskyLab.AddRunner2({
    name: "wn",
    runner: RunnerImpl,
    stop: StopImpl
});
})(KasperskyLab);
KasperskyLab.AddRunner("xhr_tracker", function AddRunnerXhrTracker(ns, session, settings)
{
    var m_callFunction = null;

    function IsHeader(headers, name, value)
    {
        return ns.IsDefined(headers.find(function findCallback(element)
            {
                return !!element["name"] && element["name"].toLowerCase() === name.toLowerCase() &&
                     ((value) ? !!element["value"] && element["value"].toLowerCase() === value.toLowerCase() : true);
            }));
    }

    function GetCustomHeader()
    {
        return (settings && settings.customHeader) ? settings.customHeader : "X-KL-Ajax-Request";
    }

    function Initialize() {
        session.InitializePlugin(function InitializeXhr(activatePlugin, registerMethod, callFunction) {
            m_callFunction = callFunction;
            activatePlugin("xhr_tracker", OnPing);

            browsersApi.webRequest.onBeforeSendHeaders.addListener(function onBeforeSendHeaders(details)
                {
                    if (details.type !== "xmlhttprequest")
                        return;

                    var origin = details.originUrl || details.initiator;
                    if (ns.IsCorsRequest(details.url, origin) || !IsHeader(details.requestHeaders, GetCustomHeader()))
                    {
                        m_callFunction("xhr.onBeforeSendHeaders", {url: details.url});
                    }
                    return {requestHeaders: details.requestHeaders};
                },
                { urls: ["<all_urls>"] },
                ["blocking", "requestHeaders"]);
        });
    }

    function OnPing()
    {
        return ns.MaxRequestDelay;
    }

    Initialize();
}, { referrer: document.referrer });
KasperskyLab.AddRunner("dpbgrd", function()
{
    function HistoryStateUpdate(details)
    {
        if (details.frameId !== 0)
            return;
        browsersApi.tabs.sendMessage(details.tabId, {command: "HistoryStateUpdate"}, {frameId: 0});
    }

    browsersApi.webNavigation.onHistoryStateUpdated.addListener(HistoryStateUpdate);
});
(function PopupWindowMain(ns) 
{
    ns.PopupWindow = function PopupWindow(pluginName, session, windowSrc, windowCssPostfix)
    {
        var m_cssData = "";
        var m_settings = null;
        var m_locales = null;
        var m_report = null;
        var m_windowResourceUrl = GetResourceUrl();

        function GetResourceUrl()
        {
            return browsersApi.extension.getURL("snapshot_resources" + windowSrc); 
        }

        function CreateWindow()
        {
            var popupURL = GetResourceUrl();
            browsersApi.windows.create({ url: popupURL, type: "popup",
                height: 1, width: 1, left: screen.width, top: screen.height });
        }

        function OnCssLoad(data)
        {
            m_cssData = data;
        }

        function OnCssLoadError(errorMessage)
        {
            ns.SessionError({ message: "Failed load ufb css resource. Error message: " + errorMessage, details: "windowCssPostfix: " + windowCssPostfix });
        }

        function OnInitReceived()
        {
            browsersApi.runtime.sendMessage({receiver: m_windowResourceUrl, command: "init", 
                initData: { pluginName: pluginName, report: m_report, locales: m_locales, settings: m_settings, cssData: m_cssData } });
        }

        function OnMessage(message)
        {
            if (message.sender === GetResourceUrl())
            {
                if (message.command === "init")
                    OnInitReceived();
            }
        }

        function Init()
        {
            if (windowCssPostfix)
                session.GetResource(windowCssPostfix, OnCssLoad, OnCssLoadError);

            browsersApi.runtime.onMessage.addListener(OnMessage);
        }

        this.Open = function Open(request, report)
        {
            m_report = report;
            m_settings = request.settings;
            m_locales = request.locales;
            CreateWindow();
        };

        Init();
    };
}) (KasperskyLab || {});
KasperskyLab.AddRunner("ufb", function(ns, session)
{
    var UserFeedback = function UserFeedback()
    {
        var m_redirects = new Map();
        var m_beforeRedirectMap = new Map();

        const userTransitionTypesToClearRedirects = new Set(["link", "typed", "generated", "form_submit"]);

        var m_phfbWindow = new ns.PopupWindow("phfb", session, "/ufb/phishing_user_feedback_window.html", "/ufb/popup_window.css");
        var m_bwfbWindow = new ns.PopupWindow("bwfb", session, "/ufb/broken_webpage_user_feedback_window.html", "/ufb/popup_window.css");

        var m_callFunction = function() {};

        function InitializePlugin()
        {
            session.InitializePlugin(
                function(activatePlugin, registerMethod, callFunction)
                {
                    m_callFunction = callFunction;
                    activatePlugin("ufb", OnPing);
                });
            browsersApi.runtime.onMessage.addListener(OnMessage);
            browsersApi.webNavigation.onCommitted.addListener(OnCommittedHandler);
            const filter = { urls: ["https://*/*", "http://*/*"] };
            browsersApi.webRequest.onBeforeRedirect.addListener(OnBeforeRefirectHandler, filter, []);
            browsersApi.tabs.onRemoved.addListener(OnRemovedHandler);
        }
        function CallActiveTab(resolve)
        {
            return function(report)
            {
                browsersApi.tabs.query({ active: true, windowType: "normal", currentWindow : true },
                function(result)
                {
                    if (result.length > 0)
                    {
                        report.tabId = result[0].id;
                        report.url = result[0].url;
                        resolve(report);
                    }
                });
            };
        }

        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        function AddDocumentHTMLtoReport(resolve)
        {
            return function(report)
            {
                browsersApi.tabs.executeScript({
                    code: "document.documentElement.innerHTML"
                }, function(executeResults)
                {
                    report.webpage = "";
                    if (browsersApi.runtime.lastError)
                    {
                        console.log("AddDocumentHTMLtoReport: cannot execute the script");
                    } 
                    else if (typeof executeResults[0] === "undefined")
                    {
                        console.log("AddDocumentHTMLtoReport: result not found");
                    } 
                    else
                    {
                        report.webpage = executeResults[0];
                    }
                    resolve(report);
                });
            };
        }

        function AddRedirectsToReport(resolve)
        {
            return function(report)
            {
                report.redirects = [];
                if (m_redirects.has(report.tabId))
                {
                    report.redirects = m_redirects.get(report.tabId);
                }
                resolve(report);
            };
        }

        function OnCommittedHandler(details)
        {   
            if (details.frameId !== 0)
                return;

            var id = details.tabId;
            var url = details.url;

            var isNeedRemovePrevRedirects = userTransitionTypesToClearRedirects.has(details.transitionType)
            if (isNeedRemovePrevRedirects || !m_redirects.has(id))
                m_redirects.set(id, []);

            if (m_beforeRedirectMap.has(id))
            {
                var redirects = m_beforeRedirectMap.get(id);
                for (var i = 0; i < redirects.length; i++)
                    m_redirects.get(id).push(redirects[i]);
                m_beforeRedirectMap.set(id, []);
            }
            if (!isNeedRemovePrevRedirects)
                m_redirects.get(id).push(url);
        }

        function OnBeforeRefirectHandler(details)
        {   
            if (details.frameId !== 0 || details.type !== "main_frame")
                return;
            var id = details.tabId;
            var url = details.url;

            if (!m_beforeRedirectMap.has(id))
                m_beforeRedirectMap.set(id, [url]);
            else
                m_beforeRedirectMap.get(id).push(url);
        }

        function OnRemovedHandler(tabId) 
        {
            if (m_redirects.has(tabId))
                m_redirects.delete(tabId);

            if (m_beforeRedirectMap.has(tabId))
                m_beforeRedirectMap.delete(tabId);
        }

        function OpenBwfbWindow(request)
        {
            return function(report)
            {
                m_bwfbWindow.Open(request, report);
            };
        }

        function OpenPhfbWindow(request)
        {
            return function(report)
            {
                m_phfbWindow.Open(request, report);
            };
        }

        function OnMessage(request, sender, sendResponse)
        {
            try
            {
                if ("bwfb.openWindow" === request.command)
                {
                    var report = {};
                    CallActiveTab(
                        AddDocumentHTMLtoReport(
                            OpenBwfbWindow(request)))(report);
                }
                else if ("phfb.openWindow" === request.command)
                {
                    var report = {};
                    CallActiveTab(
                        AddDocumentHTMLtoReport(
                            AddRedirectsToReport(
                                OpenPhfbWindow(request))))(report);
                }
                else if ("ufb.sendReport" === request.command)
                {
                    if ("ufb.phishing" === request.report.type)
                        SendPhishingReport(request.report);
                    else if ("ufb.broken_webpage" === request.report.type)
                        SendBrokenWebpageReport(request.report);
                }
                else if ("ufb.openPhishingInfo" === request.command)
                    OpenPhishingInfo();
            }
            catch (e)
            {
                ns.SessionError(e, "ufb");
            }
        }

        function SendPhishingReport(report)
        {
            m_callFunction("phfb_popup.send_report", { url: report.url, webpage: report.webpage, redirects: report.redirects });
        }

        function SendBrokenWebpageReport(report)
        {
            m_callFunction("bwfb_popup.send_report", { url: report.url, webpage: report.webpage, userText: report.userText });
        }

        function OpenPhishingInfo()
        {
            m_callFunction("phfb_popup.open_info");
        }

        InitializePlugin();
    };

    var instance = null;
    ns.RunModule(function()
    {
        if (!instance)
            instance = new UserFeedback();
    });
});
KasperskyLab.AddRunner("back_vk", function AddRunnerVirtualKeyboardBackground(ns, session)
{

    var VirtualKeyboardBackground = function VirtualKeyboardBackground()
    {
        function InitializePlugin()
        {
            session.InitializePlugin(
                function InitVirtualKeyboardBackground(activatePlugin, registerMethod, callFunction)
                {
                    activatePlugin("back_vk", OnPing);
                });
            browsersApi.runtime.onMessage.addListener(OnMessage);
        }
        function SendToActiveTab(command)
        {
            browsersApi.tabs.query({ active: true, windowType: "normal", currentWindow : true },
            function Send(tabs)
            {
                if (tabs.length > 0)
                    browsersApi.tabs.sendMessage(tabs[0].id, {command: command});
            });
        }

        function OnPing()
        {
            return ns.MaxRequestDelay;
        }

        function OnMessage(request, sender, sendResponse)
        {
            try
            {
                if ("vk.showMacKeyboard" === request.command)
                    SendToActiveTab(request.command);
            }
            catch (e)
            {
                ns.SessionError(e, "back_vk");
            }
        }

        InitializePlugin();
    };

    var instance = null;
    ns.RunModule(function RunModuleVirtualKeyboardBackground()
    {
        if (!instance)
            instance = new VirtualKeyboardBackground;
    });
});
