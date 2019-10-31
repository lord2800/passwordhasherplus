# 2.5.0

## Changed

* Revamped workflow: you do not have to enter your password in the website
  anymore.
* Reworked UI: updated design, the popup is now a Page Action instead of a
  Browser Action, and respects the browser UI style.

# 2.4.0

## Changed

* The addon now uses the WebExtensions Storage API with which settings persist.
* You can choose to use your Firefox account to synchronize settings across devices

## Added

* A new password strength option "Custom" allows you to customize hash word
  generation in compatibility mode. This should now make it possible to
  generate hash words which are identical to the old extension with any
  possible combination of flags.
* The portable page now has a button to copy the hash word to the clipboard
* The options page and popup are styled using "browser-style" to look more
  like native UI elements

# 2.3.10

## Fixed

* Fix portable page handling of compatibility mode for individual sites.

# 2.3.9

## Fixed

* Identical to 2.3.8, new patch release due to AMO issues

# 2.3.8

## Fixed

* Fix portable page to properly handle compatibility mode for individual tags
  (i.e. tags with empty seed in configuration, or tags prefixed with
  compatible: if using portable page exclusively)

# 2.3.7

## Fixed

* Code hygiene changes

# 2.3.6

## Added
* Initial release on AMO after forking from ...
* Improved Javascript code for the portable page that doesn't produce errors in the JS console
* Improved GUID generation for private key. Now uses `crypto.getRandomValues()` instead of `Math.random()`
* Fix portable page generation for Firefox
* Fix potential XSS in portable page javascript
