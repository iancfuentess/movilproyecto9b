import { Component } from "@angular/core";
import { CommonModule, NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IonContent } from "@ionic/angular";

@Component({
  selector: "app-tab1",
  templateUrl: "tab1.page.html",
  styleUrls: ["tab1.page.scss"],
  standalone: true,
  imports: [IonContent, CommonModule, NgClass, FormsModule],
})
export class Tab1Page {
  // Modelos de entrada
  username = "";
  password = "";

  // Estados de foco
  userFocus = false;
  passFocus = false;

  // Estados de la animación
  isTest = false;
  isTestTwo = false;
  showFields = true;
  showSuccess = false;

  // Overlay de autenticación
  authentDisplay = "none";
  authentRight = 90;
  authentOpacity = 0;
  isAuthentVisible = false;

  login() {
    this.isTest = true;

    setTimeout(() => {
      this.isTestTwo = true;
    }, 300);

    setTimeout(() => {
      this.authentDisplay = "block";
      this.authentRight = -320;
      this.authentOpacity = 1;
      this.isAuthentVisible = true;
    }, 500);

    setTimeout(() => {
      this.authentRight = 90;
      this.authentOpacity = 0;
      this.isAuthentVisible = true;
      this.isTestTwo = false;
    }, 2500);

    setTimeout(() => {
      this.isTest = false;
      this.showFields = false;
    }, 2800);

    setTimeout(() => {
      this.showSuccess = true;
    }, 3200);
  }
}
