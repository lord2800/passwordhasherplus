/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Password Hasher Plus
 *
 * The Initial Developer of the Original Code is Eric Woodruff.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s): (none)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
var last_focused_elem;
var debug = true;

var port = chrome.runtime.connect({name: "passhash"});

var id = 0;

var fields = new Array ();

function loadOptions(resultHandler) {
    browser.storage.local.get('sync').then(results => {
        var area = results.sync ? browser.storage.sync : browser.storage.local;
        area.get('options').then(optres => {
            resultHandler(optres.options);
        });
    });
}

function bind (f) {
    var field = f;
    if ("" == field.id) {
        field.id = "passhash_" + id++;
    }

    if (-1 != $.inArray(field, fields) || $(field).hasClass ("nopasshash")) {
        return false;
    }
    fields[fields.length] = field;

    var masking = true;

    var content = '<span class="passhashbutton maskbutton"/>';

    var maskbutton;

    /* toggle masking... maybe remove here? */
    function setFieldType () {
        if (masking) {
            field.type = "password";
            if (null != maskbutton) {
                maskbutton.innerHTML = "a";
                maskbutton.title = "Show password (Ctrl + *)";
            }
        } else {
            field.type = "text";
            if (null != maskbutton) {
                maskbutton.innerHTML = "*";
                maskbutton.title = "Mask password (Ctrl + *)";
            }
        }
    }

    function toggleMasking () {
        masking = !masking;
        setFieldType ();
    }

    function requestHash() {
        console.log("[passhashplus content-script] remembering element");
        last_focused_elem = field;
    }

    $(field).qtip ({
        content: {
            text: content
        },
        position: { my: 'top right', at: 'bottom right' },
        show: {
            event: 'focus mouseenter',
            solo: true
        },
        hide: {
            fixed: true,
            event: 'unfocus'
        },
        style: {
            classes: 'ui-tooltip-light ui-tooltip-rounded'
        },
        events: {
            visible: function (event, api) {
                if (null != maskbutton) {
                    return;
                }

                maskbutton = $(".maskbutton", api.elements.content).get (0);

                maskbutton.addEventListener ("click", toggleMasking);
                setFieldType ();
            }
        }
    });

    $(field).on('focus', function(e) {
        last_focused_elem = field;
    });

    $(field).keydown (function (e) {
        loadOptions(function(options) {
            var shortcut = (e.ctrlKey ? "Ctrl+" : "") + (e.shiftKey ? "Shift+" : "") + e.which;
            if (shortcut == options.hashKey)
                requestHash ();
            if (shortcut == options.maskKey)
                toggleMasking ();
            if (e.which == 13) {
                $(field).qtip ("hide");
            }
        });
    });

    setFieldType ();
    return true;
}

$("input[type=password]").each (function (index) {
	bind (this);
});

function onMutation (mutations, observer) {
    mutations.forEach (function(mutation) {
        for (var i = 0; i < mutation.addedNodes.length; ++i) {
            var item = mutation.addedNodes[i];
            if (item.nodeName == 'INPUT' && item.type == 'password') {
                bind(item);
            } else {
                $("input[type=password]", item).each(function (i) {
                    bind(this);
                })
            }
        }
    });
}


port.onMessage.addListener (function (msg) {
    if (null != msg.hash) {
        var elem = last_focused_elem;
        if (debug) console.log("got hash " + msg.hash + ", last focused elem: " + elem);
        if (elem != null) {
            elem.blur();
            elem.value = msg.hash;
            elem.focus();
            // flash element when we change value to give visual feedback
            var origbg = $(elem).css("background-color");
            $(elem).css({'background-color': "#ffffd5"}).delay(250).queue((next) => {
                $(elem).css({
                    'background-color': origbg,
                    'transition': 'background-color 250ms'
                });
                next();
            });
        }
    }
    if (null != msg.init) {
        var observer = new MutationObserver (onMutation);
        observer.observe (document, { childList: true, subtree: true });
        document.addEventListener("mousedown", function(evt) {
            console.log("element "+ evt.target + ", id: " + evt.target.id +" clicked");
            // remember clicked element
            last_focused_elem = evt.target;
        });
    }
});

port.postMessage ({init: true, url:location.href});
