const mergician = require("mergician");
const surgeConfig = require("./craco.config");

// Configuration wrapper.
module.exports = (config, options) => {
	const opts = options ?? {};
	return mergician(opts.merge)(surgeConfig, config);
};

module.exports.default = module.exports;
