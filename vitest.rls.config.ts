import { defineConfig } from "vitest/config";

// Suite de integración: pega contra la base remota con la clave anónima para
// comprobar el RLS. Va en un config aparte para que `npm test` siga siendo
// unitario y no dependa de la red.
export default defineConfig({
  test: {
    include: ["pruebas/**/*.test.ts"],
    environment: "node",
    testTimeout: 20000,
  },
});
