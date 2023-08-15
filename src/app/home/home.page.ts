import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeFormat, BarcodeScanner, ReadBarcodesFromImageOptions, BarcodeValueType} from '@capacitor-mlkit/barcode-scanning';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';
import { AppLauncher} from '@capacitor/app-launcher';

import { FilePicker } from '@capawesome/capacitor-file-picker';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {
  isSupported = false;
  barcodes: Barcode[] = [];

  constructor(private alertController: AlertController, private actionSheetController: ActionSheetController) {}

  ngOnInit() {
    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
  }

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
        header: 'QR-Code Nix gut diese',
        message: 'Mies. Du Noob. Nix QR-Code. Mach neu',
        buttons: ['Wallah Kriese'],
      });
      await alert.present();
    } else {
      this.barcodes.push(...barcodes);
    }

  }

  async scan(): Promise<void> {

    const granted = await this.requestPermissions();
    if (!granted) {
      this.presentAlert();
      return;
    }
    const { barcodes } = await BarcodeScanner.scan();
    this.barcodes.push(...barcodes);
  }

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  async presentAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message: 'Please grant camera permission to use the barcode scanner.',
      buttons: ['OK'],
    });
    await alert.present();
  }

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
                               }
                           },
                           {
                             text: 'Cancel',
                             role: 'cancel'
                           }];

    if (barcode.valueType == BarcodeValueType.Url){
      buttons.unshift({
        text: "Open in Browser",
        handler: async() => {
          this.barcodes = this.barcodes.filter(obj => obj !== barcode);
          Browser.open({url: barcode.displayValue});
        }
      });
    }

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




