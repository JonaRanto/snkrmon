/*Copyright (c) 2021 ksoft http://www.dummysoftware.com*/var keyPressManager={tabId:null,lastSendMessageDate:null,onKeyPress:function(e){var s=10,a=new Date;3<(s=null!=keyPressManager.lastSendMessageDate?(a-keyPressManager.lastSendMessageDate)/1e3:s)&&(keyPressManager.lastSendMessageDate=a,e=e||window.event,chrome.runtime.sendMessage({tabId:keyPressManager.tabId,action:"resetInterval"}))},remove:function(){document.removeEventListener("keypress",keyPressManager.onKeyPress)},setup:function(e){keyPressManager.tabId=e,keyPressManager.remove(),document.addEventListener("keypress",keyPressManager.onKeyPress)}};