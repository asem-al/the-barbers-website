const fs = require("fs");

function getFilesInFolder() {
  try {
    const fileNames = fs.readdirSync("./assets");
    return fileNames;
  } catch (error) {
    console.error("Error reading folder:", error);
    return [];
  }
}

//exports.serve(file_name, parsed_accept_language);

// exports.modifyPage = (indexHTML) => {
//     let str = "";
//     const imgs = getFilesInFolder();
//     const len = imgs.length;
//     let counter = 1;
//     imgs.forEach((element) => {
//         str += `<div class="mySlides">
//     <div class="numbertext">${counter++} / ${len}</div>
//       <img src="/assets/${element}" style="width:100%">
//   </div>`;
//     });

//     str += `<!-- Image text -->
//     <div class="caption-container">
//       <p id="caption"></p>
//     </div>`;
//     str += `  <!-- Next and previous buttons -->
//     <a class="prev" onclick="plusSlides(-1)">&#10094;</a>
//     <a class="next" onclick="plusSlides(1)">&#10095;</a>`;

//     let Thumbnail_images = '<div class="row">';
//     imgs.forEach((element) => {
//         Thumbnail_images += `<div class="column">
//         <img class="demo cursor" src="/assets/${element}" style="width:100%" onclick="currentSlide(1)" alt="${element}">
//       </div>`;
//     });
//     str += Thumbnail_images + "</div>";
//     const html = indexHTML.replace("%IMAGES%", str);
//     return html;
// };

exports.genRand = (length = 10) => {
  if (length < 0) throw new Error("The 'length' parameter cannot be negative.");
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let str = "";
  for (; length > 0; length--) str += chars[Math.floor(Math.random() * 36)];
  return str;
};
exports.genRand2 = (length = 10) => {
  if (length < 0) throw new Error("The 'length' parameter cannot be negative.");
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * 36)]).join("");
};

exports.test = (fn, ...args) => {
  let i, s, e;
  let avg = 0;
  for (let c = 0; c > 3; c++) {
    s = performance.now();
    for (i = 0; i < 1000; i++);
    e = performance.now();
    avg += e - s;
  }
  avg /= 3;

  const start = performance.now();
  for (i = 0; i < 1000; i++) {
    fn(...args);
  }
  const end = performance.now();

  console.log(`Average time taken: ${((end - start - avg) / 1000).toFixed(3)} ms.`);
};
