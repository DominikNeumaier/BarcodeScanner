import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeFormat, BarcodeScanner, ReadBarcodesFromImageOptions, BarcodeValueType} from '@capacitor-mlkit/barcode-scanning';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';
import { AppLauncher} from '@capacitor/app-launcher';
import { Preferences } from '@capacitor/preferences';
import { FilePicker } from '@capawesome/capacitor-file-picker';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})


export class HomePage implements OnInit {
  isSupported = false;
  barcodes: Barcode[] = [];

  constructor(private alertController: AlertController, private actionSheetController: ActionSheetController) {

  }

  //Lädt Barcodes von Key-Value-Speicher, falls vorhanden
  async initialize(){
    let promise = await Preferences.get({key: 'data'});

    if (promise.value != null){
      this.barcodes = JSON.parse(promise.value!);
    }
  }

  //Speichert Barcodes in Key-Value-Speicher
  async safeBarcodes(){
    let value = JSON.stringify(this.barcodes);
    await Preferences.set({key: "data", value: value});
  }

  //Prüft ob Barcode-Scanner unterstützt wird
  ngOnInit() {
    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
    this.initialize();
  }

  //Funktion um QR-Codes aus der Galerie zu importieren
  async pickImage(): Promise<void> {

    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }

    const pickImage = async () => {
      const { files } = await FilePicker.pickImages({
        multiple: true,
      });
      return files[0];
    };

    const pickedImage = await pickImage();
    const { barcodes } = await BarcodeScanner.readBarcodesFromImage({
      formats: [BarcodeFormat.QrCode],
      path: pickedImage.path!,
    });


    if(barcodes.length == 0){
      const alert = await this.alertController.create({
        header: 'QR-Code konnte nicht gelesen werden!',
        message: 'Bitte importiere den QR-Code erneut.',
        buttons: ['Wallah Kriese'],
      });
      await alert.present();

    } else {

      this.barcodes.push(...barcodes);
      this.safeBarcodes();
    }

  }

  //Funktion um QR-Codes über die Kamera auszulesen
  async scan(): Promise<void> {

    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }

    const { barcodes } = await BarcodeScanner.scan();
    this.barcodes.push(...barcodes);
    this.safeBarcodes();
  }

  //Prüft, ob Kamera-Berechtigungen vorhanden sind
  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  //Informiert über notwendige Berechtigungen
  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }

  //Zeigt Options-Menü für einen Barcode an
  async openActionSheet(barcode: any) {
    let buttons : Array<any> = [
                           {
                             text: "Share",
                             handler: async() => {
                               await Share.share({text: barcode.displayValue});
                             }
                           },
                           {
                             text: "Copy",
                             handler: async() => {
                               await Clipboard.write({string: barcode.displayValue});
                             }

                           },
                           {
                             text: "Delete",
                             handler: async() => {
                               this.barcodes = this.barcodes.filter(obj => obj !== barcode);
                                this.safeBarcodes();
                               }
                           },
                           {
                             text: 'Cancel',
                             role: 'cancel'
                           }];

    //Öffnen von Barcodes mit dem Typ URL in In-App-Browser
    if (barcode.valueType == BarcodeValueType.Url){
      buttons.unshift({
        text: "Open in Browser",
        handler: async() => {
          Browser.open({url: barcode.displayValue});
        }
      });
    }

    //Öffnen von Barcodes mit dem Typ Phone in Standard-Telefon-App
    if (barcode.valueType == BarcodeValueType.Phone){
      buttons.unshift({
        text: "Open in Contacts",
        handler: async() => {
          let number = barcode.displayValue;
          let uri = `tel:${number}`;

          let options = {
            url: uri
          };
          await AppLauncher.openUrl(options);
        }
      });
    }


    const actionSheet = await this.actionSheetController.create({
      header: 'Options',
      buttons: buttons
    });

    await actionSheet.present();
  }
}




