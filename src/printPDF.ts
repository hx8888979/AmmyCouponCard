import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { xmlhttpRequest } from "./util";

const scale = 2.75;
GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.3.122/pdf.worker.min.js';

const beforeCMDs = [
  "CLS"
];

const afterCMDs = [
  "PRINT 1"
];

function getCMD(bitmap: Uint8Array) {
  const encoder = new TextEncoder();
  const before = encoder.encode(`${beforeCMDs.join("\n")}\n`);
  const bitmapCMD = encoder.encode("BITMAP 20,0,99,1188,0,");
  const after = encoder.encode(`\n${afterCMDs.join("\n")}\n`);
  return new Blob([before.buffer, bitmapCMD.buffer, bitmap.buffer, after.buffer])
}

export class AmmyPrinter {
  url: string
  printButton?: HTMLButtonElement;
  printCancelButton?: HTMLButtonElement;
  canvas?: HTMLCanvasElement;
  buttonGroup?: HTMLDivElement;
  progressGroup?: HTMLDivElement;
  progress?: HTMLProgressElement;
  popup?: HTMLDivElement;

  constructor(url: string) {
    this.url = url;
    this.renderPreview();
    console.log(this);
  }

  renderPreview() {
    const popup = document.createElement('div');
    popup.className = "overlay-mask";
    popup.innerHTML = `<style>@media only screen and (min-width: 650px) {.pdf-width {min-width: 640px;max-width: 100% !important;}}@media only screen and (max-width: 649px) {.pdf-width {max-width: 535px !important;}}</style><div class="overlay-region"><div class="overlay-view pdf-width"><div class="overlay-header"><span class="overlay-title">Preview</span></div><div class="overlay-body"><div style="overflow-y: hidden;height: 590px;"><embed style="position: relative;top: -60px;width: 100%;height: 650px;" src="${this.url}"></div><div hidden><canvas id="ammy-print-render"></div></div><div class="overlay-footer clearfix"><div id="ammy-print-button-group"><button id="ammy-print-cancel"class="btn btn-secondary">Cancel</button><button id="ammy-print-print"class="btn btn-orange">Print</button></div><div id="ammy-print-progress-group" hidden><progress id="ammy-print-progress" value="0" max="100"></div></div></div></div>`;

    this.printButton = popup.querySelector("#ammy-print-print") as HTMLButtonElement;
    this.printCancelButton = popup.querySelector("#ammy-print-cancel") as HTMLButtonElement;
    this.canvas = popup.querySelector("#ammy-print-render") as HTMLCanvasElement;
    this.progress = popup.querySelector("#ammy-print-progress") as HTMLProgressElement;
    this.progressGroup = popup.querySelector("#ammy-print-progress-group") as HTMLDivElement;
    this.buttonGroup = popup.querySelector("#ammy-print-button-group") as HTMLDivElement;
    this.popup = popup;

    this.printCancelButton.onclick = () => popup.remove();
    this.printButton.onclick = () => this.printPDF();

    const root = document.getElementById("root");
    root?.appendChild(popup);
  }

  async printPDF() {
    this.buttonGroup!.hidden = true;
    this.progressGroup!.hidden = false;

    const loadingTask = getDocument(this.url);

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    this.progress!.max = numPages;
    const canvas = this.canvas!;
    canvas.width = 792;
    canvas.height = 1188;
    const context = canvas.getContext('2d')!;

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      const data = context.getImageData(0, 0, 792, 1188);
      const bitmap = new Uint8Array(117612);
      let pixel = 0, bytePixel = 0;
      data.data.forEach((value, index) => {
        pixel += value
        if (index % 4 === 3) {
          bytePixel = (bytePixel << 1) + (pixel < 1000 ? 0 : 1);
          pixel = 0;
        }
        if (index % 32 === 31) {
          bitmap[Math.floor(index / 32)] = bytePixel;
          bytePixel = 0;
        }
      });

      const cmd = getCMD(bitmap);
      try {
        const response = await xmlhttpRequest("POST", "http://ammyprinter.local/api/print", {
          data: cmd,
          binary: true
        });
      } catch {
        alert(`Page ${i+1} Print failed. Abort!`);
        return;
      }

      this.progress!.value = i + 1;
    }
    alert("Print finished!");
    this.popup!.remove();
  }
}

