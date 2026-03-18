import Invoice from '../model/invoiceModel.js';
import Student from '../model/studentModel.js';
import Brand from '../model/brandModel.js';
import Customer from '../model/customerModel.js';
import { generateInvoiceInternal } from '../helpers/invoiceHelper.js';

export const createInvoice = async (req, res) => {
    try {
        const invoiceData = {
            ...req.body,
            createdBy: req.user.id
        };

        const newInvoice = await generateInvoiceInternal(invoiceData);
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
            .populate('brand', 'name logo address phone email code')
            .sort({ createdAt: -1 });

        // Robust manual population
        const processedInvoices = await Promise.all(invoices.map(async (inv) => {
            const invoice = inv.toObject();
            const preferredModel = invoice.customerModel || 'Customer';

            let person = null;
            if (preferredModel === 'Student') {
                person = await Student.findById(invoice.customer).select('fullName email phone1');
            } else {
                person = await Customer.findById(invoice.customer).select('fullName email phone1');
            }

            // Fallback if not found in preferred model
            if (!person) {
                const otherModel = preferredModel === 'Student' ? Customer : Student;
                person = await otherModel.findById(invoice.customer).select('fullName email phone1');
                if (person) {
                    // Auto-fix the model type
                    await Invoice.findByIdAndUpdate(inv._id, {
                        customerModel: preferredModel === 'Student' ? 'Customer' : 'Student'
                    });
                }
            }

            if (person) {
                invoice.customer = person;
            }
            return invoice;
        }));

        res.status(200).json(processedInvoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('brand', 'name logo address phone email code');

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const invoiceObj = invoice.toObject();
        const preferredModel = invoiceObj.customerModel || 'Customer';

        let person = null;
        if (preferredModel === 'Student') {
            person = await Student.findById(invoiceObj.customer).select('fullName email phone1 place address');
        } else {
            person = await Customer.findById(invoiceObj.customer).select('fullName email phone1 place address');
        }

        // Fallback
        if (!person) {
            const otherModel = preferredModel === 'Student' ? Customer : Student;
            person = await otherModel.findById(invoiceObj.customer).select('fullName email phone1 place address');
            if (person) {
                await Invoice.findByIdAndUpdate(invoice._id, {
                    customerModel: preferredModel === 'Student' ? 'Customer' : 'Student'
                });
            }
        }

        if (person) {
            invoiceObj.customer = person;
        }

        res.status(200).json(invoiceObj);
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
