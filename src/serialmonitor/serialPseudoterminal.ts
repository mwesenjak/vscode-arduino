import { Event, Pseudoterminal, TerminalDimensions, EventEmitter } from "vscode";
import { SerialPortCtrl } from "./serialportctrl";

export class SerialPseudoterminal implements Pseudoterminal {

    private _dimensions: TerminalDimensions = null;

    private _serialPortCtrl: SerialPortCtrl;

    private _ibuf: string = '';

    private _writeEmitter = new EventEmitter<string>();

    public onDidClose: Event<void|number>;
    public onDidOverrideDimensions: Event<TerminalDimensions | undefined>;
    public onDidWrite: Event<string> = this._writeEmitter.event;

    private submitIbufIfNeeded() {
        var index = -1;
        while ((index = this._ibuf.indexOf('\r\n')) >= 0) {
            // submit line-by-line if there was a copy-paste
            // grab data to-be-submitted
            var data = this._ibuf.substr(0, index);
            // here we must send all data to the actual device.
            if (this._serialPortCtrl !== null) {
                this._serialPortCtrl.sendMessage(data).then(() => {
                    
                }).catch(e => {
                    this._writeEmitter.fire("[ERROR] failed to send data...\r\n");
                })
            }
            // update input buffer
            this._ibuf = this._ibuf.substr(index + 2);
        }
    }

    
    public setSerialPortControl(ctrl: SerialPortCtrl) {
        this._serialPortCtrl = ctrl;
    }
    
    public appendLine(data: string) {
        this._writeEmitter.fire(data + '\r\n');
    }
    
    public append(data: string) {
        this._writeEmitter.fire(data);
    }
    
    // --------------- INTERFACE IMPLEMENTATIONS ---------------
    
    public handleInput(data: string) {
        // input is usually a key-by-key. we will only submit it when the user hits enter!
        // also, on newlines we will only receive \r
        // therefore we do a simple string replace 
        var value = data.replace('\r', '\r\n');
        this._ibuf += value;
        this.submitIbufIfNeeded();
        // also print it to the terminal
        this.append(value);
    }

    public close() {

    }
    
    public open(dimensions: TerminalDimensions|undefined) {
        if (typeof dimensions !== "undefined") {
            this.setDimensions(dimensions);
        }
    }

    public setDimensions(dimensions: TerminalDimensions) {

    }

}