module.exports = function JSONParseSafe(raw){
    try {
        return JSON.parse(raw);
    }
    catch(err){
        return undefined;
    }
}