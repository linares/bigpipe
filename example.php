<?php
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
header("Pragma: no-cache");
header("Content-Type: text/html");
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<title>BigPipe example</title>
		<script type="text/javascript" src="prototype.js"></script>
		<script type="text/javascript" src="prototypepatch.js"></script>
		<script type="text/javascript" src="bigpipe.js"></script>
	</head>
	<body>
		<h1 id="header">BigPipe test. Lets count...</h1>
		<!-- simulate that the page is much bigger than it is. Browsers have internal buffering which hides how bigpipe actual works.
					 This allows us to simulate real world effect with a big page. -->
		<!-- aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa -->
<?php

require_once('h_browser.inc');
require_once('h_bigpipe.inc');
require_once('h_pagelet.inc');

function delayed_rendering($msg)
{
	// Simulate some long operation
	usleep(100000); // 100 ms
	return "Counter: $msg <!-- data data data data data data data data data data data data data data data data data data --><br>\n";
}

for ($i = 0; $i < 50; $i++) {
	echo new Pagelet("counter$i", "delayed_rendering", 10, array($i));
}

// Test with a pagelet which contains additional javascript payload
$pagelet = new Pagelet('javascript_test');
$pagelet->add_content('test');
$pagelet->add_javascript_code("$('header').innerHTML = 'All done';", 11);
echo $pagelet;

echo "</body>\n";
BigPipe::render();
