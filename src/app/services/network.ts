import { Injectable } from "@angular/core";
import { Network } from "@capacitor/network";

@Injectable({
  providedIn: "root",
})
export class NetworkService {
  async hayConexion(): Promise<boolean> {
    const estado = await Network.getStatus();

    console.log("Estado de conexión:", estado);

    return estado.connected;
  }
}
