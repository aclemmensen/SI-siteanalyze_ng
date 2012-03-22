<!doctype html>
<html>
	<head>
		<title>siteanalyze_ng test</title>
		<!--<script type="text/javascript" src="siteanalyze_beautiful.js"></script>-->
		<meta name="groups" content="Metagroups" />
		<meta charset="utf-8" />
		<style type="text/css">
		body { 
			font-family:Arial;
			font-size:90%;
			background:#ccc;
			line-height:135%;
		}

		#main {
			width:750px;
			padding:20px;
			margin:auto;
			margin-top:40px;
			background:white;
			min-height:700px;
		}

		#bc {
			background:#eee;
			font-size:11px;
			padding:5px;
			margin:5px 0;
		}

		#sz_fields input, #sz_fields label {
			float:left;
			width:350px;
			margin-bottom:5px;
			font-size:12px;
		}

		#sz_fields label {
			text-align:right;
			padding-right:20px;
			color:#666;
			line-height:25px;
			width:80px;
		}

		#sz_fields br {
			clear:left;
		}

		input[type="submit"] {
			margin-left:100px;
		}

		h1 {
			font-size:30px;
			margin-bottom:30px;
		}
		</style>
		<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
		<script type="text/javascript">

		// Initialize array containing user-supplied variables, function calls etc.
		var _sz = _sz || [];

		_sz.push(['accountid', '1239539']);
		_sz.push(['groups', 'Tester']);
		_sz.push(['metagroup', 'groups']);
		_sz.push(['breadcrumbs', 'id:bc']);
		_sz.push(['sw', 'Search test']);
		_sz.push(['hits', '20']);
		_sz.push(['callback', 'load', buildfields]);
		_sz.push(['callback', 'request', debugreq]);
		_sz.push(['callback', 'feedback', function() {
			console.log('fb loaded');
		}]);
		_sz.push(['feedback', null]);
		_sz.push(['cookieopt', { 'mode': 'optin', 'text': 'dette er en test...', 'accept': 'Accept', 'refuse': 'Refuse', 'close': 'Close' }]);

		// Load siteanalyze_ng, async style
		(function() {
			var sz = document.createElement('script'); sz.type = 'text/javascript'; sz.async = true;
			//sz.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://') + '.siteimprove.com/siteanalyze_ng.js';
			sz.src = 'siteanalyze_ng.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(sz, s);
		})();

		function buildfields() {
			$(document).ready(function() {
				$e = $('#sz_fields');
				for(field in _sz.opts) {
					$e.append(_sz.util.fmt('<label for="sz_{0}">{0}</label><input type="text" name="{0}" id="{0}" value="{1}" /><br />',
						field,
						(_sz.opts[field] != null) ? _sz.opts[field] : ""
					));
				}
			});
		}

		function debugreq(req) {
			p = req.params;
			out = _sz.util.fmt('<li><strong>generated url</strong>:<br /><code>{0}</code></li>', new String(req.url).replace(/&/g, '<br />&nbsp;&nbsp;&amp;'));
			for(field in p) {
				if(_sz.util.empty(p[field])) continue;
				out += _sz.util.fmt('<li><strong>{0}</strong>: {1}</li>', field, p[field]);
			}
			$('#sz_debug').prepend('<ul class="request">' + out + '</ul>');
		}

		$(document).ready(function() {
			$('#sz_request').submit(function() {
				var params = {};
				$(this).find('input[type="text"]').each(function() {
					params[this.name] = $(this).val();
				});
				_sz.push(['request', params]);
				return false;
			});
		});
		</script>
	</head>
	<body>
		<div id="main">
			<h1>siteanalyze_ng test</h1>
			<div id="bc">Du &gt; er &gt; her</div>
			<h3>Test onclick-handler</h3>
			<ul>
				<li><a href="link.html">Live link</a></li>
				<li><a href="link2.html">Dead link</a></li>
				<li><a href="#">Skip me (anchor link)</a></li>
				<li><a href="slow.php">Slow link</a></li>
				<li><a href="slow.php?ext" target="_blank">Slow external link</a></li>
			</ul>
			<h3>Scriptet</h3>
			<p>
				<strong>Initialisering</strong><br />
				(Se kilden for denne side)
			</p>
			<p>
				<strong>Koden</strong><br />
				<a href="siteanalyze_ng.js">siteanalyze_ng.js</a>
			</p>
			<h3>Debug</h3>
			<p><a href="dump.txt">Debugging-output</a> fra alle requests (<?php printf('%.2f mb', filesize('dump.txt')/(1024*1024)); ?>). <em>Nyest nederst</em>.</p>

			<h2>Generér request</h2>
			<p>Brug denne formular til at generere requests. Alle felter der ses her er gyldige felter for en request. Tomme felter ignoreres.</p>
			<form method="get" id="sz_request" action="<?php echo $_SERVER['PHP_SELF']; ?>">
				<div id="sz_fields"></div>
				<input type="submit" value="Send request" />
			</form>

			<div id="sz_debug"></div>
		</div>
	</body>
</html>
