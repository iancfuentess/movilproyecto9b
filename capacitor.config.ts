import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "io.ionic.demo.pg.cap.ng",
  appName: "proyecto9b",
  webDir: "www",

  server: {
    androidScheme: "http",
    hostname: "localhost",
    cleartext: true,
  },
};

export default config;
