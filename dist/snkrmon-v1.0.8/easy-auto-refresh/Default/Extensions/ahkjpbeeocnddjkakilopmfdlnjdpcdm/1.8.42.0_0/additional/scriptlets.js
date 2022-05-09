(function(scriptletRules){
    let scriptletsFunc = [];
scriptletsFunc["abort-current-script.js"] = function(argv) {
    const target = argv && argv[0] || '';
    if ( target === '' || target === '{{1}}' ) { return; }
    const reRegexEscape = /[.*+?^${}()|[\]\\]/g;
    const needle = argv && argv[1] || '';
    const reNeedle = (( ) => {
        if ( needle === '' || needle === '{{2}}' ) { return /^/; }
        if ( /^\/.+\/$/.test(needle) ) {
            return new RegExp(needle.slice(1,-1));
        }
        return new RegExp(needle.replace(reRegexEscape, '\\$&'));
    })();
    const context = argv && argv[2] || '';
    const reContext = (( ) => {
        if ( context === '' || context === '{{3}}' ) { return /^$/; }
        if ( /^\/.+\/$/.test(context) ) {
            return new RegExp(context.slice(1,-1));
        }
        return new RegExp(context.replace(reRegexEscape, '\\$&'));
    })();
    const thisScript = document.currentScript;
    const chain = target.split('.');
    let owner = window;
    let prop;
    for (;;) {
        prop = chain.shift();
        if ( chain.length === 0 ) { break; }
        owner = owner[prop];
        if ( owner instanceof Object === false ) { return; }
    }
    let value;
    let desc = Object.getOwnPropertyDescriptor(owner, prop);
    if (
        desc instanceof Object === false ||
        desc.get instanceof Function === false
    ) {
        value = owner[prop];
        desc = undefined;
    }
    const magic = String.fromCharCode(Date.now() % 26 + 97) +
                  Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    const scriptTexts = new WeakMap();
    const getScriptText = elem => {
        let text = elem.textContent;
        if ( text.trim() !== '' ) { return text; }
        if ( scriptTexts.has(elem) ) { return scriptTexts.get(elem); }
        const [ , mime, content ] =
            /^data:([^,]*),(.+)$/.exec(elem.src.trim()) ||
            [ '', '', '' ];
        try {
            switch ( true ) {
            case mime.endsWith(';base64'):
                text = self.atob(content);
                break;
            default:
                text = self.decodeURIComponent(content);
                break;
            }
        } catch(ex) {
        }
        scriptTexts.set(elem, text);
        return text;
    };
    const validate = ( ) => {
        const e = document.currentScript;
        if ( e instanceof HTMLScriptElement === false ) { return; }
        if ( reContext.test(e.src) === false ) { return; }
        if ( e === thisScript ) { return; }
        if ( reNeedle.test(getScriptText(e)) === false ) { return; }
        throw new ReferenceError(magic);
    };
    Object.defineProperty(owner, prop, {
        get: function() {
            validate();
            return desc instanceof Object
                ? desc.get.call(owner)
                : value;
        },
        set: function(a) {
            validate();
            if ( desc instanceof Object ) {
                desc.set.call(owner, a);
            } else {
                value = a;
            }
        }
    });
    const oe = window.onerror;
    window.onerror = function(msg) {
        if ( typeof msg === 'string' && msg.includes(magic) ) {
            return true;
        }
        if ( oe instanceof Function ) {
            return oe.apply(this, arguments);
        }
    }.bind();
};

scriptletsFunc["acs.js"] = scriptletsFunc["abort-current-script.js"];

scriptletsFunc["abort-current-inline-script.js"] = scriptletsFunc["abort-current-script.js"];

scriptletsFunc["acis.js"] = scriptletsFunc["abort-current-script.js"];

scriptletsFunc["abort-on-property-read.js"] = function(argv) {
    const magic = String.fromCharCode(Date.now() % 26 + 97) +
                  Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    const abort = function() {
        throw new ReferenceError(magic);
    };
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            const desc = Object.getOwnPropertyDescriptor(owner, chain);
            if ( !desc || desc.get !== abort ) {
                Object.defineProperty(owner, chain, {
                    get: abort,
                    set: function(){}
                });
            }
            return;
        }
        const prop = chain.slice(0, pos);
        let v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v ) {
            makeProxy(v, chain);
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(owner, prop);
        if ( desc && desc.set !== undefined ) { return; }
        Object.defineProperty(owner, prop, {
            get: function() { return v; },
            set: function(a) {
                v = a;
                if ( a instanceof Object ) {
                    makeProxy(a, chain);
                }
            }
        });
    };
    const owner = window;
    let chain = argv && argv[0] || '';
    makeProxy(owner, chain);
    const oe = window.onerror;
    window.onerror = function(msg, src, line, col, error) {
        if ( typeof msg === 'string' && msg.indexOf(magic) !== -1 ) {
            return true;
        }
        if ( oe instanceof Function ) {
            return oe(msg, src, line, col, error);
        }
    }.bind();
};

scriptletsFunc["aopr.js"] = scriptletsFunc["abort-on-property-read.js"];

scriptletsFunc["abort-on-property-write.js"] = function(argv) {
    const magic = String.fromCharCode(Date.now() % 26 + 97) +
                  Math.floor(Math.random() * 982451653 + 982451653).toString(36);
    let prop = argv && argv[0] || '';
    let owner = window;
    for (;;) {
        const pos = prop.indexOf('.');
        if ( pos === -1 ) { break; }
        owner = owner[prop.slice(0, pos)];
        if ( owner instanceof Object === false ) { return; }
        prop = prop.slice(pos + 1);
    }
    delete owner[prop];
    Object.defineProperty(owner, prop, {
        set: function() {
            throw new ReferenceError(magic);
        }
    });
    const oe = window.onerror;
    window.onerror = function(msg, src, line, col, error) {
        if ( typeof msg === 'string' && msg.indexOf(magic) !== -1 ) {
            return true;
        }
        if ( oe instanceof Function ) {
            return oe(msg, src, line, col, error);
        }
    }.bind();
};

scriptletsFunc["aopw.js"] = scriptletsFunc["abort-on-property-write.js"];

scriptletsFunc["abort-on-stack-trace.js"] = function(argv) {
    let chain = argv && argv[0] || '';
    let needle = argv && argv[1] || '';
    let logLevel = argv && argv[2] || '';
    const reRegexEscape = /[.*+?^${}()|[\]\\]/g;
    if ( needle === '' || needle === '{{2}}' ) {
        needle = '^';
    } else if ( /^\/.+\/$/.test(needle) ) {
        needle = needle.slice(1,-1);
    } else {
        needle = needle.replace(reRegexEscape, '\\$&');
    }
    const reNeedle = new RegExp(needle);
    const magic = String.fromCharCode(Math.random() * 26 + 97) +
        Math.floor(
            (0.25 + Math.random() * 0.75) * Number.MAX_SAFE_INTEGER
        ).toString(36).slice(-8);
    const log = console.log.bind(console);
    const ErrorCtor = self.Error;
    const mustAbort = function(err) {
        let docURL = self.location.href;
        const pos = docURL.indexOf('#');
        if ( pos !== -1 ) {
            docURL = docURL.slice(0, pos);
        }
        const lines = [];
        for ( let line of err.stack.split(/[\n\r]+/) ) {
            if ( line.includes(magic) ) { continue; }
            line = line.trim();
            let match = /(.*?@)?(\S+)(:\d+):\d+\)?$/.exec(line);
            if ( match === null ) { continue; }
            let url = match[2];
            if ( url.startsWith('(') ) { url = url.slice(1); }
            if ( url === docURL ) {
                url = 'inlineScript';
            } else if ( url.startsWith('<anonymous>') ) {
                url = 'injectedScript';
            }
            let fn = match[1] !== undefined
                ? match[1].slice(0, -1)
                : line.slice(0, match.index).trim();
            if ( fn.startsWith('at') ) { fn = fn.slice(2).trim(); }
            let rowcol = match[3];
            lines.push(' ' + `${fn} ${url}${rowcol}:1`.trim());
        }
        lines[0] = `stackDepth:${lines.length-1}`;
        const stack = lines.join('\t');
        const r = reNeedle.test(stack);
        if (
            logLevel === '1' ||
            logLevel === '2' && r ||
            logLevel === '3' && !r
        ) {
            log(stack.replace(/\t/g, '\n'));
        }
        return r;
    };
    const makeProxy = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            let v = owner[chain];
            Object.defineProperty(owner, chain, {
                get: function() {
                    if ( mustAbort(new ErrorCtor(magic)) ) {
                        throw new ReferenceError(magic);
                    }
                    return v;
                },
                set: function(a) {
                    if ( mustAbort(new ErrorCtor(magic)) ) {
                        throw new ReferenceError(magic);
                    }
                    v = a;
                },
            });
            return;
        }
        const prop = chain.slice(0, pos);
        let v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v ) {
            makeProxy(v, chain);
            return;
        }
        const desc = Object.getOwnPropertyDescriptor(owner, prop);
        if ( desc && desc.set !== undefined ) { return; }
        Object.defineProperty(owner, prop, {
            get: function() { return v; },
            set: function(a) {
                v = a;
                if ( a instanceof Object ) {
                    makeProxy(a, chain);
                }
            }
        });
    };
    const owner = window;
    makeProxy(owner, chain);
    const oe = window.onerror;
    window.onerror = function(msg, src, line, col, error) {
        if ( typeof msg === 'string' && msg.indexOf(magic) !== -1 ) {
            return true;
        }
        if ( oe instanceof Function ) {
            return oe(msg, src, line, col, error);
        }
    }.bind();
};

scriptletsFunc["aost.js"] = scriptletsFunc["abort-on-stack-trace.js"];

scriptletsFunc["addEventListener-defuser.js"] = function(argv) {
    let needle1 = argv && argv[0] || '';
    if ( needle1 === '' || needle1 === '{{1}}' ) {
        needle1 = '.?';
    } else if ( /^\/.+\/$/.test(needle1) ) {
        needle1 = needle1.slice(1,-1);
    } else {
        needle1 = needle1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    needle1 = new RegExp(needle1);
    let needle2 = argv && argv[1] || '';
    if ( needle2 === '' || needle2 === '{{2}}' ) {
        needle2 = '.?';
    } else if ( /^\/.+\/$/.test(needle2) ) {
        needle2 = needle2.slice(1,-1);
    } else {
        needle2 = needle2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    needle2 = new RegExp(needle2);
    self.EventTarget.prototype.addEventListener = new Proxy(
        self.EventTarget.prototype.addEventListener,
        {
            apply: function(target, thisArg, args) {
                let type, handler;
                try {
                    type = String(args[0]);
                    handler = String(args[1]);
                } catch(ex) {
                }
                if (
                    needle1.test(type) === false ||
                    needle2.test(handler) === false
                ) {
                    return target.apply(thisArg, args);
                }
            }
        }
    );
};

scriptletsFunc["aeld.js"] = scriptletsFunc["addEventListener-defuser.js"];

scriptletsFunc["addEventListener-logger.js"] = function(argv) {
    const log = console.log.bind(console);
    self.EventTarget.prototype.addEventListener = new Proxy(
        self.EventTarget.prototype.addEventListener,
        {
            apply: function(target, thisArg, args) {
                let type, handler;
                try {
                    type = String(args[0]);
                    handler = String(args[1]);
                } catch(ex) {
                }
                log('uBO: addEventListener("%s", %s)', type, handler);
                return target.apply(thisArg, args);
            }
        }
    );
};

scriptletsFunc["aell.js"] = scriptletsFunc["addEventListener-logger.js"];

scriptletsFunc["json-prune.js"] = function(argv) {
    const rawPrunePaths = argv && argv[0] || '';
    const rawNeedlePaths = argv && argv[1] || '';
    const prunePaths = rawPrunePaths !== '{{1}}' && rawPrunePaths !== ''
        ? rawPrunePaths.split(/ +/)
        : [];
    let needlePaths;
    let log, reLogNeedle;
    if ( prunePaths.length !== 0 ) {
        needlePaths = prunePaths.length !== 0 &&
                      rawNeedlePaths !== '{{2}}' && rawNeedlePaths !== ''
            ? rawNeedlePaths.split(/ +/)
            : [];
    } else {
        log = console.log.bind(console);
        let needle;
        if ( rawNeedlePaths === '' || rawNeedlePaths === '{{2}}' ) {
            needle = '.?';
        } else if ( rawNeedlePaths.charAt(0) === '/' && rawNeedlePaths.slice(-1) === '/' ) {
            needle = rawNeedlePaths.slice(1, -1);
        } else {
            needle = rawNeedlePaths.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        reLogNeedle = new RegExp(needle);
    }
    const findOwner = function(root, path, prune = false) {
        let owner = root;
        let chain = path;
        for (;;) {
            if ( typeof owner !== 'object' || owner === null  ) {
                return false;
            }
            const pos = chain.indexOf('.');
            if ( pos === -1 ) {
                if ( prune === false ) {
                    return owner.hasOwnProperty(chain);
                }
                if ( chain === '*' ) {
                    for ( const key in owner ) {
                        if ( owner.hasOwnProperty(key) === false ) { continue; }
                        delete owner[key];
                    }
                } else if ( owner.hasOwnProperty(chain) ) {
                    delete owner[chain];
                }
                return true;
            }
            const prop = chain.slice(0, pos);
            if (
                prop === '[]' && Array.isArray(owner) ||
                prop === '*' && owner instanceof Object
            ) {
                const next = chain.slice(pos + 1);
                let found = false;
                for ( const key of Object.keys(owner) ) {
                    found = findOwner(owner[key], next, prune) || found;
                }
                return found;
            }
            if ( owner.hasOwnProperty(prop) === false ) { return false; }
            owner = owner[prop];
            chain = chain.slice(pos + 1);
        }
    };
    const mustProcess = function(root) {
        for ( const needlePath of needlePaths ) {
            if ( findOwner(root, needlePath) === false ) {
                return false;
            }
        }
        return true;
    };
    const pruner = function(o) {
        if ( log !== undefined ) {
            const json = JSON.stringify(o, null, 2);
            if ( reLogNeedle.test(json) ) {
                log('uBO:', location.hostname, json);
            }
            return o;
        }
        if ( mustProcess(o) === false ) { return o; }
        for ( const path of prunePaths ) {
            findOwner(o, path, true);
        }
        return o;
    };
    JSON.parse = new Proxy(JSON.parse, {
        apply: function() {
            return pruner(Reflect.apply(...arguments));
        },
    });
    Response.prototype.json = new Proxy(Response.prototype.json, {
        apply: function() {
            return Reflect.apply(...arguments).then(o => pruner(o));
        },
    });
};

scriptletsFunc["nano-setInterval-booster.js"] = function(argv) {
    let needleArg = argv && argv[0] || '';
    if ( needleArg === '{{1}}' ) { needleArg = ''; }
    let delayArg = argv && argv[1] || '';
    if ( delayArg === '{{2}}' ) { delayArg = ''; }
    let boostArg = argv && argv[2] || '';
    if ( boostArg === '{{3}}' ) { boostArg = ''; }
    if ( needleArg === '' ) {
        needleArg = '.?';
    } else if ( needleArg.charAt(0) === '/' && needleArg.slice(-1) === '/' ) {
        needleArg = needleArg.slice(1, -1);
    } else {
        needleArg = needleArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const reNeedle = new RegExp(needleArg);
    let delay = delayArg !== '*' ? parseInt(delayArg, 10) : -1;
    if ( isNaN(delay) || isFinite(delay) === false ) { delay = 1000; }
    let boost = parseFloat(boostArg);
    boost = isNaN(boost) === false && isFinite(boost)
        ? Math.min(Math.max(boost, 0.02), 50)
        : 0.05;
    self.setInterval = new Proxy(self.setInterval, {
        apply: function(target, thisArg, args) {
            const [ a, b ] = args;
            if (
                (delay === -1 || b === delay) &&
                reNeedle.test(a.toString())
            ) {
                args[1] = b * boost;
            }
            return target.apply(thisArg, args);
        }
    });
};

scriptletsFunc["nano-sib.js"] = scriptletsFunc["nano-setInterval-booster.js"];

scriptletsFunc["nano-setTimeout-booster.js"] = function(argv) {
    let needleArg = argv && argv[0] || '';
    if ( needleArg === '{{1}}' ) { needleArg = ''; }
    let delayArg = argv && argv[1] || '';
    if ( delayArg === '{{2}}' ) { delayArg = ''; }
    let boostArg = argv && argv[2] || '';
    if ( boostArg === '{{3}}' ) { boostArg = ''; }
    if ( needleArg === '' ) {
        needleArg = '.?';
    } else if ( needleArg.charAt(0) === '/' && needleArg.slice(-1) === '/' ) {
        needleArg = needleArg.slice(1, -1);
    } else {
        needleArg = needleArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const reNeedle = new RegExp(needleArg);
    let delay = delayArg !== '*' ? parseInt(delayArg, 10) : -1;
    if ( isNaN(delay) || isFinite(delay) === false ) { delay = 1000; }
    let boost = parseFloat(boostArg);
    boost = isNaN(boost) === false && isFinite(boost)
        ? Math.min(Math.max(boost, 0.02), 50)
        : 0.05;
    self.setTimeout = new Proxy(self.setTimeout, {
        apply: function(target, thisArg, args) {
            const [ a, b ] = args;
            if (
                (delay === -1 || b === delay) &&
                reNeedle.test(a.toString())
            ) {
                args[1] = b * boost;
            }
            return target.apply(thisArg, args);
        }
    });
};

scriptletsFunc["nano-stb.js"] = scriptletsFunc["nano-setTimeout-booster.js"];

scriptletsFunc["noeval-if.js"] = function(argv) {
    let needle = argv && argv[0] || '';
    if ( needle === '' || needle === '{{1}}' ) {
        needle = '.?';
    } else if ( needle.slice(0,1) === '/' && needle.slice(-1) === '/' ) {
        needle = needle.slice(1,-1);
    } else {
        needle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    needle = new RegExp(needle);
    window.eval = new Proxy(window.eval, {          
        apply: function(target, thisArg, args) {
            const a = args[0];
            if ( needle.test(a.toString()) === false ) {
                return target.apply(thisArg, args);
            }
        }
    });
};

scriptletsFunc["no-fetch-if.js"] = function(argv) {
    let arg1 = argv && argv[0] || '';
    if ( arg1 === '{{1}}' ) { arg1 = ''; }
    const needles = [];
    for ( const condition of arg1.split(/\s+/) ) {
        if ( condition === '' ) { continue; }
        const pos = condition.indexOf(':');
        let key, value;
        if ( pos !== -1 ) {
            key = condition.slice(0, pos);
            value = condition.slice(pos + 1);
        } else {
            key = 'url';
            value = condition;
        }
        if ( value === '' ) {
            value = '^';
        } else if ( value.startsWith('/') && value.endsWith('/') ) {
            value = value.slice(1, -1);
        } else {
            value = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        needles.push({ key, re: new RegExp(value) });
    }
    const log = needles.length === 0 ? console.log.bind(console) : undefined;
    self.fetch = new Proxy(self.fetch, {
        apply: function(target, thisArg, args) {
            let proceed = true;
            try {
                let details;
                if ( args[0] instanceof self.Request ) {
                    details = args[0];
                } else {
                    details = Object.assign({ url: args[0] }, args[1]);
                }
                const props = new Map();
                for ( const prop in details ) {
                    let v = details[prop];
                    if ( typeof v !== 'string' ) {
                        try { v = JSON.stringify(v); }
                        catch(ex) { }
                    }
                    if ( typeof v !== 'string' ) { continue; }
                    props.set(prop, v);
                }
                if ( log !== undefined ) {
                    const out = Array.from(props)
                                     .map(a => `${a[0]}:${a[1]}`)
                                     .join(' ');
                    log(`uBO: fetch(${out})`);
                }
                proceed = needles.length === 0;
                for ( const { key, re } of needles ) {
                    if (
                        props.has(key) === false ||
                        re.test(props.get(key)) === false
                    ) {
                        proceed = true;
                        break;
                    }
                }
            } catch(ex) {
            }
            return proceed
                ? Reflect.apply(target, thisArg, args)
                : Promise.resolve(new Response());
        }
    });
};

scriptletsFunc["no-floc.js"] = function(argv) {
    if ( Document instanceof Object === false ) { return; }
    if ( Document.prototype.interestCohort instanceof Function === false ) {
        return;
    }
    Document.prototype.interestCohort = new Proxy(
        Document.prototype.interestCohort,
        {
            apply: function() {
                return Promise.reject();
            }
        }
    );
};

scriptletsFunc["remove-attr.js"] = function(argv) {
    const token = argv && argv[0] || '';
    if ( token === '' || token === '{{1}}' ) { return; }
    const tokens = token.split(/\s*\|\s*/);
    let selector = argv && argv[1] || '';
    if ( selector === '' || selector === '{{2}}' ) {
        selector = `[${tokens.join('],[')}]`;
    }
    let behavior = argv && argv[2] || '';
    let timer;
    const rmattr = ( ) => {
        timer = undefined;
        try {
            const nodes = document.querySelectorAll(selector);
            for ( const node of nodes ) {
                for ( const attr of tokens ) {
                    node.removeAttribute(attr);
                }
            }
        } catch(ex) {
        }
    };
    const mutationHandler = mutations => {
        if ( timer !== undefined ) { return; }
        let skip = true;
        for ( let i = 0; i < mutations.length && skip; i++ ) {
            const { type, addedNodes, removedNodes } = mutations[i];
            if ( type === 'attributes' ) { skip = false; }
            for ( let j = 0; j < addedNodes.length && skip; j++ ) {
                if ( addedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
            for ( let j = 0; j < removedNodes.length && skip; j++ ) {
                if ( removedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
        }
        if ( skip ) { return; }
        timer = self.requestIdleCallback(rmattr, { timeout: 17 });
    };
    const start = ( ) => {
        rmattr();
        if ( /\bstay\b/.test(behavior) === false ) { return; }
        const observer = new MutationObserver(mutationHandler);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: tokens,
            childList: true,
            subtree: true,
        });
    };
    if ( document.readyState !== 'complete' && /\bcomplete\b/.test(behavior) ) {
        self.addEventListener('load', start, { once: true });
    } else if ( document.readyState !== 'loading' || /\basap\b/.test(behavior) ) {
        start();
    } else {
        self.addEventListener('DOMContentLoaded', start, { once: true });
    }
};

scriptletsFunc["ra.js"] = scriptletsFunc["remove-attr.js"];

scriptletsFunc["remove-class.js"] = function(argv) {
    const token = argv && argv[0] || '';
    if ( token === '' || token === '{{1}}' ) { return; }
    const tokens = token.split(/\s*\|\s*/);
    let selector = argv && argv[1] || '';
    if ( selector === '' || selector === '{{2}}' ) {
        selector = '.' + tokens.map(a => CSS.escape(a)).join(',.');
    }
    let behavior = argv && argv[2] || '';
    let timer;
    const rmclass = function() {
        timer = undefined;
        try {
            const nodes = document.querySelectorAll(selector);
            for ( const node of nodes ) {
                node.classList.remove(...tokens);
            }
        } catch(ex) {
        }
    };
    const mutationHandler = mutations => {
        if ( timer !== undefined ) { return; }
        let skip = true;
        for ( let i = 0; i < mutations.length && skip; i++ ) {
            const { type, addedNodes, removedNodes } = mutations[i];
            if ( type === 'attributes' ) { skip = false; }
            for ( let j = 0; j < addedNodes.length && skip; j++ ) {
                if ( addedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
            for ( let j = 0; j < removedNodes.length && skip; j++ ) {
                if ( removedNodes[j].nodeType === 1 ) { skip = false; break; }
            }
        }
        if ( skip ) { return; }
        timer = self.requestIdleCallback(rmclass, { timeout: 67 });
    };
    const start = ( ) => {
        rmclass();
        if ( /\bstay\b/.test(behavior) === false ) { return; }
        const observer = new MutationObserver(mutationHandler);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: [ 'class' ],
            childList: true,
            subtree: true,
        });
    };
    if ( document.readyState !== 'complete' && /\bcomplete\b/.test(behavior) ) {
        self.addEventListener('load', start, { once: true });
    } else if ( document.readyState === 'loading' ) {
        self.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
};

scriptletsFunc["rc.js"] = scriptletsFunc["remove-class.js"];

scriptletsFunc["no-requestAnimationFrame-if.js"] = function(argv) {
    let needle = argv && argv[0] || '';
    if ( needle === '{{1}}' ) { needle = ''; }
    const needleNot = needle.charAt(0) === '!';
    if ( needleNot ) { needle = needle.slice(1); }
    if ( needle.startsWith('/') && needle.endsWith('/') ) {
        needle = needle.slice(1, -1);
    } else if ( needle !== '' ) {
        needle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const log = needleNot === false && needle === '' ? console.log : undefined;
    const reNeedle = new RegExp(needle);
    window.requestAnimationFrame = new Proxy(window.requestAnimationFrame, {
        apply: function(target, thisArg, args) {
            const a = String(args[0]);
            let defuse = false;
            if ( log !== undefined ) {
                log('uBO: requestAnimationFrame("%s")', a);
            } else {
                defuse = reNeedle.test(a) !== needleNot;
            }
            if ( defuse ) {
                args[0] = function(){};
            }
            return target.apply(thisArg, args);
        }
    });
};

scriptletsFunc["norafif.js"] = scriptletsFunc["no-requestAnimationFrame-if.js"];

scriptletsFunc["set-constant.js"] = function(argv) {
    const chain = argv && argv[0] || '';
    let cValue = argv && argv[1] || '';
    const thisScript = document.currentScript;
    if ( cValue === 'undefined' ) {
        cValue = undefined;
    } else if ( cValue === 'false' ) {
        cValue = false;
    } else if ( cValue === 'true' ) {
        cValue = true;
    } else if ( cValue === 'null' ) {
        cValue = null;
    } else if ( cValue === "''" ) {
        cValue = '';
    } else if ( cValue === '[]' ) {
        cValue = [];
    } else if ( cValue === '{}' ) {
        cValue = {};
    } else if ( cValue === 'noopFunc' ) {
        cValue = function(){};
    } else if ( cValue === 'trueFunc' ) {
        cValue = function(){ return true; };
    } else if ( cValue === 'falseFunc' ) {
        cValue = function(){ return false; };
    } else if ( /^\d+$/.test(cValue) ) {
        cValue = parseFloat(cValue);
        if ( isNaN(cValue) ) { return; }
        if ( Math.abs(cValue) > 0x7FFF ) { return; }
    } else {
        return;
    }
    let aborted = false;
    const mustAbort = function(v) {
        if ( aborted ) { return true; }
        aborted =
            (v !== undefined && v !== null) &&
            (cValue !== undefined && cValue !== null) &&
            (typeof v !== typeof cValue);
        return aborted;
    };
    const trapProp = function(owner, prop, configurable, handler) {
        if ( handler.init(owner[prop]) === false ) { return; }
        const odesc = Object.getOwnPropertyDescriptor(owner, prop);
        let prevGetter, prevSetter;
        if ( odesc instanceof Object ) {
            owner[prop] = cValue;
            if ( odesc.get instanceof Function ) {
                prevGetter = odesc.get;
            }
            if ( odesc.set instanceof Function ) {
                prevSetter = odesc.set;
            }
        }
        try {
            Object.defineProperty(owner, prop, {
                configurable,
                get() {
                    if ( prevGetter !== undefined ) {
                        prevGetter();
                    }
                    return handler.getter(); 
                },
                set(a) {
                    if ( prevSetter !== undefined ) {
                        prevSetter(a);
                    }
                    handler.setter(a);
                }
            });
        } catch(ex) {
        }
    };
    const trapChain = function(owner, chain) {
        const pos = chain.indexOf('.');
        if ( pos === -1 ) {
            trapProp(owner, chain, false, {
                v: undefined,
                init: function(v) {
                    if ( mustAbort(v) ) { return false; }
                    this.v = v;
                    return true;
                },
                getter: function() {
                    return document.currentScript === thisScript
                        ? this.v
                        : cValue;
                },
                setter: function(a) {
                    if ( mustAbort(a) === false ) { return; }
                    cValue = a;
                }
            });
            return;
        }
        const prop = chain.slice(0, pos);
        const v = owner[prop];
        chain = chain.slice(pos + 1);
        if ( v instanceof Object || typeof v === 'object' && v !== null ) {
            trapChain(v, chain);
            return;
        }
        trapProp(owner, prop, true, {
            v: undefined,
            init: function(v) {
                this.v = v;
                return true;
            },
            getter: function() {
                return this.v;
            },
            setter: function(a) {
                this.v = a;
                if ( a instanceof Object ) {
                    trapChain(a, chain);
                }
            }
        });
    };
    trapChain(window, chain);
};

scriptletsFunc["set.js"] = scriptletsFunc["set-constant.js"];

scriptletsFunc["no-setInterval-if.js"] = function(argv) {
    let needle = argv && argv[0] || '';
    const needleNot = needle.charAt(0) === '!';
    if ( needleNot ) { needle = needle.slice(1); }
    let delay = argv && argv[1] || '';
    if ( delay === '{{2}}' ) { delay = undefined; }
    let delayNot = false;
    if ( delay !== undefined ) {
        delayNot = delay.charAt(0) === '!';
        if ( delayNot ) { delay = delay.slice(1); }
        delay = parseInt(delay, 10);
    }
    if ( needle === '' || needle === '{{1}}' ) {
        needle = '';
    } else if ( needle.startsWith('/') && needle.endsWith('/') ) {
        needle = needle.slice(1,-1);
    } else {
        needle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const log = needleNot === false && needle === '' && delay === undefined
        ? console.log
        : undefined;
    const reNeedle = new RegExp(needle);
    window.setInterval = new Proxy(window.setInterval, {
        apply: function(target, thisArg, args) {
            const a = String(args[0]);
            const b = args[1];
            if ( log !== undefined ) {
                log('uBO: setInterval("%s", %s)', a, b);
            } else {
                let defuse;
                if ( needle !== '' ) {
                    defuse = reNeedle.test(a) !== needleNot;
                }
                if ( defuse !== false && delay !== undefined ) {
                    defuse = (b === delay || isNaN(b) && isNaN(delay) ) !== delayNot;
                }
                if ( defuse ) {
                    args[0] = function(){};
                }
            }
            return target.apply(thisArg, args);
        }
    });
};

scriptletsFunc["nosiif.js"] = scriptletsFunc["no-setInterval-if.js"];

scriptletsFunc["no-setTimeout-if.js"] = function(argv) {
    let needle = argv && argv[0] || '';
    const needleNot = needle.charAt(0) === '!';
    if ( needleNot ) { needle = needle.slice(1); }
    let delay = argv && argv[1] || '';
    if ( delay === '{{2}}' ) { delay = undefined; }
    let delayNot = false;
    if ( delay !== undefined ) {
        delayNot = delay.charAt(0) === '!';
        if ( delayNot ) { delay = delay.slice(1); }
        delay = parseInt(delay, 10);
    }
    if ( needle === '' || needle === '{{1}}' ) {
        needle = '';
    } else if ( needle.startsWith('/') && needle.endsWith('/') ) {
        needle = needle.slice(1,-1);
    } else {
        needle = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const log = needleNot === false && needle === '' && delay === undefined
        ? console.log
        : undefined;
    const reNeedle = new RegExp(needle);
    window.setTimeout = new Proxy(window.setTimeout, {
        apply: function(target, thisArg, args) {
            const a = String(args[0]);
            const b = args[1];
            if ( log !== undefined ) {
                log('uBO: setTimeout("%s", %s)', a, b);
            } else {
                let defuse;
                if ( needle !== '' ) {
                    defuse = reNeedle.test(a) !== needleNot;
                }
                if ( defuse !== false && delay !== undefined ) {
                    defuse = (b === delay || isNaN(b) && isNaN(delay) ) !== delayNot;
                }
                if ( defuse ) {
                    args[0] = function(){};
                }
            }
            return target.apply(thisArg, args);
        }
    });
};

scriptletsFunc["nostif.js"] = scriptletsFunc["no-setTimeout-if.js"];

scriptletsFunc["setTimeout-defuser.js"] = scriptletsFunc["no-setTimeout-if.js"];

scriptletsFunc["webrtc-if.js"] = function(argv) {
    let good = argv && argv[0] || '';
    if ( good.startsWith('/') && good.endsWith('/') ) {
        good = good.slice(1, -1);
    } else {
        good = good.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    let reGood;
    try {
        reGood = new RegExp(good);
    } catch(ex) {
        return;
    }
    const rtcName = window.RTCPeerConnection
        ? 'RTCPeerConnection'
        : (window.webkitRTCPeerConnection ? 'webkitRTCPeerConnection' : '');
    if ( rtcName === '' ) { return; }
    const log = console.log.bind(console);
    const neuteredPeerConnections = new WeakSet();
    const isGoodConfig = function(instance, config) {
        if ( neuteredPeerConnections.has(instance) ) { return false; }
        if ( config instanceof Object === false ) { return true; }
        if ( Array.isArray(config.iceServers) === false ) { return true; }
        for ( const server of config.iceServers ) {
            const urls = typeof server.urls === 'string'
                ? [ server.urls ]
                : server.urls;
            if ( Array.isArray(urls) ) {
                for ( const url of urls ) {
                    if ( reGood.test(url) ) { return true; }
                }
            }
            if ( typeof server.username === 'string' ) {
                if ( reGood.test(server.username) ) { return true; }
            }
            if ( typeof server.credential === 'string' ) {
                if ( reGood.test(server.credential) ) { return true; }
            }
        }
        neuteredPeerConnections.add(instance);
        return false;
    };
    const peerConnectionCtor = window[rtcName];
    const peerConnectionProto = peerConnectionCtor.prototype;
    peerConnectionProto.createDataChannel =
        new Proxy(peerConnectionProto.createDataChannel, {
            apply: function(target, thisArg, args) {
                if ( isGoodConfig(target, args[1]) === false ) {
                    log('uBO:', args[1]);
                    return Reflect.apply(target, thisArg, args.slice(0, 1));
                }
                return Reflect.apply(target, thisArg, args);
            },
        });
    window[rtcName] =
        new Proxy(peerConnectionCtor, {
            construct: function(target, args) {
                if ( isGoodConfig(target, args[0]) === false ) {
                    log('uBO:', args[0]);
                    return Reflect.construct(target);
                }
                return Reflect.construct(target, args);
            }
        });
};

scriptletsFunc["no-xhr-if.js"] = function(argv) {
    const xhrInstances = new WeakMap();
    let arg1 = argv && argv[0] || '';
    if ( arg1 === '{{1}}' ) { arg1 = ''; }
    const needles = [];
    for ( const condition of arg1.split(/\s+/) ) {
        if ( condition === '' ) { continue; }
        const pos = condition.indexOf(':');
        let key, value;
        if ( pos !== -1 ) {
            key = condition.slice(0, pos);
            value = condition.slice(pos + 1);
        } else {
            key = 'url';
            value = condition;
        }
        if ( value === '' ) {
            value = '^';
        } else if ( value.startsWith('/') && value.endsWith('/') ) {
            value = value.slice(1, -1);
        } else {
            value = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
        needles.push({ key, re: new RegExp(value) });
    }
    const log = needles.length === 0 ? console.log.bind(console) : undefined;
    self.XMLHttpRequest = class extends self.XMLHttpRequest {
        open(...args) {
            if ( log !== undefined ) {
                log(`uBO: xhr.open(${args.join(', ')})`);
            } else {
                const argNames = [ 'method', 'url' ];
                const haystack = new Map();
                for ( let i = 0; i < args.length && i < argNames.length; i++  ) {
                    haystack.set(argNames[i], args[i]);
                }
                if ( haystack.size !== 0 ) {
                    let matches = true;
                    for ( const { key, re } of needles ) {
                        matches = re.test(haystack.get(key) || '');
                        if ( matches === false ) { break; }
                    }
                    if ( matches ) {
                        xhrInstances.set(this, haystack);
                    }
                }
            }
            return super.open(...args);
        }
        send(...args) {
            const haystack = xhrInstances.get(this);
            if ( haystack === undefined ) {
                return super.send(...args);
            }
            Object.defineProperties(this, {
                readyState: { value: 4, writable: false },
                response: { value: '', writable: false },
                responseText: { value: '', writable: false },
                responseURL: { value: haystack.get('url'), writable: false },
                responseXML: { value: '', writable: false },
                status: { value: 200, writable: false },
                statusText: { value: 'OK', writable: false },
            });
            if ( this.onreadystatechange !== null ) {
                setTimeout(( ) => {
                    const ev = new Event('readystatechange');
                    this.onreadystatechange.call(this, ev);
                }, 1);
            }
            if ( this.onload !== null ) {
                setTimeout(( ) => {
                    const ev = new Event('load');
                    this.onload.call(this, ev);
                }, 1);
            }
        }
    };
};

scriptletsFunc["window.name-defuser"] = function(argv) {
    if ( window === window.top ) {
        window.name = '';
    }
};

scriptletsFunc["overlay-buster.js"] = function(argv) {
    if ( window !== window.top ) {
        return;
    }
    var tstart;
    var ttl = 30000;
    var delay = 0;
    var delayStep = 50;
    var buster = function() {
        var docEl = document.documentElement,
            bodyEl = document.body,
            vw = Math.min(docEl.clientWidth, window.innerWidth),
            vh = Math.min(docEl.clientHeight, window.innerHeight),
            tol = Math.min(vw, vh) * 0.05,
            el = document.elementFromPoint(vw/2, vh/2),
            style, rect;
        for (;;) {
            if ( el === null || el.parentNode === null || el === bodyEl ) {
                break;
            }
            style = window.getComputedStyle(el);
            if ( parseInt(style.zIndex, 10) >= 1000 || style.position === 'fixed' ) {
                rect = el.getBoundingClientRect();
                if ( rect.left <= tol && rect.top <= tol && (vw - rect.right) <= tol && (vh - rect.bottom) < tol ) {
                    el.parentNode.removeChild(el);
                    tstart = Date.now();
                    el = document.elementFromPoint(vw/2, vh/2);
                    bodyEl.style.setProperty('overflow', 'auto', 'important');
                    docEl.style.setProperty('overflow', 'auto', 'important');
                    continue;
                }
            }
            el = el.parentNode;
        }
        if ( (Date.now() - tstart) < ttl ) {
            delay = Math.min(delay + delayStep, 1000);
            setTimeout(buster, delay);
        }
    };
    var domReady = function(ev) {
        if ( ev ) {
            document.removeEventListener(ev.type, domReady);
        }
        tstart = Date.now();
        setTimeout(buster, delay);
    };
    if ( document.readyState === 'loading' ) {
        document.addEventListener('DOMContentLoaded', domReady);
    } else {
        domReady();
    }
};

scriptletsFunc["alert-buster.js"] = function(argv) {
    window.alert = function(a) {
        console.info(a);
    };
};

scriptletsFunc["gpt-defuser.js"] = function(argv) {
    const noopfn = function() {
    };
    let props = '_resetGPT resetGPT resetAndLoadGPTRecovery _resetAndLoadGPTRecovery setupGPT setupGPTuo';
    props = props.split(/\s+/);
    while ( props.length ) {
        var prop = props.pop();
        if ( typeof window[prop] === 'function' ) {
            window[prop] = noopfn;
        } else {
            Object.defineProperty(window, prop, {
                get: function() { return noopfn; },
                set: noopfn
            });
        }
    }
};

scriptletsFunc["nowebrtc.js"] = function(argv) {
    var rtcName = window.RTCPeerConnection ? 'RTCPeerConnection' : (
        window.webkitRTCPeerConnection ? 'webkitRTCPeerConnection' : ''
    );
    if ( rtcName === '' ) { return; }
    var log = console.log.bind(console);
    var pc = function(cfg) {
        log('Document tried to create an RTCPeerConnection: %o', cfg);
    };
    const noop = function() {
    };
    pc.prototype = {
        close: noop,
        createDataChannel: noop,
        createOffer: noop,
        setRemoteDescription: noop,
        toString: function() {
            return '[object RTCPeerConnection]';
        }
    };
    var z = window[rtcName];
    window[rtcName] = pc.bind(window);
    if ( z.prototype ) {
        z.prototype.createDataChannel = function() {
            return {
                close: function() {},
                send: function() {}
            };
        }.bind(null);
    }
};

scriptletsFunc["golem.de.js"] = function(argv) {
    const rael = window.addEventListener;
    window.addEventListener = function(a, b) {
        rael(...arguments);
        let haystack;
        try {
            haystack = b.toString();
        } catch(ex) {
        }
        if (
            typeof haystack === 'string' &&
            /^\s*function\s*\(\)\s*\{\s*window\.clearTimeout\(r\)\s*\}\s*$/.test(haystack)
        ) {
            b();
        }
    }.bind(window);
};

scriptletsFunc["upmanager-defuser.js"] = function(argv) {
    var onerror = window.onerror;
    window.onerror = function(msg, source, lineno, colno, error) {
        if ( typeof msg === 'string' && msg.indexOf('upManager') !== -1 ) {
            return true;
        }
        if ( onerror instanceof Function ) {
            onerror.call(window, msg, source, lineno, colno, error);
        }
    };
    Object.defineProperty(window, 'upManager', { value: function() {} });
};

scriptletsFunc["smartadserver.com.js"] = function(argv) {
    Object.defineProperties(window, {
        SmartAdObject: { value: function(){} },
        SmartAdServerAjax: { value: function(){} },
        smartAd: { value: { LoadAds: function() {}, Register: function() {} } }
    });
};

scriptletsFunc["adfly-defuser.js"] = function(argv) {
    var isDigit = /^\d$/;
    var handler = function(encodedURL) {
        var var1 = "", var2 = "", i;
        for (i = 0; i < encodedURL.length; i++) {
            if (i % 2 === 0) {
                var1 = var1 + encodedURL.charAt(i);
            } else {
                var2 = encodedURL.charAt(i) + var2;
            }
        }
        var data = (var1 + var2).split("");
        for (i = 0; i < data.length; i++) {
            if (isDigit.test(data[i])) {
                for (var ii = i + 1; ii < data.length; ii++) {
                    if (isDigit.test(data[ii])) {
                        var temp = parseInt(data[i],10) ^ parseInt(data[ii],10);
                        if (temp < 10) {
                            data[i] = temp.toString();
                        }
                        i = ii;
                        break;
                    }
                }
            }
        }
        data = data.join("");
        var decodedURL = window.atob(data).slice(16, -16);
        window.stop();
        window.onbeforeunload = null;
        window.location.href = decodedURL;
    };
    try {
        var val;
        var flag = true;
        window.Object.defineProperty(window, "ysmm", {
            configurable: false,
            set: function(value) {
                if (flag) {
                    flag = false;
                    try {
                        if (typeof value === "string") {
                            handler(value);
                        }
                    } catch (err) { }
                }
                val = value;
            },
            get: function() {
                return val;
            }
        });
    } catch (err) {
        window.console.error("Failed to set up Adfly bypasser!");
    }
};

scriptletsFunc["disable-newtab-links.js"] = function(argv) {
    document.addEventListener('click', function(ev) {
        var target = ev.target;
        while ( target !== null ) {
            if ( target.localName === 'a' && target.hasAttribute('target') ) {
                ev.stopPropagation();
                ev.preventDefault();
                break;
            }
            target = target.parentNode;
        }
    });
};

scriptletsFunc["damoh-defuser.js"] = function(argv) {
    var handled = new WeakSet();
    var asyncTimer;
    var cleanVideo = function() {
        asyncTimer = undefined;
        var v = document.querySelector('video');
        if ( v === null ) { return; }
        if ( handled.has(v) ) { return; }
        handled.add(v);
        v.pause();
        v.controls = true;
        var el = v.querySelector('meta[itemprop="contentURL"][content]');
        if ( el === null ) { return; }
        v.src = el.getAttribute('content');
        el = v.querySelector('meta[itemprop="thumbnailUrl"][content]');
        if ( el !== null ) { v.poster = el.getAttribute('content'); }
    };
    var cleanVideoAsync = function() {
        if ( asyncTimer !== undefined ) { return; }
        asyncTimer = window.requestAnimationFrame(cleanVideo);
    };
    var observer = new MutationObserver(cleanVideoAsync);
    observer.observe(document.documentElement, { childList: true, subtree: true });
};

scriptletsFunc["twitch-videoad.js"] = function(argv) {
    if ( /(^|\.)twitch\.tv$/.test(document.location.hostname) === false ) { return; }
    var realFetch = window.fetch;
    window.fetch = function(input) {
        if ( arguments.length >= 2 && typeof input === 'string' && input.includes('/access_token') ) {
            var url = new URL(arguments[0]);
            url.searchParams.delete('platform');
            arguments[0] = url.href;
        }
        return realFetch.apply(this, arguments);
    };
};

scriptletsFunc["fingerprint2.js"] = function(argv) {
    let browserId = '';
    for ( let i = 0; i < 8; i++ ) {
        browserId += (Math.random() * 0x10000 + 0x1000 | 0).toString(16).slice(-4);
    }
    const fp2 = function(){};
    fp2.get = function(opts, cb) {
        if ( !cb  ) { cb = opts; }
        setTimeout(( ) => { cb(browserId, []); }, 1);
    };
    fp2.prototype = {
        get: fp2.get
    };
    window.Fingerprint2 = fp2;
};

scriptletsFunc["cookie-remover.js"] = function(argv) {
    const needle = argv && argv[0] || '';
    let reName = /./;
    if ( /^\/.+\/$/.test(needle) ) {
        reName = new RegExp(needle.slice(1,-1));
    } else if ( needle !== '' && needle !== '{{1}}' ) {
        reName = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    }
    const removeCookie = function() {
        document.cookie.split(';').forEach(cookieStr => {
            let pos = cookieStr.indexOf('=');
            if ( pos === -1 ) { return; }
            let cookieName = cookieStr.slice(0, pos).trim();
            if ( !reName.test(cookieName) ) { return; }
            let part1 = cookieName + '=';
            let part2a = '; domain=' + document.location.hostname;
            let part2b = '; domain=.' + document.location.hostname;
            let part2c, part2d;
            let domain = document.domain;
            if ( domain ) {
                if ( domain !== document.location.hostname ) {
                    part2c = '; domain=.' + domain;
                }
                if ( domain.startsWith('www.') ) {
                    part2d = '; domain=' + domain.replace('www', '');
                }
            }
            let part3 = '; path=/';
            let part4 = '; Max-Age=-1000; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = part1 + part4;
            document.cookie = part1 + part2a + part4;
            document.cookie = part1 + part2b + part4;
            document.cookie = part1 + part3 + part4;
            document.cookie = part1 + part2a + part3 + part4;
            document.cookie = part1 + part2b + part3 + part4;
            if ( part2c !== undefined ) {
                document.cookie = part1 + part2c + part3 + part4;
            }
            if ( part2d !== undefined ) {
                document.cookie = part1 + part2d + part3 + part4;
            }
        });
    };
    removeCookie();
    window.addEventListener('beforeunload', removeCookie);
};

scriptletsFunc["window.open-defuser.js"] = function(argv) {
    'use strict';
    let arg1 = argv && argv[0] || '';
    if ( arg1 === '{{1}}' ) { arg1 = ''; }
    let arg2 = argv && argv[1] || '';
    if ( arg2 === '{{2}}' ) { arg2 = ''; }
    let arg3 = argv && argv[2] || '';
    if ( arg3 === '{{3}}' ) { arg3 = ''; }
    const log = arg3 !== ''
        ? console.log.bind(console)
        : ( ) => { };
    const newSyntax = /^[01]?$/.test(arg1) === false;
    let pattern = '';
    let targetResult = true;
    let autoRemoveAfter = -1;
    if ( newSyntax ) {
        pattern = arg1;
        if ( pattern.startsWith('!') ) {
            targetResult = false;
            pattern = pattern.slice(1);
        }
        autoRemoveAfter = parseInt(arg2);
        if ( isNaN(autoRemoveAfter) ) {
            autoRemoveAfter = -1;
        } 
    } else {
        pattern = arg2;
        if ( arg1 === '0' ) {
            targetResult = false;
        }
    }
    if ( pattern === '' ) {
        pattern = '.?';
    } else if ( /^\/.+\/$/.test(pattern) ) {
        pattern = pattern.slice(1,-1);
    } else {
        pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    const rePattern = new RegExp(pattern);
    window.open = new Proxy(window.open, {
        apply: function(target, thisArg, args) {
            log('window.open:', ...args);
            const url = args[0];
            if ( rePattern.test(url) !== targetResult ) {
                return target.apply(thisArg, args);
            }
            if ( autoRemoveAfter < 0 ) { return null; }
            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.setProperty('display','none', 'important');
            iframe.style.setProperty('height','1px', 'important');
            iframe.style.setProperty('width','1px', 'important');
            document.body.appendChild(iframe);
            setTimeout(( ) => iframe.remove(), autoRemoveAfter * 1000);
            if ( arg3 === '' ) { return iframe.contentWindow; }
            return new Proxy(iframe.contentWindow, {
                get: function(target, prop) {
                    log('window.open / get', prop, '===', target[prop]);
                    return target[prop];
                },
                set: function(target, prop, value) {
                    log('window.open / set', prop, '=', value);
                    target[prop] = value;
                },
            });
        }
    });
};

    let ready = function()
    {
        let callFunc = function(funcName, argv)
        {
            try
            {
                if (scriptletsFunc[funcName] && typeof scriptletsFunc[funcName] === "function")
                    scriptletsFunc[funcName](argv);
            } catch (e)
            { }
        }

        for (var ind = 0; ind < scriptletRules.length; ind++)
        {
            var rule = scriptletRules[ind];
            if (scriptletsFunc[rule.functionName] && typeof scriptletsFunc[rule.functionName] === "function")
                callFunc(rule.functionName, rule.arguments);
        }
    }

    ready();
})  
