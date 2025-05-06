const { DateTime } = require('luxon');
const htmlmin = require("html-minifier-terser");

module.exports = function (eleventyConfig) {

  // Copy any static assets you drop under /static
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addPassthroughCopy({ "src/js": "/js" });

    // Add a Nunjucks/Liquid/JS universal filter that returns the current year
  eleventyConfig.addFilter("year", () => DateTime.local().toFormat("yyyy"));

  eleventyConfig.addFilter("date", (value, fmt = "yyyy-MM-dd") =>
    DateTime.fromJSDate(value instanceof Date ? value : new Date(value))
            .toFormat(fmt)
  );

  eleventyConfig.addTransform("htmlmin", function (content) {
		if ((this.page.outputPath || "").endsWith(".html")) {
			let minified = htmlmin.minify(content, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true
			});

			return minified;
		}

		// If not an HTML output, return content as-is
		return content;
	});

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "dist",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
