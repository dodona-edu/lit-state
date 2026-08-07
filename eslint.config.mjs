import js from "@eslint/js";
import tseslint from "typescript-eslint";
import {defineConfig} from "eslint/config";

export default defineConfig([
    { ignores: ["dist"] },
    {
        files: ["{src,test}/**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: {js},
        extends: ["js/recommended"]
    },
    tseslint.configs.recommended,
]);
