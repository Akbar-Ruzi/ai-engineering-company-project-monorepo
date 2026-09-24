import collections from "../partialHtmls/collections.html?raw";
import search from "../partialHtmls/search.html?raw";
import transformations from "../partialHtmls/transformations.html?raw";
import validations from "../partialHtmls/validations.html?raw";
import output from "../partialHtmls/output.html?raw";

// Insert the local HTML sections before test.ts connects the controls.
document.querySelector("main")!.innerHTML =
    collections + search + transformations + validations + output;
