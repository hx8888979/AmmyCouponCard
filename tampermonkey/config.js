// Description: Tampermonkey config file 
const config ={
    header:
`// ==UserScript==
// @name         Ammy Coupon Card
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Create coupon card for Ammy's customers.
// @author       XGG
// @match        https://www.etsy.com/your/orders/sold/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @require https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.6/pdfmake.min.js
// @require https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.6/vfs_fonts.js
// @run-at document-idle
// ==/UserScript==`
}
module.exports = config;
