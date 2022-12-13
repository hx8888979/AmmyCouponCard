import * as pdfFonts from 'pdfmake/build/vfs_fonts.js';
// installed by Tampermonkey
const pdfMake = (window as any).pdfMake;
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

const template = (name: string) => ([
    { "image": "logo", "width": 70, "alignment": "center" },
    " ",
    { "text": ["Hi ", { "text": `${name}`, "bold": false }, ":"] },
    { "text": ["Thank you for your purchasing and supporting. For your next purchase, use coupon code: ", { "text": "THANKYOU27", "bold": true, "color": "#76ABEE" }, " and get 10% discount on any product."] },
    " ",
    { "text": ["If you have any feedbacks or questions, Email me at ", { "text": "info@ammy.studio", "color": "#76ABEE", "bold": true }] },
    " ",
    { "columns": [{ "image": "instagram", "width": 25 }, { "stack": [" ", "Instagram Account:"] }] },
    { "text": "ammy_handmade_studio", "color": "#DEA9FF", "bold": true },
    { "columns": [{ "image": "shop", "width": 25 }, { "stack": [" ", "Shopping Link:"] }] },
    { "text": "Ammy.studio", "color": "#DEA9FF", "bold": true },
    " ",
    "Best Regards,"
]);

const createDashLine = () => (
    {
        canvas: [
            {
                type: 'line',
                x1: 0, y1: 395,
                x2: 612, y2: 395,
                dash: { length: 1, space: 5 },
            },
            {
                type: 'line',
                x1: 306, y1: 0,
                x2: 306, y2: 791,
                dash: { length: 1, space: 5 },

            }
        ],
        absolutePosition: { x: 0, y: 0 }
    }
);

function generateContent(names: string[]) {
    const pairs = names.reduce(
        (accumulator, _, currentIndex, array) => {
            if (currentIndex % 2 === 0) {
                accumulator.push(array.slice(currentIndex, currentIndex + 2));
            }
            return accumulator;
        }, [] as string[][]
    );
    return pairs.reduce(
        (accumulator, pair, currentIndex) => {
            const columns = pair.reduce(
                (accumulator, name, currentIndex) => {
                    accumulator.push({ stack: template(name), width: 226 });
                    if (currentIndex === 0) {
                        accumulator.push({});
                    }
                    return accumulator;
                }, [] as any[]
            );

            const breakPage = currentIndex % 2 !== 0;
            const element: any[] = [{ columns, ...(breakPage ? { pageBreak: "after" } : {}) }];
            if (!breakPage) {
                element.push(Array(12).fill(' '));
                element.push(createDashLine());
            }

            accumulator.push(element);
            return accumulator;
        }, [] as any);
}

const pdfConfig = (names: string[]) => ({
    pageSize: 'LETTER',
    pageMargins: [40, 20, 40, 20],
    defaultStyle: {
        fontSize: 10
    },
    content: generateContent(names),
    images: {
        logo: "data:image/jpeg;base64,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",
        instagram: "data:image/png;base64,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",
        shop: "data:image/png;base64,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"
    }
});

export function generatePDF(names: string[]) {
    pdfMake.createPdf(pdfConfig(names)).open();
}