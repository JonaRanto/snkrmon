function Localize(element, value) {
    if (element)
        element.innerText = value;
}
function LocalizeAttribute(element, attribute, locale) {
    if (element) {
        var value = locale.replace("{}", "");
        element.setAttribute(attribute, value);
    }
}
function LocalizeElement(key, locales) {
    var textValue = locales[key].replace("{}", "");
    Localize(document.getElementById(key), textValue);
    var elementsByClassName = document.getElementsByClassName(key);
    for (var i = 0; i < elementsByClassName.length; ++i)
        Localize(elementsByClassName[i], textValue);
}
function InsertCssInline(cssData) {
    "use strict";
    var style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = cssData;
    document.head.appendChild(style);
}
function SetClickHandler(id, handler) {
    document.getElementById(id).addEventListener("click", handler);
}
function ChangeClassAttribute(from, to) {
    var elements = document.getElementsByClassName(from);
    while (elements.length > 0)
        elements[0].className = to;
}
