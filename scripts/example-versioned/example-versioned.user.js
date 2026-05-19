// ==UserScript==
// @name         Example Versioned Userscript
// @namespace    https://github.com/Volturipper/Tampermonkey
// @version      0.1.0
// @description  Minimal installable userscript for workspace smoke tests.
// @match        https://example.com/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Volturipper/Tampermonkey/main/scripts/example-versioned/example-versioned.user.js
// @downloadURL  https://raw.githubusercontent.com/Volturipper/Tampermonkey/main/scripts/example-versioned/example-versioned.user.js
// ==/UserScript==

(() => {
  "use strict";

  console.info("[tampermonkey-workspace] example script loaded");
})();
