module.exports =  function isHttpSuccess(code) {
    return code >= 200 && code < 300;
}

