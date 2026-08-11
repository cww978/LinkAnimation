import { defineConfig } from "vite";
import path from "path";
import dts from "vite-plugin-dts";

// Vite Library Build Configuration for LinkAnimation Class
export default defineConfig({
  plugins: [
    dts({
      include: ["src/utils/LinkAnimation.ts", "src/utils/**/*.ts", "src/types/**/*.ts"],
      tsconfigPath: "./tsconfig.json",
      insertTypesEntry: true,
    }),
  ],
  build: {
    copyPublicDir: false,
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
