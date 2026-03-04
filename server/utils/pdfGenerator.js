import puppeteer from 'puppeteer';

/**
 * Generates a PDF buffer from an HTML string using Puppeteer.
 * @param {string} html - The HTML content to render.
 * @param {Object} options - PDF generation options (headerTemplate, footerTemplate, etc.)
 * @returns {Promise<Buffer>} - The generated PDF buffer.
 */
export const generatePdfFromHtml = async (html, options = {}) => {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set a standard viewport
        await page.setViewport({
            width: 1280,
            height: 1810,
            deviceScaleFactor: 1,
        });

        // Set content
        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Generate PDF
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: !!(options.headerTemplate || options.footerTemplate),
            headerTemplate: options.headerTemplate || '<span></span>',
            footerTemplate: options.footerTemplate || '<span></span>',
            margin: {
                top: options.marginTop || '20mm',
                right: options.marginRight || '15mm',
                bottom: options.marginBottom || '20mm',
                left: options.marginLeft || '15mm'
            }
        });

        return pdfBuffer;
    } catch (error) {
        console.error('Puppeteer PDF Generation Error:', error);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
