var storage;
var url;
var config;

function rehash(e) {
    var masterpw = document.getElementById('masterpw').value;
    var hash = generateHash (config, masterpw);
    // same hint algo as passhash-ng
    var master_hint = PassHashCommon.generateHashWord(
            masterpw, masterpw, 2, true, false, true, true, false);
    // generate hashword hint based on config, but length 2
    console.log("config.policy.length: "+config.policy.length);
    var hash_hint = generateHashL(config, masterpw, 2);
    document.getElementById('hashword').value = hash;
    document.getElementById('master-hint').textContent = master_hint;
    document.getElementById('hash-hint').textContent = hash_hint;
}

function writeModel () {
    config.tag = $('#tag').val ();
    if (config.tag.startsWith ("compatible:")) {
        config.tag = config.tag.substringAfter ("compatible:");
        delete config.policy.seed;
    } else {
        config.policy.seed = config.options.privateSeed;
    }
    config.policy.length = $('#length').val ();
    config.policy.strength = $('#strength').val ();
    if (config.policy.strength == -1) {
        config.policy.custom = new Object();
        config.policy.custom.d = $('#d').prop('checked');
        config.policy.custom.p = $('#p').prop('checked');
        config.policy.custom.m = $('#m').prop('checked');
        config.policy.custom.r = $('#r').prop('checked');
    } else {
        delete config.policy.custom;
    }
    if(null == config.policy.seed || config.policy.seed == config.options.privateSeed) {
        $("#syncneeded").addClass("hidden");
    }
    if (debug) console.log("[popup.js] saving config");
    storage.saveConfig(url, config, refreshPopup);
}

function readModel () {
    console.log("readModel()");
    $('#tag').val (config.tag);
    $('#length').val (config.policy.length);
    $('#strength').val (config.policy.strength);
    if (true == config.options.compatibilityMode) {
            $('div#compatmodeheader').html ("<b>Compatibility:</b> on");
    } else if (null == config.policy.seed) {
            $('#tag').val ("compatible:" + config.tag);
    }
    if (false == config.options.backedUp && false == config.options.compatibilityMode) {
            $('div#compatmodeheader').html ("<b>Warning:</b> You have not yet indicated that you have backed up your private key. Please do so on the Options page.");
    }
    if(null != config.policy.seed && config.policy.seed != config.options.privateSeed) {
            $("#syncneeded").removeClass("hidden");
    }
    if (config.policy.strength == -1) {
            console.log("custom strength: show checkboxes");
            $('#strength-requirements').removeClass('hidden');
            $('#strength-restrictions').removeClass('hidden');
            if (config.policy.custom === undefined) {
                config.policy.custom = config.options.custom;
            }
            $('#d').prop('checked', config.policy.custom.d);
            $('#p').prop('checked', config.policy.custom.p);
            $('#m').prop('checked', config.policy.custom.m);
            $('#r').prop('checked', config.policy.custom.r);
    } else {
            console.log("not custom strength: hide checkboxes");
            $('#strength-requirements').addClass('hidden');
            $('#strength-restrictions').addClass('hidden');
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

$('#bump').click (function () {
	$("#tag").val (bump ($("#tag").val ()));
	writeModel ();
});

$('#tag').on('input change', writeModel);
$('#length').change (writeModel);
$('#strength').change (writeModel)
$('#d').change(writeModel);
$('#p').change(writeModel);
$('#m').change(writeModel);
$('#r').change(writeModel);
// for hashing
$('#masterpw').on('input change', rehash);
$('#masterpw').keypress(function(e) {
    if (e.which == 13) {
        var hash = document.getElementById('hashword').value;
        if(debug) console.log("[popup.js] submitting hash '" + hash + "' to content script");
        browser.extension.getBackgroundPage().forwardHash(config.tag, hash);
        window.close();
    }
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
$('#unmask-masterpw').click(()=>{maskUnmask('masterpw')});
$('#unmask-hashword').click(()=>{maskUnmask('hashword')});

$(document).ready(function() {
    // populate popup fields
    refreshPopup();

    $('#masterpw').focus();

    $('#link-options').click(function() {
        chrome.runtime.openOptionsPage();
    });
    $('#portablePage').click(function() {
        // For compatibility with Firefox just do /page.html for URL
        chrome.tabs.create({url:'/passhashplus.html?tag=' + $('#tag').val()})
    });
})
