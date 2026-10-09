import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  // Images come straight from the Data Dragon CDN, not next/image.
  { rules: { "@next/next/no-img-element": "off" } },
];

export default eslintConfig;
