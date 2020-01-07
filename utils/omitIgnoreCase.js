module.exports = function omitInPlaceIgnoreCase(obj, ...stringNames) {
    if (stringNames.length === 0) {
        return obj;
    }
    const lowerCaseStringNames = stringNames.map(str => String(str).toLocaleLowerCase());
    const props = Object.keys(obj);
    for (let i = 0; i < props.length; i++) {
        if (lowerCaseStringNames.includes(props[i].toLowerCase())) {
            delete obj[props[i]];
        }
    }
    return obj;
};
