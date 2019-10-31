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
var showMaskButton;

var id = 0;

var fields = new Array ();
var extract_number = new RegExp ("^([0-9]+)px$");

function getStyles(field, styles) {
    var fieldStyles = getComputedStyle(field, null);
    var results = {};
    for (let prop of styles) {
        var r = extract_number.exec(fieldStyles[prop]);
        if (r == null) {
            results[prop] = fieldStyles[prop];
        } else {
            results[prop] = Number(r[1]);
        }
    }
    return results;
}

function createMaskButton(field) {
    if (debug) console.log("creating mask button for field " + field.id);
    /* create unmask button */
    var maskbutton = document.createElement('div');
    maskbutton.classList.add('passhashplusbutton');
    /* position at the bottom right corner of password field */
    var fs = getStyles(field, [ 'display', 'width', 'height',
            'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
            'margin-top', 'margin-bottom', 'margin-left',
            'border-bottom-right-radius', 'border-top-width',
            'border-bottom-width', 'border-left-width', 'border-right-width']);
    if (fs.display == 'none') {
        // shortcircuit when field is display:none
        return maskbutton;
    }
    field.parentNode.insertBefore(maskbutton, field);
    // We get the field dimensions from the field's computed styles
    var margintop = fs.height + fs['border-top-width'] +
        fs['border-bottom-width'] + fs['padding-top'] + fs['padding-bottom'] +
        fs['margin-top'];
    maskbutton.style['margin-top'] = `${margintop}px`;
    if (debug) console.log("maskbutton.margin-top: " + maskbutton.style['margin-top']);
    var marginleft = fs.width - fs['border-bottom-right-radius'] - 30 +
        fs['border-left-width'] + fs['padding-left'] + fs['margin-left'] +
        fs['padding-right'];
    maskbutton.style['margin-left'] = `${marginleft}px`;
    if (debug) console.log("maskbutton.margin-left: " + maskbutton.style['margin-left']);
    return maskbutton;
}

function bind (f) {
    var field = f;
    /* make sure each field we care about has an id */
    if ("" == field.id) {
        field.id = "passhash_" + id++;
    }

    if (!showMaskButton || -1 != fields.indexOf(field) || field.classList.contains("nopasshash")) {
        return false;
    }
    fields[fields.length] = field;

    var masking = true;

    var maskbutton = createMaskButton(field);

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
    });

    setFieldType ();
    return true;
}

// Initialize all password fields
function initAllFields() {
    var pwfields = document.querySelectorAll("input[type=password]");
    for (let field of pwfields) {
        bind(field);
    }
}

// run on initial page content
initAllFields();

// Make sure we react to dynamically appearing elements
function onMutation (mutations, observer) {
    mutations.forEach (function(mutation) {
        for (var i = 0; i < mutation.addedNodes.length; ++i) {
            var item = mutation.addedNodes[i];
            if (item.nodeName == 'INPUT' && item.type == 'password') {
                bind(item);
            } else {
                initAllFields();
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
        showMaskButton = optres.options.showMaskButton;
    });
});
// Register for storage changes to update maskkey when necessary
browser.storage.onChanged.addListener(function (changes, areaName) {
    if ('options' in changes) {
        maskKey = changes.options.newValue.maskKey;
        if (showMaskButton !== changes.options.newValue.showMaskButton) {
            showMaskButton = changes.options.newValue.showMaskButton;
            initAllFields();
        }
        if (debug) console.log("[passwordhasherplus] mask key changed from " + changes.options.oldValue.maskKey + " to " + maskKey);
    }
});
