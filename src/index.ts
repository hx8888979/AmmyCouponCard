/** test */
import { generatePDF } from "./pdf";
import { AmmyPrinter } from "./printPDF";
import { xmlhttpRequest } from "./util";

interface Store {
    getState(): any;
    subscribe(listener: any): any;
}

class AmmyCouponCards {
    protected store: Store;
    protected button: HTMLButtonElement;
    protected printButton?: HTMLButtonElement;

    private findStore(): Store {
        const rootElement = document.getElementById('root');
        if (!rootElement) {
            throw new Error('Root element not found');
        }
        const rootPropNames = Object.getOwnPropertyNames(rootElement);
        const rootPropName = rootPropNames.find((prop) => (rootElement as any)[prop].hasOwnProperty('props'));
        if (!rootPropName) {
            throw new Error('Root element has no props property');
        }

        const rootProps = (rootElement as any)[rootPropName]['props'];
        try {
            const store = rootProps['children'][0]['props']['store'];
            return store;
        } catch (e) {
            throw new Error('No store found');
        }
    }

    protected injectButton() {
        const browseView = document.getElementById('browse-view');
        const headerView = browseView?.firstChild?.firstChild?.firstChild;
        if (!headerView) {
            throw new Error('Header view not found');
        }
        const span = document.createElement('span');
        span.innerHTML = '<button id="ammy-coupon-card" class="btn btn-secondary ml-xs-2 mb-xs-1"<span><span class="etsy-icon icon-smaller icon-b-1"><svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 24 24"><path d="M4 17v2h16v-2ZM4 6h2.2q-.125-.225-.163-.475Q6 5.275 6 5q0-1.25.875-2.125T9 2q.75 0 1.387.387.638.388 1.113.963L12 4l.5-.65q.45-.6 1.1-.975Q14.25 2 15 2q1.25 0 2.125.875T18 5q0 .275-.038.525-.037.25-.162.475H20q.825 0 1.413.588Q22 7.175 22 8v11q0 .825-.587 1.413Q20.825 21 20 21H4q-.825 0-1.412-.587Q2 19.825 2 19V8q0-.825.588-1.412Q3.175 6 4 6Zm0 8h16V8h-5.1l2.1 2.85L15.4 12 12 7.4 8.6 12 7 10.85 9.05 8H4Zm5-8q.425 0 .713-.287Q10 5.425 10 5t-.287-.713Q9.425 4 9 4t-.712.287Q8 4.575 8 5t.288.713Q8.575 6 9 6Zm6 0q.425 0 .713-.287Q16 5.425 16 5t-.287-.713Q15.425 4 15 4t-.712.287Q14 4.575 14 5t.288.713Q14.575 6 15 6Z"/></svg></span><span class="hide-lg-down ml-xs-1">Get coupon cards</span><span class="hide-xl-up hide-xs ml-xs-1">Get cards</span></span></button>';
        const button = span.firstChild as HTMLButtonElement;
        const state = this.store.getState();
        button.disabled = state.ui.orders_list.selected_order_ids.count() == 0;
        headerView.appendChild(span);
        return button;
    }

    protected async injectPrintButton() {
        this.printButton = document.createElement('button');
        const findFooter = new Promise((resolve, reject) => {
            let retry = 0;
            const finder = () => {
                const root = document.querySelector(".overlay-footer");
                if (root) {
                    resolve(root);
                } else {
                    retry += 1;
                    if (retry <= 6) {
                        setTimeout(finder, 500)
                    } else {
                        reject();
                    }
                }
            }
            setTimeout(finder, 0)
        });

        try {
            const overlayFooter = (await findFooter as HTMLElement)?.firstChild;
            const span = document.createElement('span') as HTMLSpanElement;
            span.appendChild(this.printButton);
            span.style.display = "inline-flex";

            this.printButton.className = "btn btn-orange";
            this.printButton.innerText = "Ammy Printer";
            span.setAttribute("data-tooltip", "Unable to connect to printer or busy");
            this.printButton.disabled = true;

            overlayFooter?.appendChild(span);

            try {
                const response = await xmlhttpRequest("GET", "http://ammyprinter.local/api/info");
                const data = JSON.parse(response.response);

                if (data.status === 1) {
                    span.removeAttribute("data-tooltip");
                    this.printButton.disabled = false;
                    this.printButton.onclick = this.onPrintButtonClick.bind(this);
                }
            } catch {
                console.error("cann't connect to printer");
            }

        } catch {
            this.printButton = undefined;
        }
    }

    protected storeHandler() {
        const state = this.store.getState();
        this.button.disabled = state.ui.orders_list.selected_order_ids.count() == 0;
        if (state.ui.print_shipping_labels_overlay.is_shown) {
            if (!this.printButton) {
                this.injectPrintButton();
            }
        } else {
            this.printButton = undefined;
        }
    }

    protected onPrintButtonClick() {
        const state = this.store.getState();
        const url = `${state.ui.print_shipping_labels_overlay.download_url}&print_format=single_flush&include_order_details=0`;
        (document.querySelector(".overlay-footer div button.btn-secondary") as HTMLButtonElement)?.click();
        new AmmyPrinter(url);
    }

    protected onButtonClick() {
        const state = this.store.getState();
        const selectedOrderIds = state.ui.orders_list.selected_order_ids;
        const buyer_names = selectedOrderIds.map((id: number) => state.fulfillment.dataV2.orders.entities[id].fulfillment.to_address.name.split(' ')[0]);
        generatePDF(buyer_names.toArray());
    }

    constructor() {
        this.store = this.findStore();
        this.button = this.injectButton();
        this.button.addEventListener('click', this.onButtonClick.bind(this));

        this.store.subscribe(this.storeHandler.bind(this));
    }
}

(() => {
    const init = () => {
        const root = document.getElementById('root');
        if (root && root.hasChildNodes()) {
            (window as any).ammyCouponCards = new AmmyCouponCards();
        }
        else {
            setTimeout(init, 1000);
        }
    }
    setTimeout(init, 1000);
})();
