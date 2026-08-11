import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

// Vite Library Build Configuration for LinkAnimation Class
export default defineConfig({
  plugins: [
    dts({
      bundleTypes: true,
      tsconfigPath: "./tsconfig.json",
    }),
  ],
  build: {
    outDir: "dist-lib",
    lib: {
      entry: path.resolve(__dirname, "src/utils/LinkAnimation.ts"),
      name: "LinkAnimation",
      fileName: (format) => `link-animation.${format}.js`,
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
  },
});
