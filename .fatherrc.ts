import { defineConfig } from "father"

export default defineConfig({
    esm: {},
    cjs: {},
    targets: { chrome: 90, node: 18 },
    sourcemap: true
})
