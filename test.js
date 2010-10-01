$('external_js').innerHTML = 'Ok';

// Important, notice BigPipe that this file has been loaded
if (BigPipe != undefined) { BigPipe.fileLoaded("test.js"); }
