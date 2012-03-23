/**
 * SITEANALYZE_NG v0.2
 * Asbjørn Clemmensen <ac@siteimprove.com>
 * 30. november 2011
 *
 * CHANGELOG
 * v0.2 Implementerer callbacks der kaldes ved load og ved hver request.
 * v0.1 Første iteration med alle de ting, der er beskrevet i oversigten nedenfor.
 * 
 * Koden nedenfor er delt op i fem dele:
 *
 * 1: OPTS. Her defineres de værdier, som indgår i tracking-URL'en. Nogle af dem er
 *    pre-filled, andre er sat til null. Et kald som _sz.push(['key', 'value']) kan
 *    sætte kun en værdi, hvis dens identifier allerede findes.
 *
 * 2: UTIL. Dette utility-API centraliserer ting som escaping, cookies, check for tomme
 *    strenge, at hente elementer via id eller tagname osv. Det fungerer som en meget
 *    let erstatning for det arbejde et framework normalt ville tage sig af.
 *
 * 3: INTERNAL. Disse metoder skal ikke kunne kaldes direkte af brugerne, da de
 *    udfører arbejde som skal laves *før* hoved-requesten sendes afsted. Men der er
 *    indirekte adgang til disse metoder igennem _sz.push(['metode', 'argument']).
 *    Derved kan man sætte kald til breadcrumbs, metagroup osv. i kø, og så bliver
 *    de eksekveret når brugerdata behandles.
 *
 * 4: API. Her defineres det eksternt tilgængelige API, som gøres tilgængeligt for
 *    brugerne via _sz. Her kan logclick og logfile findes, og jeg forestiller mig,
 *    at event tracking og andre features med tiden kan gøres tilgængelige her.
 *
 * 5: MAIN. Her indlæses brugerdata (igennem api.push()), session-oplysninger hentes
 *    fra vores cookie, clickhandlers installeres og hoved-requesten bliver fyret af.
 *
 * Det eneste vi smider i globalt namespace er objektet _sz, resten foregår i en
 * closure, hvis eksterne dele kan tilgås efterfølgende fra _sz.
 *
 * Jeg forestiller mig, at det script kunderne skal have et link til skal være en
 * wrapper omkring dette script. På den måde er det os, der står med alle de små
 * JavaScript-detaljer (i stedet for kunden, som ikke ved en pind om den slags). Men
 * det er samtidig vigtigt, at vi ikke laver adskillige kopier af den samme kode,
 * men med kundespecifikke modifikationer. Så mister vi nemlig muligheden for at
 * lave bugfixes, tilføje nye features osv. En alternativ model ville være at gøre
 * som Google Analytics (god offentlig dokumentation, ingen support).
 *
 * NOTE: Dette script bruger kun ét sæt identifiers for hver værdi vi sender igennem
 * requesten. Det gamle kode havde mindst to. Bevirkningen er, at nogle af vores
 * identifiers ikke nødvendigvis er indlysende (eksempelvis sw og ft). Det er muligt
 * at lave en mapping mellem "menneskevenlige termer" og URL params, men indtil
 * videre har jeg valgt at undlade dette pga. størrelse og effektivitet.
 *
 * TODO: Pt. er onclick-handleren ikke præcis nok. Den virker næsten hele tiden i
 * IE (9 testet), men Chrome er ikke stabil. Det er uklart hvad problemet er --
 * i Chrome bliver requesten annulleret, når brugeren navigerer videre, og derfor
 * når scriptet ikke at fuldføre.
 *
 * TODO: Ikke al funktionalitet fra det eksisterende script er overført. Indtil
 * videre mangler Sitecore's GUID og surveysessionid. Jeg forestiller mig dog, at
 * disse felter måske kan implementeres som mere fleksible "custom fields". Disse
 * manglende features er imidlertid trivielle at overføre.
 *
 * TODO: Scriptet er kun testet i Chrome (v16) og IE9. Derudover har jeg kun
 * testet "åbenlyse" scenarier -- altså ikke noget der kommer i nærheden af
 * det custom kode, jeg kan forestille mig, at nogle af kunderne vil have.
 */

(function(w) {
	// Utility API
	var util = {
		'esc':   function(str) { return encodeURIComponent(new String(str).replace(/\n+|\r+|\s{2,}/g, null)); },
		'empty': function(e)   { return (e == undefined || e == null || e == ""); },
		'tag':   function(str) { return document.getElementsByTagName(str); },
		'id':    function(str) { return document.getElementById(str); },
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
			if(w['performance']) {
				return (new Date).getTime() - performance.timing.navigationStart;
			} else {
				return null;
			}
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
		'referer': document.referrer,
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
		'szfbid': util.uuid() // uuid for feedback
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
			util.log('loading feedback');
			var szfb = document.createElement('script'); szfb.type = 'text/javascript'; szfb.async = true;
			szfb.src = '//ac.givetwise.dk/siteanalyze_fb/feedback.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(szfb, s);
		},

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
				internal[args[0]](args);
			} else if(internal[args[0]]) {
				internal[args[0]] = args[1];
			} else {
				internal.customfield(args);
			}
		},
		
		'opts': opts,
		'userdata': _sz,
		'util': util,
		'internal': internal
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

})(window);
