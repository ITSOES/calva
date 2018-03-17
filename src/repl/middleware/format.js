const state = require('../../state');
const repl = require('../client');
const message = require('../message');
const {
    getDocument,
    getFileType,
} = require('../../utilities');


function formatCode(code, document = {}) {
    let current = state.deref(),
        doc = getDocument(document),
        formatClient = null;
    return new Promise((resolve, reject) => {
        formatClient = repl.create().once('connect', () => {
            let msg = message.format(current.get(getFileType(doc)), code);
            formatClient.send(msg, function (results) {
                let r = results[0];
                if (r.status.indexOf("format-code-error") !== -1) {
                    let end = r.err.indexOf("]"),
                        errorMessage = "Unable to format code - error found";
                    if (end !== -1 && end > 0) {
                        errorMessage += ": " + r.err.substring(0, end).replace("[", "");
                    }
                    reject(null, errorMessage);
                } else if (r.status.length === 1 && r.status.indexOf("done") !== -1) {
                    resolve(results[0]["formatted-code"]);
                } else {
                    reject(results, "UNHANDLED FORMAT ERROR");
                }
            });
        });
    }).then((formattedCode) => {
        formatClient.end();
        return formattedCode;
    }).catch((results, errorMessage) => {
        let chan = state.deref().get('outputChannel');
        formatClient.end();
        chan.appendLine(errorMessage + ":");
        chan.appendLine(results);
        return code;
    });
}

module.exports = {
    formatCode
};
