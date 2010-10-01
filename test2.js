function test2(id, message) {
    $(id).innerHTML = message;
}

// Important, notice BigPipe that this file has been loaded
if (BigPipe != undefined) { BigPipe.fileLoaded("test2.js"); }
