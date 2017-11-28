function updateFocusedField(tabid, hash) {
    browser.tabs.executeScript(tabid, {
        code: 'document.activeElement.value = "' + hash + '";'
    });
}

function forwardHash(tag, hash) {
    if (debug) console.log("[background.js:forwardHash] got hash " + hash + " for page " + tag);
    browser.tabs.query({active:true,currentWindow:true}).then(results => {
        var tab = results[0];
        updateFocusedField(tab.id, hash);
    });
}

/* enable page action for all regular tabs */
browser.tabs.query({}).then(opentabs => {
    for (let tab of opentabs) {
        browser.pageAction.show(tab.id);
    }
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
