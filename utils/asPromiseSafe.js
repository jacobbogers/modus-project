module.exports = async function asPromiseSafe(fn,...args){
    try {
        const result = await fn(...args);
        return [result, undefined];
    }
    catch(err){
        return [undefined, err];
    }
}