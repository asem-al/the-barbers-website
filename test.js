const myModule = require("./modules/myModule");

const gen = (length = 10) => {
    if (length < 0) throw new Error("The 'length' parameter cannot be negative.");
    let str = "";
    while (length > 0) {
        const batchSize = Math.min(length, 5); // You can adjust the batch size
        const randomBatch = Array.from({ length: batchSize }, () => Math.floor(Math.random() * 36).toString(36)).join("");
        str += randomBatch;
        length -= batchSize;
    }
    return str;
};

// myModule.test(gen, 50, 12);
myModule.test(myModule.genRand, 10000);
// myModule.test(myModule.genRand2, 100);
