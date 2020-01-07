
const regExp = /[\000-\037]+/g;

function stripCtrlCodes(str) {
    if (typeof str === 'string') {
        return str.replace(regExp, '');
    }
    if (str instanceof Error) {
        return str.message.replace(regExp, '');
    }
    return String(str).replace(regExp, '');
}

module.exports = stripCtrlCodes;