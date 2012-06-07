(function(w) {
	if(window['_sz'] !== undefined && _sz['internal'] !== undefined && _sz['opts'] !== undefined) return;

	// Utility API
	var util = {
		'esc':   function(str) { return encodeURIComponent(new String(str).replace(/\n+|\r+|\s{2,}/g, '')); },
		'empty': function(e)   { return (e == undefined || e == null || e == ""); },
		'tag':   function(str) { return (document.getElementsByTagName) ? document.getElementsByTagName(str) : false; },
		'id':    function(str) { return (document.getElementById) ? document.getElementById(str) : false; },
		'clone': function(o)   { var n = {}; for(var i in o) { n[i] = o[i]; } return n; },
		'rnd':   function()    { return Math.floor(Math.random() * 100000); },
		'txt':   function(o)   { return (o.textContent) ? o.textContent : o.innerText; },
		'uuid':  function()    {
			var S4 = function() {
				 return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
			};
			return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		},
		'navtime': function() {
			return (w['performance']) ? (new Date).getTime() - performance.timing.navigationStart : null;
		},
		'fmt':   function() {
			var s = arguments[0];
			for (var i = 0; i < arguments.length - 1; i++) {       
				var reg = new RegExp("\\{" + i + "\\}", "gm");             
				s = s.replace(reg, arguments[i + 1]);
			}

			return s;
		},
		'listen':function(e,h) { 
			if(e.addEventListener) { e.addEventListener('click', h, false); }
			else if(e.attachEvent) { e.attachEvent('onclick', h); }
		},
		'global': function(n) { return (window[n] !== undefined && window[n] !== null) ? window[n] : null; },
		'log': function(arg) { if(w['console']) console.log(arg); },
		'cookie': function(n,v,o) {
			if (typeof v != 'undefined') { // set cookie
				o = o || {};
				if (v === null) {
					v = '';
					o.expires = -1;
				}
				var expires = '';
				if(o.expires && (typeof o.expires == 'number' || o.expires.toUTCString)) {
					var date;
					if (typeof o.expires == 'number') {
						date = new Date();
						date.setTime(date.getTime() + (o.expires * 24 * 60 * 60 * 1000));
					} else {
						date = o.expires;
					}
					expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
				}
				var path = o.path ? '; path=' + (o.path) : '';
				var domain = o.domain ? '; domain=' + (o.domain) : '';
				var secure = o.secure ? '; secure' : '';
				document.cookie = [n, '=', encodeURIComponent(v), expires, path, domain, secure].join('');
			} else { // get cookie
				var cookiev = null;
				if (document.cookie && document.cookie !== '') {
					var cookies = document.cookie.split(';');
					for (var i=0; i<cookies.length; i++) {
						var cookie = cookies[i].replace(/^\s+|\s+$/g, "");
						if(cookie.substring(0, n.length + 1) == (n + '=')) {
							cookiev = decodeURIComponent(cookie.substring(n.length + 1));
							break;
						}
					}
				}
				return cookiev;
			}
		}
	};

	// Base values for image request
	var opts = {
		'url': w.location.href,
		'ref': document.referrer,
		'title': document.title,
		'res': w.screen.width + 'x' + w.screen.height,
		'accountid': null,
		'groups': null,       // siteanalyze content group(s)
		'session': null,      // site session id
		'path': null,         // breadcrumb path
		'hits': null,         // number of hits
		'sw': null,           // search word
		'ft': null,           // file type
		'guid': null,         // GUID
		'uid': null,          // user id
		'cid': null,          // site id
		'cvid': null,         // virtual id
		'rt': util.navtime(), // response time
		'prev': null,         // previous session
		'szfbid': null,       // uuid for feedback
		'feedbackid': null    // id of feedback config
	};

	// Internal API
	var internal = {
		'request': function(args) {
			params = args[1] || opts;
			params.rn = util.rnd();

			var out, url, img;
			out = [];
			for(var param in params)
				if(!util.empty(params[param]))
					out.push(param + "=" + util.esc(params[param]));

			url = w.location.protocol + '//' + this.endpoint + "?" + out.join("&");

			//util.log(util.fmt("requesting -> {0}", url));
			img = new Image();
			img.src = url;

			this.callback('request', { 'params': params, 'url': url });
		},

		'breadcrumbs': function(args) {
			if(!args[1]) return false;
			var bc = args[1];
			if(bc.substr(0, 3) == 'id:') {
				var e = util.id(bc.substr(3));
				bc = (e) ? util.txt(e) : null;
			}
			opts.path = bc;
		},
		
		'metagroup': function(args) {
			if(!args[1]) return false;
			var me = util.tag('meta');
			var gc = [];
			if(opts.groups) gc.push(opts.groups);
			for(var i=0; i<me.length; i++) {
				if(me[i].name == args[1])
					gc.push(me[i].content);
			}
			if(gc.length > 0)
				opts.groups = gc.join(',');
		},
		
		'customfield': function(args) {
			if(!args[1]) return false;
			opts["grk_"+args[0]] = args[1];
		},

		'callback': function(args, cb_args) {
			cb_args = cb_args || { };
			if(typeof args == "string" && typeof this.callbacks[args] == "function") {
				this.callbacks[args](cb_args);
			} else {
				var name = args[1];
				var func = (args[2] !== undefined) ? args[2] : null;
				if(name && func && this.callbacks[name] !== undefined) {
					if(typeof func == "string" && typeof w[func] == "function") { this.callbacks[name] = w[func]; }
					else if(typeof func == "function") { this.callbacks[name] = func; }
				}
			}
		},

		'feedback': function(args) {
			opts.szfbid = util.uuid();
			if(window['_szfb_config'] !== undefined && _szfb_config.length > 0 && _szfb_config[0]['feedbackid'] !== undefined) {
				opts.feedbackid = _szfb_config[0].feedbackid;
			}

			var szfb = document.createElement('script'); szfb.type = 'text/javascript'; szfb.async = true;
			szfb.src = '//ssl.siteimprove.com/js/feedback/feedback.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(szfb, s);
		},

		'legacy': function(a) {
			if(!a[1]) return false;
			opts[(a[2]) ? a[2] : a[1]] = util.global(a[1]);
		},

		'clicks': function(a) {
			var links = util.tag('a');
			for(var i=0; i<links.length; i++) {
				var l = links[i];
				if(l.href.charAt(l.href.length-1) == "#") { continue; }
				util.listen(l, function() { api.logclick(this.href); });
			}
		},

		'_ready': false,
		'_readyhandler': [],

		'run': function(f) { (internal._ready) ? f() : internal._readyhandler.push(f); },

		'callbacks': {
			'load':     null,
			'request':  null,
			'feedback': null
		},
		'cookie': 'nmstat',
		'endpoint': 'ssl.siteimprove.com/image.aspx' // image request target
	};

	// External API
	var api = {
		'logfile': function(filename, filetype, fileurl, groups, path) {
			this.push(['request', {
				'filename': filename,
				'filetype': filetype,
				'fileurl': fileurl,
				'groups': groups,
				'path': path ,
				'accountid': opts.accountid
			}]);
		},
		
		'logclick': function(url) {
			this.push(['request', {
				'ourl': url,
				'ref': w.location,
				'autoonclick': 1,
				'accountid': opts.accountid
			}]);
		},
		
		'push': function(args) { 
			if(typeof opts[args[0]] != "undefined") {
				opts[args[0]] = args[1];
			} else if(internal[args[0]] && typeof internal[args[0]] == "function") {
				internal.run(function() { internal[args[0]](args); });
			} else if(internal[args[0]]) {
				internal[args[0]] = args[1];
			} else {
				internal.customfield(args);
			}
		},
		
		'opts': opts,
		'userdata': null,
		'util': util,
		'internal': internal
	};

	// Handle user-defined variables
	if(_sz != undefined) {
		api.userdata = _sz;
		for(var i=0; i<_sz.length; i++) {
			api.push(_sz[i]);
		}
	}

	api.push(['legacy', 'searchWord', 'sw']);
	api.push(['legacy', 'numberOfHits', 'hits']);

	// Read/set cookie to get session info
	var c = util.cookie(internal.cookie);
	if(!c) {
		util.cookie(internal.cookie, opts.session + (new Date()).getTime() + util.rnd(), {
			domain: document.domain,
			path: '/',
			expires: 1000
		});
		c = util.cookie(internal.cookie);
	}
	opts.prev = c;

	_sz = api;

	var defer = function() {
		if((document && document.readyState == "complete") || internal._ready) {
			internal._ready = true;
			for(var i=0; i<internal._readyhandler.length; i++) {
				internal._readyhandler[i].call();
			}
			return;
		}

		if(!internal._ready) {
			w.setTimeout(defer, 100);
		}
	};

	api.push(['request']);
	api.push(['clicks']);
	internal.callback('load');

	defer();

})(window);
