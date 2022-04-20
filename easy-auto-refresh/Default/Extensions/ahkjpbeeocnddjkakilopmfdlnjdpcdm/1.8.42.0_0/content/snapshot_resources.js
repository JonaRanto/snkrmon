var snapshot_resources;
(function (snapshot_resources) {
    function GetUrl(path) {
        return browsersApi.runtime.getURL('snapshot_resources' + path);
    }
    snapshot_resources.GetUrl = GetUrl;
})(snapshot_resources || (snapshot_resources = {}));
