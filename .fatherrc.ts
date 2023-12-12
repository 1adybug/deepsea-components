import { defineConfig } from "father"

export default defineConfig({
    esm: {
        input: "src",
        output: "dist"
    },
    sourcemap: true,
    targets: { chrome: 90 }
})
