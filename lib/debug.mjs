// Function to remove null values from an object
const noNullValues = obj => {
  if (Array.isArray(obj)) {
    return obj.map(noNullValues).filter(value => value !== null);
  } else if (typeof obj === "object") {
    const newObj = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null) {
        newObj[key] = noNullValues(value);
      }
    }
    return newObj;
  }
  return obj;
};

// Function to log an object without truncating it and omitting null values
const debugLog = (message, obj) => {
  console.log(message);
  console.dir(noNullValues(obj), {depth: null});
};

export { debugLog };

