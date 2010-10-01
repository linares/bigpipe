<?php
header("Cache-Control: no-cache, must-revalidate"); // HTTP/1.1
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT"); // Date in the past
header("Pragma: no-cache");
header("Content-Type: text/html");

require_once('Browser.php');
require_once('h_bigpipe.inc');
require_once('h_pagelet.inc');

function test_delayed_rendering($msg)
{
	// Simulate some long operation
	usleep(100000); // 100 ms
        $padding = '';
        for ($i = 0; $i < 8192; $i++) { $padding .= ' '; }
	return "$msg <!-- $padding -->\n";
}

function test_simple_replace($msg)
{
	$padding = '';
        for ($i = 0; $i < 8192; $i++) { $padding .= ' '; }
	return "$msg <!-- $padding --><br>\n";
}

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
		<h1 id="header">BigPipe test.</h1>
		<!-- simulate that the page is much bigger than it is. Browsers have internal buffering which hides how bigpipe actual works.
					 This allows us to simulate real world effect with a big page. -->
		<!-- <?php for ($i = 0; $i < 128000; $i++) { echo ' '; } ?> -->

		<h2>Simple content replace</h2>
<?php
	echo new Pagelet("content_replace", 'test_simple_replace', 10, array('Ok'));
?>
		<h2>Content replace with inline javascript</h2>
<?php
// Test with a pagelet which contains additional javascript payload
$pagelet = new Pagelet('inline_javascript_test');
$pagelet->add_content('Ok');
echo $pagelet;
?>			  

		<h2>Content replace with external javascript file</h2>
                <div id="external_js">Be patient, this will be completed in the end after delayed rendering</div>
<?php
$pagelet = new Pagelet('external_javascript_test');
$pagelet->add_javascript('test.js');
echo $pagelet;
?>			  

		<h2>Content repalce with external javascript and inline javascript</h2>
		<div id="external_js2">be patient, this will be completed in the end after delayed rendering test</div>
<?php
$pagelet = new Pagelet('external_javascript_test2');
$pagelet->add_javascript('test2.js');
$pagelet->add_javascript_code("test2('external_js2', 'Ok');");
echo $pagelet;
?>			  

			
		<h2>Test delayed rendering (50 times)</h2>
<?php
for ($i = 0; $i < 50; $i++) {
	$pagelet = new Pagelet("counter$i", "test_delayed_rendering", 10, array($i));
	$pagelet->use_span = true;
	echo $pagelet;
}

// Test with a pagelet which contains additional javascript payload
$pagelet = new Pagelet('final_ok');
$pagelet->add_content('Ok');
$pagelet->add_javascript("test.js");
$pagelet->add_javascript_code("$('header').innerHTML = 'All done';", 11);
echo $pagelet;

echo "</body>\n";
BigPipe::render();
