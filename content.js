function spanify(paragraph) {
    var s = paragraph.textContent;
    if (s.trim().length > 0) {
        var ss = [];
        $(s.split(/([\s'’,\.\\-\\+\\*=\\(\\)\\:\\;\\"`]+)/g)).each(function () {
            if (this.match(/[\s',\.\\-\\+\\*=\\(\\)\\:\\;\\"`]+/)) {
                ss.push(document.createTextNode(this));
            } else {
                var span = $('<span>' + this + '</span>').addClass('word');
                if ($.inArray(this.toString(), favorites) != -1) {
                    span.addClass('favorite11');
                }
                attachListeners(span[0]);
                ss.push(span[0]);
            }
        });
        $(paragraph).replaceWith($(ss));
    }
}

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if (request.method == "getSelection")
        console.log({data: window.getSelection().toString()});
    else
        console.log({});
});

function isInsideContentEditor(node) {
    while (node = node.parentNode) {
        if (node.contentEditable === "true") {
            return true;
        }
    }
    return false;
}

var favorites = [];

getItem('favorites', function (object) {
    if (object && object.favorites && object.favorites instanceof Array) {
        favorites = object.favorites;
    }
    console.log(favorites);
});

$(document).ready(function () {
    setInterval(function () {
        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        var node;
        var textNodes = [];
        while (node = walker.nextNode()) {
            if (node.textContent.length > 0 && !node.textContent.match(/^[\s'’,\.\\-\\+\\*=\\(\\)\\:\\;\\"`]+$/) &&
                (node.parentNode.tagName !== 'SPAN' || !$(node.parentNode).hasClass('word')) &&
                node.parentNode.tagName !== 'STYLE' && node.parentNode.tagName !== 'SCRIPT' &&
                node.parentNode.tagName !== 'TEXTAREA' &&
                node.parentNode.tagName !== 'BUTTON' &&
                node.parentNode.tagName !== 'PRE' &&
                node.parentNode.tagName !== 'INPUT' &&
                node.parentNode.contentEditable !== "true" && !isInsideContentEditor(node) &&
                getComputedStyle(node.parentNode)['white-space'] !== 'nowrap') {
                //console.log('Found text node: \'' + node.textContent + '\'');
                textNodes.push(node);
            }
        }

        $(textNodes).each(function () {
            spanify(this);
        });
    }, 2000);
});

function attachListeners(span) {
    $(span).hover(function (e) {
        clearTimeout(timer);
        pos = getOffsetRect(this);
        element = $(this);
        timer = setTimeout(function () {
            if (e.target.tagName == 'SPAN') {
                previousSpan = currentSpan;
                currentSpan = span;
                if (pressed) {
                    showPopup();
                }
            }
        }, 0);
    }, function (e) {
        clearTimeout(timer);
        timer = null;
        hidePopup();
    });
    $(span).click(function (e) {
        if (e.target.tagName == 'SPAN' &&
            e.target.parentNode.tagName != 'A' &&
            e.target.parentNode.parentNode.tagName != 'A' && pressed) {
            e.stopPropagation();
            e.preventDefault();
            var index = $.inArray(element.text(), favorites);
            if (index == -1) {
                favorites.push(element.text());
                element.addClass('favorite11');
            } else {
                favorites.splice(index, 1);
                element.removeClass('favorite11');
            }
            setItem('favorites', favorites);
            console.log(favorites);
        }
    });
}

function setItem(name, data) {
    chrome.extension.sendMessage({ command: 'setItem', name: name, data: data });
}

function getItem(name, callback) {
    chrome.extension.sendMessage({ command: 'getItem', name: name }, function (response) {
        callback(response);
    });
}

function getOffsetRect(elem) {
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docElem = document.documentElement;

    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;

    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) }
}

var timer;
var pos;
var element;

var voiceTimer;
var previousSpan;
var currentSpan;
function showPopup() {
    translate(element.text(), 'en', 'ru', function (response) {
        if (response.def && response.def[0] && response.def[0].ts && timer) {
            $('.tooltip11').text(response.def[0].ts);
            $('.tooltip11').css('left', pos.left + element.width() / 2 - $('.tooltip11').width() / 2 - 10)
                .css('top', pos.top - 40);
            $('.tooltip11_arrow').css('left', pos.left + element.width() / 2 - 10 + 4)
                .css('top', pos.top - 40 + 20 + $('.tooltip11').height());
            $('.tooltip11').show();
            $('.tooltip11_arrow').show();
            if (currentSpan.parentNode.tagName != 'A')
                $(currentSpan).addClass('active11');
            clearTimeout(voiceTimer);
            voiceTimer = setTimeout(function () {
                if (timer && pressed) {
                    $('<iframe></iframe>').attr({
                        src: 'https://translate.google.com/translate_tts?q=' + element.text() + '&tl=en_uk&sfsff=sfsf'
                    }).hide().appendTo(document.body);
                }
            }, 2000);
        }
    })
}

function hidePopup() {
    if (previousSpan)
        $(previousSpan).removeClass('active11');
    $(currentSpan).removeClass('active11');
    $('.tooltip11').hide();
    $('.tooltip11_arrow').hide();
}

var pressed = false;
$(document).bind('keydown', function (e) {
    if (e.keyCode == 17 || e.keyCode == 91) {
        pressed = true;
        if (timer) {
            showPopup();
        }
    }
});
$(document).bind('keyup', function (e) {
    if (e.keyCode == 17 || e.keyCode == 91) {
        pressed = false;
        if (timer) {
            hidePopup();
        }
    }
});

$('<div class="tooltip11">Tooltip</div><div class="tooltip11_arrow"></div>').appendTo(document.body);

var cache = {};
function translate(text, sl, tl, success) {
    if (cache[text]) {
        success(cache[text]);
    } else {
        $.ajax({
            url: 'https://dictionary.yandex.net/api/v1/dicservice.json/lookup',
            dataType: 'json',
            data: {
                key: 'dict.1.1.20140529T074913Z.e38dbea81d148538.6f3db42887e3685c11573236fa74642c446ba7af',
                text: text,
                lang: sl + '-' + tl
            },
            success: function (result) {
                cache[text] = result;
                success(result);
            },
            error: function (request, error, exception) {
                alert(error);
            }
        });
    }
}