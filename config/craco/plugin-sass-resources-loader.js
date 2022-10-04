const mergician = require("mergician");
const path = require("path");
const fs = require("fs");

const sassResourcesLoader = require("sass-resources-loader");

/**
 * Gets the declared SCSS resources.
 * This is specified as the "sassResources" field in the package.json.
 */
function getDeclaredResources(root) {
    const packageJsonPath = path.join(root, "package.json");
    const package = JSON.parse(fs.readFileSync(packageJsonPath), {encoding: 'utf8'});
    
    if (package["sassResources"] != null) {
        return package["sassResources"];
    }

    return [];
}

module.exports = {
  overrideWebpackConfig: ({ webpackConfig, pluginOptions }) => {
    const options = mergician(
      {
        hoistUseStatements: true,
      },
      pluginOptions == null ? {} : pluginOptions
    );

    // Add the default resources.
    // FIXME(eth-p): Is therer a better way of getting the project root?
    if (options.resources == null) {
      options.resources = getDeclaredResources(
        path.dirname(path.dirname(webpackConfig.entry))
      );
    }

    // Bail early if there are no resources.
    // This will prevent a compile error.
    if (options.resources instanceof Array && options.resources.length === 0) {
        return webpackConfig;
    }

    // Inject into the existing loaders.
    const regexMatchingRegex = /scss|sass/;
    webpackConfig.module.rules

      // Every ruleset that has array `oneOf`.
      .filter((rule) => rule.oneOf != null)
      .map((rule) => rule.oneOf)
      .flat()

      // Every rule that matches "scss" or "sass".
      .filter((rule) => rule.test != null && rule.use != null)
      .filter((rule) => regexMatchingRegex.test(rule.test.toString()))

      // Inject the loader.
      .forEach((rule) => {
        rule.use.push({
          loader: "sass-resources-loader",
          options: options,
        });
      });

    return webpackConfig;
  },
};
