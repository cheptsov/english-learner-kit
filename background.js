chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.command) {
        case 'setItem':
            var data = {};
            data[request.name] = request.data;
            chrome.storage.sync.set(data);
            return true;
        case 'getItem':
            chrome.storage.sync.get(request.name, function(object) {
                sendResponse(object);
            });
            return true;
    }
});

var enabled;

function updateIcon() {
    if (enabled) {
        chrome.browserAction.setIcon({
            path: {
                '19': "graduation-cap_333333_19.png",
                '38': "graduation-cap_333333_38.png"
            }
        });
    } else {
        chrome.browserAction.setIcon({
            path: {
                '19': "graduation-cap_999999_19.png",
                '38': "graduation-cap_999999_38.png"
            }
        });
    }
}

chrome.storage.sync.get("enabled", function(object) {
    enabled = object && object.enabled;
    updateIcon();

});

chrome.browserAction.onClicked.addListener(function () {
    enabled = !enabled;
    updateIcon();
    chrome.storage.sync.set({ 'enabled': enabled }, function () {
        chrome.tabs.getSelected(null, function(tab) {
            chrome.tabs.reload(tab.id);
        });
    });
});