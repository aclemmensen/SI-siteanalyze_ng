<?php

header("Content-Type: image/gif");

$out = sprintf("%s ======================\n", strftime('%d.%m.%y %H:%M:%S', time()));

$_GET['_req'] = $_SERVER['REQUEST_URI'];

foreach($_GET as $k=>$v) {
	$out .= sprintf("%17s -> %s\n", $k, $v);
}

$fn = 'dump.txt';
$fh = fopen($fn, 'a');
fwrite($fh, $out."\n");

?>
