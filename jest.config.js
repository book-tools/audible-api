/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  roots: ["<rootDir>/src"],
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "\\.[jt]sx?$": [
      "babel-jest",
      {
        babelrc: false,
        presets: ["@babel/preset-typescript"],
        plugins: ["@babel/plugin-proposal-optional-chaining"],
      },
    ],
  },
};
