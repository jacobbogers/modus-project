module.exports = async function safe(promise){
    try {
       const data = await promise;
       return [data, undefined];
    }
    catch(err){
        return [undefined, err];
    }
}