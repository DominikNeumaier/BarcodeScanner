import { Component, OnInit } from '@angular/core';
import { Barcode, BarcodeFormat, BarcodeScanner, ReadBarcodesFromImageOptions } from '@capacitor-mlkit/barcode-scanning';
import { AlertController, ActionSheetController } from '@ionic/angular';
import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';


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

    console.log("Test");
    console.log(barcodes.length);

    if(barcodes.length == 0){
      const alert = await this.alertController.create({
        header: 'QR-Code Nix gut diese',
        message: 'Mies. Du Noob. Nix QR-Code. Mach neu',
        buttons: ['Vallah Kriese'],
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
    console.error("Erwin,Domi, Fabi");
    console.error(barcodes.length);

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


  async openActionSheet(option: any) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Options',
      buttons: [
        {
          text: option.text,
          handler: option.handler
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  handleOptionClick(optionText: string) {
    console.log(optionText + ' clicked');
  }
}
