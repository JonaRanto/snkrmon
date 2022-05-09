function FactorySettings() {
    var manifest = browsersApi.runtime.getManifest();
    var browserAction = manifest.browser_action;
    this.getButton = function () {
        var icons = browserAction.default_icon;
        var firstAvailableIconId = Object.keys(icons)[0];
        var settings = {
            label: browserAction.default_title,
            iconId: "inactive",
            enabled: true,
            badgeText: "",
            badgeBackgroundColor: "000000"
        };
        return Object.freeze(settings);
    };
}
