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
var debug = false;
var maskKey;

var id = 0;

var fields = new Array ();

function bind (f) {
    var field = f;
    /* make sure each field we care about has an id */
    if ("" == field.id) {
        field.id = "passhash_" + id++;
    }

    if (-1 != fields.indexOf(field) || field.classList.contains("nopasshash")) {
        return false;
    }
    fields[fields.length] = field;

    var masking = true;

    /* create unmask button */
    var content = '<span class="passhashbutton maskbutton"/>';
    var maskbutton = document.createElement('div');
    maskbutton.classList.add('passhashbutton');
    maskbutton.innerHTML = content;
    field.parentNode.insertBefore(maskbutton, field.nextSibling);
    /* position at the bottom left corner of password field */
    var fieldBB = field.getBoundingClientRect();
    var btnBB = maskbutton.getBoundingClientRect();
    maskbutton.style['top'] = `${fieldBB.bottom-2}px`;
    maskbutton.style.left = `${fieldBB.left-2}px`;

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

    /* make button do something */
    maskbutton.addEventListener('click', toggleMasking);
    /* bind shortcut also */
    field.addEventListener('keydown', function (e) {
        var shortcut = (e.ctrlKey ? "Ctrl+" : "") + (e.shiftKey ? "Shift+" : "") + e.which;
        if (shortcut == maskKey)
            toggleMasking ();
        if (e.which == 13) {
            hidetooltip();
        }
    });

    setFieldType ();
    return true;
}

// Initialize each password field
var pwfields = document.querySelectorAll("input[type=password]");
for (let field of pwfields) {
    bind(field);
}

// Make sure we react to dynamically appearing elements
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
var observer = new MutationObserver (onMutation);
observer.observe (document, { childList: true, subtree: true });

// Grab options from storage
browser.storage.local.get('sync').then(results => {
    var area = results.sync ? browser.storage.sync : browser.storage.local;
    area.get('options').then(optres => {
        maskKey = optres.options.maskKey;
    });
});
// Register for storage changes to update maskkey when necessary
browser.storage.onChanged.addListener(function (changes, areaName) {
    if ('options' in changes) {
        maskKey = changes.options.newValue.maskKey;
        if (debug) console.log("[passwordhasherplus] mask key changed from " + changes.options.oldValue.maskKey + " to " + maskKey);
    }
});
