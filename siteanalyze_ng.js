/**
 * SITEANALYZE_NG v0.2
 * Asbj�rn Clemmensen <ac@siteimprove.com>
 * 30. november 2011
 *
 * CHANGELOG
 * v0.2 Implementerer callbacks der kaldes ved load og ved hver request.
 * v0.1 F�rste iteration med alle de ting, der er beskrevet i oversigten nedenfor.
 * 
 * Koden nedenfor er delt op i fem dele:
 *
 * 1: OPTS. Her defineres de v�rdier, som indg�r i tracking-URL'en. Nogle af dem er
 *    pre-filled, andre er sat til null. Et kald som _sz.push(['key', 'value']) kan
 *    s�tte kun en v�rdi, hvis dens identifier allerede findes.
 *
 * 2: UTIL. Dette utility-API centraliserer ting som escaping, cookies, check for tomme
 *    strenge, at hente elementer via id eller tagname osv. Det fungerer som en meget
 *    let erstatning for det arbejde et framework normalt ville tage sig af.
 *
 * 3: INTERNAL. Disse metoder skal ikke kunne kaldes direkte af brugerne, da de
 *    udf�rer arbejde som skal laves *f�r* hoved-requesten sendes afsted. Men der er
 *    indirekte adgang til disse metoder igennem _sz.push(['metode', 'argument']).
 *    Derved kan man s�tte kald til breadcrumbs, metagroup osv. i k�, og s� bliver
 *    de eksekveret n�r brugerdata behandles.
 *
 * 4: API. Her defineres det eksternt tilg�ngelige API, som g�res tilg�ngeligt for
 *    brugerne via _sz. Her kan logclick og logfile findes, og jeg forestiller mig,
 *    at event tracking og andre features med tiden kan g�res tilg�ngelige her.
 *
 * 5: MAIN. Her indl�ses brugerdata (igennem api.push()), session-oplysninger hentes
 *    fra vores cookie, clickhandlers installeres og hoved-requesten bliver fyret af.
 *
 * Det eneste vi smider i globalt namespace er objektet _sz, resten foreg�r i en
 * closure, hvis eksterne dele kan tilg�s efterf�lgende fra _sz.
 *
 * Jeg forestiller mig, at det script kunderne skal have et link til skal v�re en
 * wrapper omkring dette script. P� den m�de er det os, der st�r med alle de sm�
 * JavaScript-detaljer (i stedet for kunden, som ikke ved en pind om den slags). Men
 * det er samtidig vigtigt, at vi ikke laver adskillige kopier af den samme kode,
 * men med kundespecifikke modifikationer. S� mister vi nemlig muligheden for at
 * lave bugfixes, tilf�je nye features osv. En alternativ model ville v�re at g�re
 * som Google Analytics (god offentlig dokumentation, ingen support).
 *
 * NOTE: Dette script bruger kun �t s�t identifiers for hver v�rdi vi sender igennem
 * requesten. Det gamle kode havde mindst to. Bevirkningen er, at nogle af vores
 * identifiers ikke n�dvendigvis er indlysende (eksempelvis sw og ft). Det er muligt
 * at lave en mapping mellem "menneskevenlige termer" og URL params, men indtil
 * videre har jeg valgt at undlade dette pga. st�rrelse og effektivitet.
 *
 * TODO: Pt. er onclick-handleren ikke pr�cis nok. Den virker n�sten hele tiden i
 * IE (9 testet), men Chrome er ikke stabil. Det er uklart hvad problemet er --
 * i Chrome bliver requesten annulleret, n�r brugeren navigerer videre, og derfor
 * n�r scriptet ikke at fuldf�re.
 *
 * TODO: Ikke al funktionalitet fra det eksisterende script er overf�rt. Indtil
 * videre mangler Sitecore's GUID og surveysessionid. Jeg forestiller mig dog, at
 * disse felter m�ske kan implementeres som mere fleksible "custom fields". Disse
 * manglende features er imidlertid trivielle at overf�re.
 *
 * TODO: Scriptet er kun testet i Chrome (v16) og IE9. Derudover har jeg kun
 * testet "�benlyse" scenarier -- alts� ikke noget der kommer i n�rheden af
 * det custom kode, jeg kan forestille mig, at nogle af kunderne vil have.
 */

(function() {
	// Base values for image request
	var opts = {
		'url': window.location.href,
		'referer': document.referrer,
		'title': document.title,
		'res': window.screen.width + 'x' + window.screen.height,
		'accountid': null,
		'groups': null,   // siteanalyze content group(s)
		'session': null,  // site session id
		'path': null,     // breadcrumb path
		'hits': null,     // number of hits
		'sw': null,       // search word
		'ft': null,       // file type
		'guid': null,     // GUID
		'uid': null,      // user id
		'cid': null,      // site id
		'cvid': null,     // virtual id
		'rt': null,       // response time
		'prev': null     // previous session
	};

	// Utility API
	var util = {
		'esc':   function(str) { return escape(new String(str).replace(/\n+|\r+|\s{2,}/g, null)); },
		'empty': function(e)   { return (e == undefined || e == null || e == ""); },
		'tag':   function(str) { return document.getElementsByTagName(str); },
		'id':    function(str) { return document.getElementById(str); },
		'clone': function(o)   { var n = {}; for(var i in o) { n[i] = o[i]; } return n; },
		'rnd':   function()    { return Math.floor(Math.random() * 100000); },
		'txt':   function(o)   { return (o.textContent) ? o.textContent : o.innerText; },
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
		'log': function() { if(window['console']) console.log(arguments); },
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

			url = internal.target + "?" + out.join("&");

			util.log("requesting -> %s", url);
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
					if(typeof func == "string" && typeof window[func] == "function") { this.callbacks[name] = window[func]; }
					else if(typeof func == "function") { this.callbacks[name] = func; }
				}
			}
		},

		'callbacks': {
			'load':    null,
			'request': null
		},
		'target': "dump.php",
		'cookie': 'nmstat'
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
				'ref': window.location,
				'autoonclick': 1,
				'accountid': opts.accountid
			}]);
		},
		
		'push': function(args) { 
			if(typeof opts[args[0]] != "undefined") {
				opts[args[0]] = args[1];
			} else if(internal[args[0]]) {
				internal[args[0]](args);
			} else {
				internal.customfield(args);
			}
		},
		
		'opts': opts,
		'userdata': _sz,
		'util': util
	};

	// Handle user-defined variables
	if(_sz != undefined) {
		for(var i=0; i<_sz.length; i++) {
			api.push(_sz[i]);
		}
	}

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

	// Attach onclick handlers
	var links = util.tag('a');
	for(var i=0; i<links.length; i++) {
		var l = links[i];
		if(l.href.charAt(l.href.length-1) == "#") continue;
		util.listen(l, function() { api.logclick(this.href); });
	}

	_sz = api;

	api.push(['request']);
	internal.callback('load');

})();
