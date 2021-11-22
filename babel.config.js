const { BABEL_ENV } = process.env;
const isCommonJS = BABEL_ENV !== undefined && BABEL_ENV === "cjs";
const isESM = BABEL_ENV !== undefined && BABEL_ENV === "esm";

const babelConfig = (api) => {
  api.cache(true);

  const presets = [
    [
      "@babel/env",
      {
        modules: isCommonJS ? "commonjs" : false,
        targets: {
          esmodules: isESM ? true : undefined,
        },
      },
    ],
    "@babel/preset-typescript",
  ];

  const plugins = ["@babel/plugin-proposal-class-properties"];

  return {
    presets,
    plugins,
  };
};

module.exports = babelConfig;
