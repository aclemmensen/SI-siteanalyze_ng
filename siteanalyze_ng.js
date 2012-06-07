(function(w) {
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
		'ct': null,           // cookie type
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

			util.log(util.fmt("requesting -> {0}", url));
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

		'cookieopt': function(args) {
			var copts = args[1];
			copts.cover = (copts.cover !== undefined) ? copts.cover : true;
			copts.defer = (copts.defer !== undefined) ? copts.defer : 3;
			var ctest = (copts.test !== undefined) ? copts.test : false;
			var cc = copts.config || { 'mode': 'optin', 'notrack': true, 'force': false };
			var _m = cc.mode;
			this.cookieuserchoice.active = true;

			if(~w.location.href.indexOf('szcookietest')) {
				util.log('cookieopt: in usertest mode');
				cc.force = true;
			}

			if(ctest) {
				this.cookieuserchoice.active = false;
			}

			if(util.cookie('szcookiechoice')) {
				opts.ct = util.cookie('szcookiechoice');
				this.cookieuserchoice.choice = opts.ct;
				if(!cc.force) {
					return false;
				}
			}

			var setperm = function() { internal.cookieuserchoice.choice = 'p'; }
			var settemp = function() { internal.cookieuserchoice.choice = 's'; }
			var setnone = function() { internal.cookieuserchoice.choice = 'n'; }
			var isperm  = function() { return internal.cookieuserchoice.choice == 'p'; }
			var istemp  = function() { return internal.cookieuserchoice.choice == 's'; }
			var isnone  = function() { return internal.cookieuserchoice.choice == 'n'; }

			var _fa = function() { setperm(); _fc(); return false; } // accept
			var _fr = function() { (cc.notrack) ? setnone() : settemp(); _fc(); return false; } // refuse
			var _fn = function() { setnone(); _fc(); } // no cookie
			var _sc = function(e) { internal.setcookie('szcookiechoice', internal.cookieuserchoice.choice, e); }; // store choice

			if(cc.notrack && !ctest) {
				setnone();
			}

			// set tracking cookie
			var _fc = function() {
				internal.setcookie('szcookiepv', null);
				if(!cc.force) {
					if(isperm()) {
						_sc(1000); internal.setcookie(internal.cookiename, util.cookie(internal.cookiename), 1000);
					} else if(istemp()) {
						_sc(null); internal.setcookie(internal.cookiename, util.cookie(internal.cookiename));
					} else if(isnone()) {
						_sc(null); internal.setcookie(internal.cookiename, null);
						api.push(['request', {
							'url': opts.url,
							'accountid': opts.accountid,
							'notrack': true
						}]);
					}
				}
				if(_w && _w.parentNode) {
					_w.parentNode.removeChild(_w);
				}
				return false;
			};

			var _bs = 'line-height:15px; color:white; font-weight:bold; background:green; display:inline-block; zoom:1; text-decoration:none;';

			var _w = document.createElement('div');
			    _w.style.cssText = ((copts.cover)
						? 'position:fixed; z-index:1000; top:0; left:0;'
						: 'margin-bottom:15px;')
						+ 'width:100%; background-color:white; border-bottom:2px black solid;';
					_w.id = "szcookiewrp";
			var _i = document.createElement('div');
			    _i.style.cssText = 'font-size:13px; font-family:Arial; padding:15px 0; width:940px; margin:auto;';
					_i.id = "szcookieinner";
			var _t = document.createElement('p');
					_t.style.cssText = 'width: 790px; margin:0; padding:0; float:left; text-align:left; line-height:135%';
			    _t.innerHTML = copts.text;
			var _b = document.createElement('div');
			    _b.id = "szcookiebtn";
					_b.style.cssText = 'float:right; width:130px; text-align:right; padding-top:15px;';
			var _a = document.createElement('a');
			    _a.id = "szcookieacpt";
					_a.style.cssText = _bs + 'font-weight:normal; outline:none; color:black; padding:5px 25px 5px 0px; font-size:11px; background:url(\'//ssl.siteimprove.com/js/siteanalyze_ng/close_single.png\') no-repeat 100% 50%; text-align:right;';
					_a.onclick = _fa;
					_a.setAttribute('href', '#');
					_a.innerHTML = copts.accept;
			var _x = document.createElement('div');
			    _x.style.cssText = 'clear:both; font-size:0; line-height:0; height:0;';

			switch(_m) {
				case 'optin':  _b.appendChild(_a); (cc.notrack) ? setnone() : settemp(); break;
				case 'optout': _b.appendChild(_a); setperm(); break;
			}

			_i.appendChild(_t);
			_i.appendChild(_b);
			_i.appendChild(_x);
			_w.appendChild(_i);

			_fl = function() {
				(copts.cover) ? document.body.appendChild(_w) : document.body.insertBefore(_w, document.body.children[0]);
				var szcr = document.getElementById('szcookierefuse');
				if(szcr != null) szcr.onclick = _fr;
			}; // onload handler

			if(!ctest || (ctest && cc.force)) {
				(document.body)
					? _fl()
					: ((w.addEventListener)
						? w.addEventListener('load', _fl, false)
						: w.attachEvent('onload', _fl));

				if(copts.defer > 0 && !cc.force) {
					var pv = util.cookie('szcookiepv');
					if(pv == null) {
						internal.setcookie('szcookiepv', pv = 1);
					} else if(window.location.hash.indexOf('szcookiedefer') == -1) {
						internal.setcookie('szcookiepv', parseInt(pv) + 1);
					} else {
						pv = parseInt(pv);
					}

					if(pv >= ((copts.defer !== undefined) ? copts.defer : 3)) {
						_fa();
					}
				}
			}
		},

		'cookieuserchoice': {
			'active': false,
			'choice': null
		},

		'cantrack': function() {
			return !(this.cookieuserchoice.active && this.cookieuserchoice.choice == 'n');
		},

		'setcookie': function(n, v, e) {
			var o = { domain: document.domain, path: '/' };

			if(e != undefined && e != null) {
				o.expires = e;
			}

			//console.log('cookie: %s -> %s (exp: %s)', n, v, e);
			util.cookie(n, v, o);
		},

		'getsessid': function() {
			var c = util.cookie(this.cookiename);
			if(!this.cantrack()) {
				return null;
			}

			if(!c) {
				var id = opts.session + (new Date()).getTime() + util.rnd();

				var cus = this.cookieuserchoice;
				var exp = (cus.active && cus.choice == 's') ? null : 1000;

				internal.setcookie(internal.cookiename, id, exp);
				c = util.cookie(internal.cookiename);
			}

			return c;
		},

		'callbacks': {
			'load':     null,
			'request':  null,
			'feedback': null
		},
		'cookiename': 'nmstat',
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
	_sz = api;

	api.push(['legacy', 'searchWord', 'sw']);
	api.push(['legacy', 'numberOfHits', 'hits']);

	// Read/set cookie to get session info
	opts.prev = internal.getsessid();

	_sz = api;

	var defer = function() {
		if((document && document.readyState == "complete") || internal._ready) {
			util.log('we are ready');
			internal._ready = true;
			for(var i=0; i<internal._readyhandler.length; i++) {
				util.log('calling readyhandler ' + i);
				internal._readyhandler[i].call();
			}
			return;
		}

		if(!internal._ready) {
			util.log('not ready yet');
			w.setTimeout(defer, 100);
		}
	};

	api.push(['request']);
	api.push(['clicks']);

	internal.callback('load');

	defer();

})(window);
