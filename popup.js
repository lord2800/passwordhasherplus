var storage;
var url;
var config;
var debug = true;

function rehash(e) {
    var masterpw = document.getElementById('masterpw').value;
    var hash = generateHash (config, masterpw);
    // same hint algo as passhash-ng
    var master_hint = PassHashCommon.generateHashWord(
            masterpw, masterpw, 2, true, false, true, true, false);
    // generate hashword hint based on config, but length 2
    if (debug) console.log("config.policy.length: "+config.policy.length);
    var hash_hint = generateHashL(config, masterpw, 2);
    document.getElementById('hashword').value = hash;
    document.getElementById('master-hint').textContent = master_hint;
    document.getElementById('hash-hint').textContent = hash_hint;
}

function writeModel () {
    config.tag = document.getElementById('tag').value;
    if (config.tag.startsWith ("compatible:")) {
        config.tag = config.tag.substringAfter ("compatible:");
        delete config.policy.seed;
    } else {
        config.policy.seed = config.options.privateSeed;
    }
    config.policy.length = document.getElementById('length').value;
    config.policy.strength = document.getElementById('strength').value;
    if (config.policy.strength == -1) {
        config.policy.custom = new Object();
        config.policy.custom.d = document.getElementById('d').checked;
        config.policy.custom.p = document.getElementById('p').checked;
        config.policy.custom.m = document.getElementById('m').checked;
        config.policy.custom.r = document.getElementById('r').checked;
    } else {
        delete config.policy.custom;
    }
    if(null == config.policy.seed || config.policy.seed == config.options.privateSeed) {
        document.getElementById('syncneeded').classList.add("hidden");
    }
    if (debug) console.log("[popup.js] saving config");
    storage.saveConfig(url, config, refreshPopup);
}

function readModel () {
    if (debug) console.log("readModel()");
    document.getElementById('tag').value = config.tag;
    document.getElementById('length').value = config.policy.length;
    document.getElementById('strength').val = config.policy.strength;
    if (true == config.options.compatibilityMode) {
        document.getElementById('compatmodeheader').innerHTML =
            "<b>Compatibility:</b> on";
    } else if (null == config.policy.seed) {
            document.getElementById('tag').value = "compatible:" + config.tag;
    }
    if (false == config.options.backedUp && false == config.options.compatibilityMode) {
        document.getElementById('compatmodeheader').innerHTML =
            "<b>Warning:</b> You have not yet indicated that you have backed up your private key. Please do so on the Options page.";
    }
    if(null != config.policy.seed && config.policy.seed != config.options.privateSeed) {
        document.getElementById('syncneeded').classList.remove('hidden');
    }
    if (config.policy.strength == -1) {
            if (debug) console.log("custom strength: show checkboxes");
            document.getElementById('strength-requirements').classList.remove('hidden');
            if (config.policy.custom === undefined) {
                config.policy.custom = config.options.custom;
            }
            document.getElementById('d').checked = config.policy.custom.d;
            document.getElementById('p').checked = config.policy.custom.p;
            document.getElementById('m').checked = config.policy.custom.m;
            document.getElementById('r').checked = config.policy.custom.r;
    } else {
            if (debug) console.log("not custom strength: hide checkboxes");
            document.getElementById('strength-requirements').classList.add('hidden');
    }
    if (debug) console.log("[popup.js:readModel] rehashing...");
    rehash();
}

function refreshPopup() {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        url = chrome.extension.getBackgroundPage ().grepUrl (tabs[0].url);
        if (debug) console.log('loading/creating config for url='+url);
        storage.loadConfig(url, (cfg) => {
            if (debug) console.log('got config='+JSON.stringify(cfg, null, 2));
            config = cfg;
            config.fields = toSet (config.fields);
            readModel ();
        });
    });
}

document.getElementById('bump').addEventListener('click', function () {
    var tagField = document.getElementById('tag');
    tagField.value = bump (tagField.value);
    writeModel ();
});

document.getElementById('tag').addEventListener('input', writeModel);
document.getElementById('tag').addEventListener('change', writeModel);
document.getElementById('length').addEventListener('change', writeModel);
document.getElementById('strength').addEventListener('change', writeModel)
document.getElementById('d').addEventListener('change', writeModel);
document.getElementById('p').addEventListener('change', writeModel);
document.getElementById('m').addEventListener('change', writeModel);
document.getElementById('r').addEventListener('change', writeModel);
// for hashing
document.getElementById('masterpw').addEventListener('input', rehash);
document.getElementById('masterpw').addEventListener('change', rehash);
// form submit / cancel
document.getElementById('cancel').addEventListener('click', function() {
    window.close();
});
document.getElementById('hasher').addEventListener('submit', function() {
    var hash = document.getElementById('hashword').value;
    if(debug) console.log("[popup.js] submitting hash '" + hash + "' to content script");
    browser.extension.getBackgroundPage().forwardHash(config.tag, hash);
    window.close();
});

/* handle masking / unmasking of password and hash fields */
function maskUnmask(elemid) {
    var buttonid = 'unmask-'+elemid;
    var masked = document.getElementById(elemid).type == 'password';
    if (masked) {
        document.getElementById(elemid).type = 'text';
        document.getElementById(buttonid).textContent = '*';
    } else {
        document.getElementById(elemid).type = 'password';
        document.getElementById(buttonid).textContent = 'a';
    }
}

document.getElementById('unmask-masterpw').addEventListener('click',
        ()=>{maskUnmask('masterpw')});
document.getElementById('unmask-hashword').addEventListener('click',
        ()=>{maskUnmask('hashword')});

// populate popup fields
refreshPopup();

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('link-options').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
    document.getElementById('portablePage').addEventListener('click', function() {
        // For compatibility with Firefox just do /page.html for URL
        chrome.tabs.create({url:'/passhashplus.html?tag=' + document.getElementById('tag').value})
    });
});
