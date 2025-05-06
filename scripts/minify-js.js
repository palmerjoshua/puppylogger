const fs = require("fs");
const path = require("path");
const terser = require("terser");

const inputDir = path.join(__dirname, "../dist/js");

fs.readdirSync(inputDir).forEach(async (file) => {
  if (file.endsWith(".js")) {
    const filePath = path.join(inputDir, file);
    const code = fs.readFileSync(filePath, "utf8");
    const result = await terser.minify(code, {
      compress: true,
      mangle: true,
    });

    if (result.code) {
      fs.writeFileSync(filePath, result.code, "utf8");
      console.log(`Minified: ${file}`);
    } else {
      console.error(`Failed to minify: ${file}`);
    }
  }
});
