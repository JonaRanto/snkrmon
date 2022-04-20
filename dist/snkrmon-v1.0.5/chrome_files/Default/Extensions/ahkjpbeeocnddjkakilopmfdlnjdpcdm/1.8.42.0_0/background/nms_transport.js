function NMServer(caller) {
    function onReceived(msg) {
        SetStorageKeyIfUndefined("InstalledBeforeProduct", false);
        caller.onReceived(msg);
    }
    function onServerDisconnected(disconnectArg) {
        var isNeedToDelete = false;
        if (browsersApi.runtime.lastError) {
            var browserSpecificErrorText = "Specified native messaging host not found.";
            isNeedToDelete = browsersApi.runtime.lastError.message === browserSpecificErrorText;
        }
        else if (disconnectArg && disconnectArg.error) {
            var browserSpecificErrorText = "No such native application " + hostName;
            isNeedToDelete = disconnectArg.error.message === browserSpecificErrorText;
        }
        ProcessNativeMessagingDisconnectError(isNeedToDelete);
        caller.onServerDisconnected(disconnectArg);
        m_port = null;
    }
    function SetStorageKeyIfUndefined(key, value) {
        browsersApi.storage.local.get([key], function (values) {
            if (typeof (values[key]) === "undefined") {
                var keyValue = {};
                keyValue[key] = value;
                browsersApi.storage.local.set(keyValue);
            }
        });
    }
    function RemoveSelfIfNeed() {
        browsersApi.storage.local.get(["InstalledBeforeProduct"], function (values) {
            if (values.InstalledBeforeProduct === false)
                browsersApi.management.uninstallSelf();
        });
    }
    function ProcessNativeMessagingDisconnectError(isNeedToDelete) {
        if (isNeedToDelete)
            RemoveSelfIfNeed();
        SetStorageKeyIfUndefined("InstalledBeforeProduct", isNeedToDelete);
    }
    this.Send = function (msg) {
        m_port.postMessage(msg);
    };
    this.Disconnect = function () {
        m_port.disconnect();
    };
    var hostName = "com.kaspersky.ahkjpbeeocnddjkakilopmfdlnjdpcdm.host";
    var m_port = browsersApi.runtime.connectNative(hostName);
    m_port.onMessage.addListener(onReceived);
    m_port.onDisconnect.addListener(onServerDisconnected);
}
function NativeMessagingTransport() {
    var m_clientId = 1;
    var m_clients = [];
    var _this = this;
    var m_nmServer = null;
    var m_wasConnected = false;
    var m_supported = true;
    var m_protocolVersion = 0;
    function CheckPort(port) {
        if (typeof port === "undefined" || typeof port.id === "undefined")
            return false;
        return true;
    }
    function NewConnection(port) {
        if (!m_nmServer && m_supported)
            m_nmServer = new NMServer(_this);
        if (!m_nmServer) {
            port.disconnect();
            return;
        }
        if (port.name === "resend") {
            var resendPort = browsersApi.tabs.connect(port.sender.tab.id, { name: port.sender.url });
            resendPort.onMessage.addListener(function (message) { port.postMessage(message); });
            port.onMessage.addListener(function (message) { resendPort.postMessage(message); });
            return;
        }
        port.id = m_clientId++;
        port.messageBuffer = "";
        m_clients[port.id] = port;
        port.onDisconnect.addListener(function () {
            var shutdownCommand = { callId: 0, command: "shutdown" };
            if (m_nmServer)
                m_nmServer.Send({ clientId: port.id, message: JSON.stringify(shutdownCommand) });
            delete m_clients[port.id];
        });
        port.onMessage.addListener(ProcessMessage);
        if (m_wasConnected)
            port.postMessage(JSON.stringify({ version: m_protocolVersion, connect: true, portId: port.id }));
    }
    function ProcessSpecificSecureInputCall(msg, port) {
        try {
            var msgObject = JSON.parse(msg);
            if (msgObject.commandAttribute === "vk.startProtect") {
                m_clients[0] = port;
            }
            else if (msgObject.commandAttribute === "vk.stopProtect") {
                if (m_clients[0] && m_clients[0].id === port.id)
                    m_clients[0] = null;
            }
            else if (msgObject.command === "nms") {
                msg = msgObject.commandAttribute;
                port.nmsCaller = true;
            }
        }
        catch (e) {
            KasperskyLab.SessionError(e, "nms_back");
        }
        return msg;
    }
    function ProcessMessage(msg, port) {
        if (!CheckPort(port) || !m_nmServer) {
            port.disconnect();
            delete m_clients[port.id];
            return;
        }
        msg = ProcessSpecificSecureInputCall(msg, port);
        if (msg !== null)
            m_nmServer.Send({ clientId: port.id, message: msg });
    }
    function SendConnected(port) {
        port.postMessage(JSON.stringify({ version: m_protocolVersion, portId: port.id }));
    }
    this.onReceived = function (obj) {
        if (!m_wasConnected) {
            if (obj.protocolVersion < 2 || obj.connect === "unsupported") {
                m_supported = false;
                this.onServerDisconnected();
            }
            else if (obj.connect === "ok") {
                m_wasConnected = true;
                m_protocolVersion = obj.protocolVersion;
                m_clients.forEach(function (port) {
                    if (port)
                        SendConnected(port);
                });
            }
            else {
                this.onServerDisconnected();
            }
            return;
        }
        if (typeof obj.clientId === "undefined") {
            console.debug("Invalid message");
            return;
        }
        var port = m_clients[obj.clientId];
        if (!port) {
            if (obj.clientId === 0 && m_protocolVersion < 4) {
                m_clients.forEach(function (port) {
                    if (port && port.nmsCaller)
                        port.postMessage(obj.message);
                });
            }
            else {
                console.debug("Port didn't find");
                return;
            }
        }
        if (m_protocolVersion < 3) {
            port.postMessage(obj.message);
        }
        else {
            if (!obj.isFinished) {
                port.messageBuffer += obj.message;
            }
            else {
                port.postMessage(port.messageBuffer + obj.message);
                port.messageBuffer = "";
            }
        }
    };
    this.onServerDisconnected = function (msg) {
        m_wasConnected = false;
        if (m_nmServer) {
            m_nmServer.Disconnect();
            m_nmServer = null;
        }
        if (msg)
            KasperskyLab.SessionLog("NMS turn on unsupported state: " + msg);
        m_clients.forEach(function (port) {
            if (port)
                port.disconnect();
        });
        m_clients = [];
    };
    this.connect = function (port) {
        NewConnection(port);
    };
    function init() {
        browsersApi.runtime.onConnect.addListener(NewConnection);
        m_nmServer = new NMServer(_this);
    }
    init();
}
var nativeMessagingTransport = new NativeMessagingTransport();
