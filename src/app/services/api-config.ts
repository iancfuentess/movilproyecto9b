import { Injectable } from "@angular/core";
import { Preferences } from "@capacitor/preferences";

@Injectable({ providedIn: "root" })
export class ApiConfigService {
  private readonly key = "api_host";
  private readonly apiFolder = "ionic-api";

  normalizarHost(valor: string): string {
    let host = valor.trim();
    host = host.replace(/^https?:\/\//i, "");
    host = host.replace(/\/+$/, "");
    if (!host) return "";
    if (!host.includes(":")) host += ":80";
    return host;
  }

  async guardarHost(valor: string): Promise<string> {
    const host = this.normalizarHost(valor);
    if (!host) throw new Error("Debes indicar la IP del servidor.");
    await Preferences.set({ key: this.key, value: host });
    console.log("Servidor API guardado:", host);
    return host;
  }

  async obtenerHost(): Promise<string> {
    const resultado = await Preferences.get({ key: this.key });
    return resultado.value || "localhost:80";
  }

  async endpoint(archivo: string): Promise<string> {
    const host = await this.obtenerHost();
    return `http://${host}/${this.apiFolder}/${archivo}`;
  }
}
