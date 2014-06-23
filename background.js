Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    switch (request.command) {
        case 'setItem':
            var data = {};
            data[request.name] = request.data;
            chrome.storage.sync.set(data, function() {
            });
            //localStorage.setObject(request.name, request.data);
            return true;
        case 'getItem':
            chrome.storage.sync.get(request.name, function(object) {
                sendResponse(object);
            });
            //sendResponse(localStorage.getObject(request.name));
            return true;
    }
});