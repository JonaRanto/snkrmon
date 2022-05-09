/*Copyright (c) 2021 ksoft http://www.dummysoftware.com*/function validateForm(){var e=document.querySelector("#interval");e.classList.remove("error");var t=e.value;return!((t=t.replace("?","")).length<1||t<1||!isNumeric(t))||(e.classList.add("error"),e.focus(),!1)}function validateRegistrationForm(){var e=document.querySelector("#txtCode"),t=e.value.trim();return e.classList.remove("error"),!(t.length<6||0==/^[a-zA-Z0-9_]+$/.test(t))||(e.classList.add("error"),e.focus(),!1)}function isNumeric(e){return!isNaN(parseFloat(e))&&isFinite(e)}function fadeIn(e){e.style.opacity=0,e.style.display="block";var t=+new Date,a=function(){e.style.opacity=+e.style.opacity+(new Date-t)/200,t=+new Date,+e.style.opacity<1&&(window.requestAnimationFrame&&requestAnimationFrame(a)||setTimeout(a,16))};a()}function fadeOut(e){var t=+new Date,a=function(){e.style.opacity=+e.style.opacity-(new Date-t)/200,t=+new Date,0<+e.style.opacity?window.requestAnimationFrame&&requestAnimationFrame(a)||setTimeout(a,16):e.style.display="none"};a()}function slide(e,t){t=t||"18px",e.classList.contains("visible")?(e.classList.remove("visible"),e.style.maxHeight="0px"):(e.classList.add("visible"),e.style.maxHeight=t)}function getDomain(e){var t=document.createElement("a");return t.href=e,t.hostname.replace("www.","")}function getRandomInt(e,t){return Math.floor(Math.random()*(t-e+1))+e}function cleanArray(e){return e=(e=e&&e.map(Function.prototype.call,String.prototype.trim))&&e.filter(function(e){return/\S/.test(e)})}function cleanUrlArray(e){var t=cleanArray(e);if(t)for(var a in t)-1==t[a].toLowerCase().indexOf("http")&&-1==t[a].toLowerCase().indexOf(":/")&&(t[a]="http://"+t[a]);return t}function cleanTimeArray(e){var t=cleanArray(e);if(t){var a=[];for(o in t){var n,r,i=t[o].match(/^((0?[0-9]|1[0-2]):([0-5][0-9])[ ]?([aApP][mM])|([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]))$/);i&&7<=i.length?(n=parseInt(i[2]||i[5]),r=i[3]||i[6],"PM"===(i=(i[4]||"").toUpperCase())&&n<12?n=parseInt(n)+12:"AM"===i&&12===n&&(n=0),0===n?n="00":n<10&&(n="0"+n),t[o]=n+":"+r):a.push(o)}for(var o=0;o<a.length;o++)t.splice(a[o]-o,1);t.sort(function(e,t){return parseInt(e.replace(":",""))-parseInt(t.replace(":",""))})}return t}function updateLastRefresh(e,t){var a=new Date,t=new Date(a.getTime()+1e3*t);return e.lastRefresh=formatDate(a,"M/d/yyyy h:mm:ss a"),e.nextRefresh=formatDate(t,"M/d/yyyy h:mm:ss a"),e}function getOptions(e){var t,a=null;return e&&(t=getDomain(e.url),(a=localStorage[t])||(t=e.url,a=localStorage[t])),(a=a?JSON.parse(a):{interval:10,refresh:!1,random:null,isDomain:!1,isCache:!1,isTimer:!1,isAllTabs:!1,isAutoClick:!1,autoClickId:null,autoClickIdValid:null,autoClickDelay:null,isAutoClickAfterRefresh:!1,isNotify:!1,notifyText:null,notifySound:null,notifyDelay:null,isNotifyNotFound:!1,isUrlList:!1,urlList:[],isTimeList:!1,timeList:[]}).notifySound=a.notifySound||"images/notification.mp3",a}function saveOptions(e,t){var a=getDomain(e.url);t.isDomain=!0,localStorage[a]||(a=e.url,t.isDomain=!1),localStorage[a]=JSON.stringify(t)}