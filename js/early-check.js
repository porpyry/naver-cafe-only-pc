"use strict";

const g_initialHref = location.href;
const g_initialPathname = location.pathname;
const g_initialSearch = location.search;

const g_isNewCafe = g_initialPathname.startsWith("/f-e/");
