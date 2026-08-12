// ponytail: vitest jsdom loads this config for CSS modules — @tailwindcss/postcss is not a valid vite plugin in that pipeline; skip it during tests
const isVitest = process.env.VITEST === "true" || process.env.VITEST === "1";
const config = {
  plugins: isVitest ? [] : ["@tailwindcss/postcss"],
};

export default config;
