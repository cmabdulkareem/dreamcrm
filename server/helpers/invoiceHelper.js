import Invoice from '../model/invoiceModel.js';
import Brand from '../model/brandModel.js';

/**
 * Internal function to generate and save an invoice
 */
export const generateInvoiceInternal = async (data) => {
    const {
        customer,
        customerModel,
        invoiceDate,
        dueDate,
        items,
        subTotal,
        tax,
        discount,
        totalAmount,
        status,
        notes,
        terms,
        brand,
        createdBy
    } = data;

    // Auto-generate invoice number (BrandCode-YEAR-SEQUENCE)
    const brandObj = await Brand.findById(brand);
    if (!brandObj) {
        throw new Error('Brand not found');
    }

    const brandCode = brandObj.code || 'INV';
    const currentYear = new Date().getFullYear();

    // Find latest invoice for this brand and year to increment sequence
    const latestInvoice = await Invoice.findOne({
        brand,
        invoiceNumber: new RegExp(`^${brandCode}-${currentYear}-`)
    }).sort({ createdAt: -1 });

    let sequence = 1;
    if (latestInvoice) {
        const parts = latestInvoice.invoiceNumber.split('-');
        const lastSeq = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastSeq)) {
            sequence = lastSeq + 1;
        }
    }

    const invoiceNumber = `${brandCode}-${currentYear}-${sequence.toString().padStart(4, '0')}`;

    const newInvoice = new Invoice({
        invoiceNumber,
        customer,
        customerModel: customerModel || 'Customer',
        invoiceDate: invoiceDate || new Date(),
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
        items,
        subTotal,
        tax: tax || 0,
        discount: discount || 0,
        totalAmount,
        status: status || 'Draft',
        notes: notes || '',
        terms: terms || '',
        brand,
        createdBy
    });

    return await newInvoice.save();
};
