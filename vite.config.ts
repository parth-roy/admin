// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: {
    // DigitalOcean/nginx/PM2 deployment needs a self-hosted Node listener.
    // The Lovable default is Cloudflare Worker output, which cannot be run by PM2.
    preset: "node-server",
    // Avoid Nitro beta's nf3/@vercel/nft tracing path on the droplet; bundle deps instead.
    // @ts-ignore
    noExternals: true,
  },
  vite: {
    server: {
      port: 5689,
      strictPort: true, // Fail if 5689 is busy — don't pick a random port
    },
    preview: {
      allowedHosts: ["admin.gomytruck.com"],
    },
  },
});
