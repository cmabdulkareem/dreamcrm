import Invoice from '../model/invoiceModel.js';
import Customer from '../model/customerModel.js';
import Brand from '../model/brandModel.js';

export const createInvoice = async (req, res) => {
    try {
        const {
            customer,
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
            brand
        } = req.body;

        // Auto-generate invoice number (BrandCode-YEAR-SEQUENCE)
        const brandObj = await Brand.findById(brand);
        if (!brandObj) {
            return res.status(404).json({ message: 'Brand not found' });
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
            sequence = lastSeq + 1;
        }

        const invoiceNumber = `${brandCode}-${currentYear}-${sequence.toString().padStart(4, '0')}`;

        const newInvoice = new Invoice({
            invoiceNumber,
            customer,
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
            createdBy: req.user._id
        });

        await newInvoice.save();
        res.status(201).json(newInvoice);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getInvoices = async (req, res) => {
    try {
        const { brand, status, customer } = req.query;
        const filter = {};
        if (brand) filter.brand = brand;
        if (status) filter.status = status;
        if (customer) filter.customer = customer;

        const invoices = await Invoice.find(filter)
            .populate('customer', 'fullName email phone1')
            .sort({ createdAt: -1 });

        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer', 'fullName email phone1 place')
            .populate('brand', 'name logo address phone email code');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateInvoice = async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { ...req.body },
            { new: true }
        );
        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json(updatedInvoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
