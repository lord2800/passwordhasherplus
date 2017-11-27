// use ports as keys, payload mostly ignored
var ports = {};
var nextportkey = 0;

function portForTag (tag) {
    var keys = Object.keys(ports);
    for (var i = 0; i < keys.length; ++i) {
        var key = keys[i];
        var port = ports[key];
        if (port.passhashUrl == tag) {
            return port;
        }
    }
    console.log("no port found");
    console.dir(ports);
    return null;
}

function forwardHash(tag, hash) {
    if (debug) console.log("[background.js:forwardHash] got hash " + hash + " for page " + tag);
    var port = portForTag(tag);
    if (debug) console.log("[background.js:forwardHash] posting to port " + port);
    if (port != null) {
        port.postMessage({ hash: hash });
    }
}

/* add connect listener so we have channel to content script */
chrome.runtime.onConnect.addListener (function (port) {
    console.assert (port.name == "passhash");
    port.onMessage.addListener (function (msg) {
        if (null != msg.init) {
            var url = grepUrl (msg.url);
            storage.loadConfig (url, (cfg) => {
                if (debug) console.log("Registering port for url " + url);
                port.passhashUrl = url;
                port.id = nextportkey;
                ports[nextportkey] = port;
                nextportkey++;
                port.postMessage ({ init: true });
            });
        } else if (null != msg.hash) {
            /*
             * We would want the following line, but this is not possible ATM
             * so we currently rely on remembering focused/clicked element,
             * context menu items and extension commands 
             */
            /*browser.pageAction.openPopup();*/
        }
    });

    port.onDisconnect.addListener (function (port) {
        if (null != port.passhashUrl) {
            if (debug) console.log("deregistering port for url "+port.passhashUrl);
            delete ports[port.id];
        }
    });
});

/* enable page action for all regular tabs */
function initTab(tab) {
    if (tab.id != browser.tabs.TAB_ID_NONE) {
        browser.pageAction.show(tab.id);
    }
}
browser.tabs.query({}).then(opentabs => {
    for (let tab of opentabs) {
        initTab(tab);
    }
});
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
    initTab(tab);
});

/* create context menu item for all editable fields */
browser.menus.create({
    id: 'open-passhash',
    title: 'Password Hasher Plus',
    /* TODO: figure out icons */
    icons: {
        "16": "images/passhash.png",
        "32": "images/passhash.png"
    },
    contexts: ["editable", "password"],
});
/* open page action when context menu is clicked */
browser.menus.onClicked.addListener((info, tab) => {
    if (info.menuItemId == "open-passhash") {
        browser.pageAction.openPopup();
    }
});
