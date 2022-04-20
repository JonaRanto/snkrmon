var m_modifiers = {};
var m_oneClickModifiers = {};
var m_locales = {};
var m_layout = "none";
var modifiersKeys = new Set(["capslock", "shift", "alt"]);
var specialModifiersKeys = new Set(["^", "`", "´", "~"]);
var oneClickModifiersKeys = new Set(["shift", "alt", "^", "`", "´", "~"]);
function DrawShift(ctx) {
    ctx.beginPath();
    ctx.lineWidth = 1.1;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.moveTo(06, 22);
    ctx.lineTo(10, 22);
    ctx.lineTo(10, 27);
    ctx.lineTo(16, 27);
    ctx.lineTo(16, 22);
    ctx.lineTo(20, 22);
    ctx.lineTo(13, 15);
    ctx.moveTo(06, 22);
    ctx.lineTo(13, 15);
    ctx.strokeStyle = "#888";
    ctx.stroke();
}
function DrawAlt(ctx) {
    ctx.beginPath();
    ctx.lineWidth = 1.1;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.moveTo(00, 20);
    ctx.lineTo(06, 20);
    ctx.lineTo(11, 27);
    ctx.lineTo(19, 27);
    ctx.moveTo(11, 20);
    ctx.lineTo(19, 20);
    ctx.strokeStyle = "#888";
    ctx.stroke();
}
function DrawCapsLock(ctx, isEnabled) {
    ctx.beginPath();
    ctx.fillStyle = isEnabled ? "#3c6" : "#888";
    ctx.arc(5, 5, 2, 0, Math.PI * 2.0, true);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.lineWidth = 1.1;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    ctx.moveTo(06, 17);
    ctx.lineTo(10, 17);
    ctx.lineTo(10, 22);
    ctx.lineTo(16, 22);
    ctx.lineTo(16, 17);
    ctx.lineTo(20, 17);
    ctx.lineTo(13, 10);
    ctx.moveTo(06, 17);
    ctx.lineTo(13, 10);
    ctx.moveTo(10, 24);
    ctx.lineTo(10, 27);
    ctx.lineTo(16, 27);
    ctx.lineTo(16, 24);
    ctx.lineTo(10, 24);
    ctx.strokeStyle = "#888";
    ctx.stroke();
}
function DrawReturnButton(ctx) {
    ctx.beginPath();
    ctx.moveTo(29, 23);
    ctx.lineTo(29, 15);
    ctx.lineTo(21, 15);
    ctx.moveTo(29, 23);
    ctx.lineTo(6, 23);
    ctx.moveTo(6, 23);
    ctx.lineTo(14, 18);
    ctx.moveTo(6, 23);
    ctx.lineTo(14, 28);
    ctx.strokeStyle = "#888";
    ctx.stroke();
}
function DrawBackspace(ctx) {
    ctx.moveTo(57, 23);
    ctx.lineTo(37, 23);
    ctx.moveTo(37, 23);
    ctx.lineTo(45, 18);
    ctx.moveTo(37, 23);
    ctx.lineTo(45, 28);
    ctx.strokeStyle = "#888";
    ctx.stroke();
}
function DrawTab(ctx) {
    ctx.beginPath();
    ctx.moveTo(00, 23);
    ctx.lineTo(20, 23);
    ctx.moveTo(20, 23);
    ctx.lineTo(13, 18);
    ctx.moveTo(20, 23);
    ctx.lineTo(13, 28);
    ctx.moveTo(21, 17);
    ctx.lineTo(21, 29);
    ctx.strokeStyle = "#888";
    ctx.stroke();
}
function DrawSymbol(ctx, label) {
    ctx.font = "15px Helvetica";
    ctx.fillStyle = "#888";
    ctx.fillText(label, 6, 15);
}
function GetImageFromLocales(name) {
    return "url(" + m_locales[name + ".png"] + ")";
}
function ModifyKeySet(from, to) {
    if (from === to)
        return null;
    var layout = document.getElementById("VirtualKeyboardLayout");
    for (var i = 0; i < layouts[m_layout]["sets"].length; i++) {
        var availableSetName = layouts[m_layout]["sets"][i];
        var currentSet = document.getElementById("kl_current_set");
        var newSet = new KeySet(availableSetName + to, "kl_" + availableSetName);
        if (newSet) {
            layout.removeChild(currentSet);
            layout.appendChild(newSet);
            return true;
        }
        else
            return newSet;
    }
}
function ModifyKeySetBy(modificationFunction, reject) {
    var from = GetModificationString();
    modificationFunction();
    var to = GetModificationString();
    var result = ModifyKeySet(from, to);
    if (!result && reject)
        reject();
}
function GetModificationString() {
    var modification = "";
    for (var modifier in m_modifiers)
        if (Object.prototype.hasOwnProperty.call(m_modifiers, modifier))
            modification += "_" + modifier;
    return modification;
}
function RemoveOneClickModifications() {
    for (var modifier in m_oneClickModifiers)
        if (Object.prototype.hasOwnProperty.call(m_oneClickModifiers, modifier))
            delete m_modifiers[modifier];
}
function RemoveModificationBy(key) {
    return function RemoveModification() {
        delete m_modifiers[key];
    };
}
function AddModificationBy(key) {
    return function AddModification() {
        m_modifiers[key] = key;
    };
}
function IsModifiedBy(key) {
    return m_modifiers[key];
}
function CreateLayout(name) {
    if (!layouts[name]) {
        name = m_layout;
        if (KasperskyLab.IsDefined(name)) {
            for (var layout in layouts) {
                if (Object.prototype.hasOwnProperty.call(layouts, layout))
                    name = layout;
                break;
            }
        }
    }
    m_layout = name;
    var layout = document.createElement("div");
    layout.setAttribute("id", "VirtualKeyboardLayout");
    layout.setAttribute("class", "kl_layout");
    for (var i = 0; i < layouts[name]["sets"].length; i++) {
        var set = layouts[name]["sets"][i];
        layout.appendChild(new KeySet(set, "kl_" + set));
    }
    return layout;
}
function ChangeLayout(name) {
    var keyboard = document.getElementById("VirtualKeyboardMac");
    if (m_layout === "none")
        keyboard.appendChild(CreateLayout(name));
    else {
        var layout = document.getElementById("VirtualKeyboardLayout");
        keyboard.removeChild(layout);
        keyboard.appendChild(CreateLayout(name));
    }
}
var ButtonUI = function ButtonUI(key, label) {
    var systemButtons = new Set(["capslock", "shift", "backspace", "tab", "return", "returnUS"]);
    var m_ui = null;
    var m_canvas = null;
    function Initialize() {
        m_ui = document.createElement("div");
        m_canvas = CreateCanvas(key, label);
        if (key === "return") {
            var upperShadow = document.createElement("div");
            upperShadow.setAttribute("class", "kl_return_upper_shadow");
            m_ui.appendChild(upperShadow);
            var lowerShadow = document.createElement("div");
            lowerShadow.setAttribute("class", "kl_return_lower_shadow");
            m_ui.appendChild(lowerShadow);
            var upperReturn = document.createElement("div");
            upperReturn.setAttribute("class", "kl_return_upper");
            upperReturn.appendChild(m_canvas);
            m_ui.appendChild(upperReturn);
            var lowerReturn = document.createElement("div");
            lowerReturn.setAttribute("class", "kl_return_lower");
            m_ui.appendChild(lowerReturn);
        }
        else if (key === "returnUS") {
            var layer = document.createElement("div");
            layer.setAttribute("class", "kl_system_shift");
            layer.appendChild(m_canvas);
            m_ui.appendChild(layer);
        }
        else {
            m_ui.appendChild(m_canvas);
        }
    }
    function CreateCanvas(key, label) {
        var canvas = document.createElement("canvas");
        canvas.width = (key === "backspace" || key === "returnUS") ? "64" : "32";
        canvas.height = key === "return" ? "50" : "32";
        canvas.innerText = label;
        var canvasClassAttribute = systemButtons.has(key) ? "system_button_canvas" : "button_canvas";
        canvas.setAttribute("class", canvasClassAttribute);
        var ctx = canvas.getContext("2d");
        if (!DrawButton(key, ctx))
            DrawSymbol(ctx, label);
        ctx.closePath();
        return canvas;
    }
    function DrawButton(key, ctx) {
        if (key === "backspace")
            DrawBackspace(ctx);
        else if (key === "tab")
            DrawTab(ctx);
        else if (key === "capslock")
            DrawCapsLock(ctx, m_modifiers[key]);
        else if (key === "alt")
            DrawAlt(ctx);
        else if (key === "shift")
            DrawShift(ctx);
        else if (key === "return" || key === "returnUS")
            DrawReturnButton(ctx);
        else
            return false;
        return true;
    }
    Initialize();
    return m_ui;
};
var Button = function Button(key, data) {
    var releaseConditionKeySet = new Set(["symbol", "backspace", "capslock", "tab"]);
    var m_element = null;
    var m_ui = null;
    var m_isButtonPressed = false;
    var m_timer = null;
    function Initialize() {
        m_element = document.createElement("div");
        m_ui = new ButtonUI(key, data.label);
        m_element.appendChild(m_ui);
        if (key === "return" || key === "returnUS") {
            if (key === "returnUS")
                key = "return";
            m_element.setAttribute("class", data.classAttribute);
        }
        else {
            var btnClass = data.classAttribute;
            var classAttribute = btnClass === "kl_empty" ? btnClass : "kl_button " + btnClass;
            m_element.setAttribute("class", classAttribute);
        }
        if (key === "alt")
            RepaintAlt();
        else if (key === "shift")
            RepaintShift();
        SubscribeEvents();
    }
    function SubscribeEvents() {
        AddEventListener(m_element, "mouseup", OnReleased);
        AddEventListener(m_element, "mouseout", OnOuted);
        if (modifiersKeys.has(key) || specialModifiersKeys.has(key))
            AddEventListener(m_element, "mousedown", OnModifierPressed);
        else
            AddEventListener(m_element, "mousedown", OnPressed);
        if (key === "capslock")
            AddEventListener(m_element, "mousedown", RepaintCapsLock);
        else if (key === "alt")
            AddEventListener(m_element, "mousedown", RepaintAlt);
        else if (key === "shift")
            AddEventListener(m_element, "mousedown", RepaintShift);
    }
    function OnLongPressed(callback, timeout) {
        if (m_isButtonPressed) {
            callback();
            m_timer = setTimeout(function RecursiveLongPress() { OnLongPressed(callback, 160); }, timeout);
        }
    }
    function ChangeState() {
        if (m_isButtonPressed) {
            m_isButtonPressed = false;
            clearTimeout(m_timer);
        }
    }
    function OnPressed() {
        if (key === "backspace") {
            m_isButtonPressed = true;
            OnLongPressed(function SendBackspace() {
                SendKey(key);
            }, 320);
        }
        else if (key === "return" || key === "tab") {
            SendKey(key);
        }
        else {
            m_isButtonPressed = true;
            OnLongPressed(function SendSymbol() {
                SendData({ msg: "vk.pressedKey", key: "symbol", text: data.text });
            }, 320);
            ModifyKeySetBy(RemoveOneClickModifications);
            ChangeState();
        }
    }
    function OnOuted() {
        if (key === "symbol")
            ChangeState();
    }
    function OnReleased() {
        if (releaseConditionKeySet.has(key))
            ChangeState();
        SendReleaseKey();
    }
    function OnModifierPressed() {
        if (IsModifiedBy(key))
            ModifyKeySetBy(RemoveModificationBy(key), AddModificationBy(key));
        else {
            if (oneClickModifiersKeys.has(key))
                m_oneClickModifiers[key] = key;
            ModifyKeySetBy(AddModificationBy(key), RemoveModificationBy(key));
        }
        SendKey(key);
    }
    function RepaintCapsLock() {
        var ctx = m_ui.firstChild.getContext("2d");
        ctx.beginPath();
        ctx.fillStyle = IsModifiedBy(key) ? "#3c6" : "#888";
        ctx.arc(5, 5, 2, 0, Math.PI * 2.0, true);
        ctx.fill();
        ctx.closePath();
    }
    function RepaintAlt() {
        m_element.style.border = IsModifiedBy(key) ? "solid 1px #ff0 !important" : " ";
    }
    function RepaintShift() {
        m_element.style.border = IsModifiedBy(key) ? "solid 1px #9cf !important" : " ";
    }
    Initialize();
    return m_element;
};
function ButtonData(label, text, classAttribute) {
    this.label = label;
    this.text = text;
    this.classAttribute = classAttribute;
}
var KeySet = function KeySet(name, classAttribute) {
    var specialKeysNotModifiers = new Map([
        ["tab", new ButtonData("Tab", "\t", "kl_system")],
        ["empty", new ButtonData("", "", "kl_empty")],
        ["backspace", new ButtonData("Backspace", "", "kl_system kl_system_backspace")],
        ["return", new ButtonData("Return", "", "kl_system kl_system_return")],
        ["returnUS", new ButtonData("Return", "", "kl_button kl_system kl_system_returnUS")],
        ["space", new ButtonData(" ", " ", "kl_system kl_system_space")],
        ["EOL", new ButtonData("Empty", "", "kl_empty")]
    ]);
    var m_element = null;
    function Initialize() {
        m_element = document.createElement("div");
        m_element.setAttribute("class", "kl_set");
        m_element.setAttribute("id", "kl_current_set");
        var keys = layouts[m_layout][name];
        if (!keys)
            return keys;
        if (keys.length === 1)
            keys = layouts[m_layout][keys];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var layoutElement = {};
            var parsedKey = GetParsedKeyFrom(key);
            var buttonData = GetButtonDataFrom(key, classAttribute);
            if (IsModifier(key) && !modifiersKeys.has(parsedKey))
                buttonData.classAttribute = classAttribute + " kl_modifier";
            if (key === "EOL")
                layoutElement = CreateSpacer();
            else if (key === "selector")
                layoutElement = CreateSelector();
            else
                layoutElement = new Button(parsedKey, buttonData);
            m_element.appendChild(layoutElement);
        }
    }
    function IsModifierOnce(key) {
        return key.split("[")[1] && key.split("]")[0];
    }
    function IsModifierLong(key) {
        return key.split("{")[1] && key.split("}")[0];
    }
    function IsModifier(key) {
        return IsModifierOnce(key) || IsModifierLong(key);
    }
    function GetParsedKeyFrom(key) {
        if (IsModifierOnce(key)) {
            var parsedKey = key.split("[")[1].split("]")[0];
            if (parsedKey === "shiftUS" || parsedKey === "rightshift")
                parsedKey = "shift";
            return parsedKey;
        }
        else if (IsModifierLong(key)) {
            return key.split("{")[1].split("}")[0];
        }
        else if (specialKeysNotModifiers.has(key) || key === "selector") {
            return key;
        }
        return "symbol";
    }
    function GetButtonDataFrom(key, classAttribute) {
        var buttonData = {};
        if (IsModifierOnce(key)) {
            var label = key.split("[")[1].split("]")[0];
            buttonData = new ButtonData(label, false, "kl_system kl_system_" + label);
        }
        else if (IsModifierLong(key)) {
            var label = key.split("{")[1].split("}")[0];
            buttonData = new ButtonData(label, false, "kl_system kl_system_" + label);
        }
        else if (specialKeysNotModifiers.has(key)) {
            buttonData = specialKeysNotModifiers.get(key);
        }
        else {
            buttonData = new ButtonData(key, key, classAttribute);
        }
        return buttonData;
    }
    function CreateSpacer() {
        var spacer = document.createElement("div");
        spacer.setAttribute("class", "kl_spacer");
        spacer.key = "spacer";
        return spacer;
    }
    function GetIcon(layout) {
        return "url('data:image/png;base64," + layouts[layout]["icon"] + "')";
    }
    function CreateLayoutItem(layout) {
        var item = document.createElement("div");
        item.setAttribute("class", "kl_layout_selector_option_middle");
        item.setAttribute("locale", layout);
        item.style.backgroundImage = GetImageFromLocales("language_baloon_middle");
        AddEventListener(item, "mouseover", function OnMouseOver() { item.style.backgroundImage = GetImageFromLocales("selection"); });
        AddEventListener(item, "mouseout", function OnMouseOut() { item.style.backgroundImage = GetImageFromLocales("language_baloon_middle"); });
        AddEventListener(item, "click", function OnClick() { ChangeLayout(item.getAttribute("locale")); });
        var icon = document.createElement("div");
        icon.setAttribute("class", "kl_layout_selector_icon");
        icon.style.backgroundImage = GetIcon(layout);
        item.appendChild(icon);
        var label = document.createElement("div");
        label.setAttribute("class", "kl_layout_selector_label");
        label.innerText = layouts[layout]["name"];
        item.appendChild(label);
        return item;
    }
    function CreateLayoutsList() {
        var list = document.createElement("div");
        list.setAttribute("class", "kl_layout_list_container");
        var top = document.createElement("div");
        top.setAttribute("class", "kl_layout_selector_option_top");
        top.style.backgroundImage = GetImageFromLocales("language_baloon_top");
        list.appendChild(top);
        for (var layout in layouts) {
            if (Object.prototype.hasOwnProperty.call(layouts, layout) && m_layout != layout)
                list.appendChild(CreateLayoutItem(layout));
        }
        var bottom = document.createElement("div");
        bottom.setAttribute("class", "kl_layout_selector_option_bottom");
        bottom.style.backgroundImage = GetImageFromLocales("language_baloon_bottom");
        list.appendChild(bottom);
        return list;
    }
    function CreateSelector() {
        var selector = document.createElement("div");
        selector.setAttribute("class", "kl_layout_selector kl_top_round_corners kl_bottom_round_corners");
        var button = document.createElement("div");
        button.setAttribute("class", "kl_layout_selector_icon_button");
        button.style.backgroundImage = GetIcon(m_layout);
        selector.appendChild(button);
        var label = document.createElement("div");
        label.setAttribute("class", "kl_layout_selector_label_button");
        label.innerText = layouts[m_layout]["name"];
        selector.appendChild(label);
        var list = CreateLayoutsList();
        selector.appendChild(list);
        if (Object.keys(layouts).length > 1) {
            AddEventListener(selector, "click", function OnClick() {
                var style = window.getComputedStyle(list);
                list.style.display = style.display === "none" ? "block" : "none";
                SendKey("");
            });
            AddEventListener(selector, "mouseup", SendReleaseKey);
        }
        return selector;
    }
    Initialize();
    return m_element;
};
var VirtualKeyboard = function VirtualKeyboard() {
    var m_element = null;
    var m_defaultLayout = "en";
    function CreateCloseButton() {
        var closeButton = document.createElement("div");
        closeButton.setAttribute("class", "kl_kb_close_button");
        closeButton.style.backgroundImage = GetImageFromLocales("close");
        AddEventListener(closeButton, "mouseover", function OnMouseOver() { closeButton.style.backgroundImage = GetImageFromLocales("close_hover"); });
        AddEventListener(closeButton, "mouseout", function OnMouseOut() { closeButton.style.backgroundImage = GetImageFromLocales("close"); });
        AddEventListener(closeButton, "click", function OnClose() { SendClose(0); });
        return closeButton;
    }
    function Initialize() {
        m_element = document.createElement("div");
        m_element.id = "VirtualKeyboardMac";
        m_element.setAttribute("dir", "ltr");
        m_element.setAttribute("class", "kl_keyboard");
        m_element.style.backgroundImage = GetImageFromLocales("kb_bg");
        var hook = document.createElement("div");
        hook.setAttribute("class", "kl_hook");
        hook.appendChild(CreateCloseButton());
        m_element.appendChild(hook);
        m_element.appendChild(CreateLayout(m_defaultLayout));
    }
    Initialize();
    return m_element;
};
var baseMouseX = 0;
var baseMouseY = 0;
function OnDragStart(event) {
    baseMouseX = event.clientX;
    baseMouseY = event.clientY;
    SendData({
        msg: "vk.dragStart",
        mouseX: baseMouseX,
        mouseY: baseMouseY
    });
    document.addEventListener("mouseup", OnDragEnd);
    document.addEventListener("mousemove", OnDrag);
}
var eps = 10;
function IsFastChange(prevPos, pos) {
    return pos * prevPos < 0 && Math.abs(pos - prevPos) > eps;
}
var m_locked = false;
var m_dxPrev = 0;
var m_dyPrev = 0;
function OnDrag(event) {
    if (!m_locked) {
        m_locked = true;
        var dx = Math.round(event.clientX - baseMouseX);
        var dy = Math.round(event.clientY - baseMouseY);
        if (IsFastChange(m_dxPrev, dx) || IsFastChange(m_dyPrev, dy)) {
            m_locked = false;
            return;
        }
        SendData({ msg: "vk.drag", offsetX: dx, offsetY: dy });
        m_dxPrev = dx;
        m_dyPrev = dy;
    }
}
function OnDragEnd() {
    m_dxPrev = 0;
    m_dyPrev = 0;
    SendData({ msg: "vk.dragEnd" });
    document.removeEventListener("mouseup", OnDragEnd);
    document.removeEventListener("mousemove", OnDrag);
}
function SendKey(key) {
    SendData({ msg: "vk.pressedKey", key: key });
}
function SendReleaseKey() {
    SendData({ msg: "vk.releasedKey" });
}
window.FrameObject.onInitData = function OnPopupWindowInit() {
    var keyboard = document.getElementById("VirtualKeyboardMac");
    if (keyboard === null) {
        var keyboardWrapper = document.createElement("div");
        keyboardWrapper.setAttribute("class", "kl_keyboard_wrapper");
        keyboardWrapper.appendChild(new VirtualKeyboard());
        AddEventListener(keyboardWrapper, "mousedown", OnDragStart);
        document.body.appendChild(keyboardWrapper);
        setTimeout(function SendVkCreated() {
            var vkbd = document.getElementById("VirtualKeyboardMac");
            SendData({ msg: "vk.created", width: vkbd.offsetWidth, height: vkbd.offsetHeight });
        }, 50);
    }
};
window.FrameObject.onGetData = function OnGetData() {
    m_locked = false;
};
window.FrameObject.onLocalize = function OnLocalize(locales) {
    m_locales = locales;
};
