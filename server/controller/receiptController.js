import ReceiptVoucher from "../model/receiptModel.js";
import Invoice from "../model/invoiceModel.js";

// Generate Receipt Number
const generateReceiptNumber = async (brandId) => {
    const today = new Date();
    const year = today.getFullYear();
    const count = await ReceiptVoucher.countDocuments({
        brand: brandId,
        paymentDate: {
            $gte: new Date(year, 0, 1),
            $lte: new Date(year, 11, 31)
        }
    });
    return `REC-${year}-${(count + 1).toString().padStart(4, '0')}`;
};

export const createReceipt = async (req, res, next) => {
    try {
        const { invoiceId, amount, paymentDate, paymentMode, referenceNumber, notes } = req.body;
        const brandId = req.brandFilter.brand;
        const userId = req.user.id;

        const invoice = await Invoice.findOne({ _id: invoiceId, brand: brandId });
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Validate amount
        if (amount <= 0) {
            return res.status(400).json({ message: "Payment amount must be greater than 0" });
        }

        // Calculate effective balance due dynamically to handle legacy data where balanceDue might be 0/undefined
        const currentAmountReceived = invoice.amountReceived || 0;
        const effectiveBalanceDue = invoice.totalAmount - currentAmountReceived;

        // Allow a small margin of error for floating point calc if needed, but strict check is usually safer for finance
        if (amount > effectiveBalanceDue) {
            return res.status(400).json({ message: `Payment amount exceeds balance due (${effectiveBalanceDue})` });
        }

        const receiptNumber = await generateReceiptNumber(brandId);

        const newReceipt = new ReceiptVoucher({
            receiptNumber,
            invoice: invoiceId,
            customer: invoice.customer,
            amount,
            paymentDate: paymentDate || new Date(),
            paymentMode,
            referenceNumber,
            notes,
            brand: brandId,
            createdBy: userId
        });

        await newReceipt.save();

        // Update Invoice Fields
        invoice.amountReceived = (invoice.amountReceived || 0) + Number(amount);
        invoice.balanceDue = invoice.totalAmount - invoice.amountReceived;

        // Update Status
        if (invoice.balanceDue <= 0) { // Using <= in case of small floating point diffs, though logic prevented overpayment
            invoice.status = 'Paid';
            invoice.balanceDue = 0; // Ensure no negative zero
        } else {
            invoice.status = 'Partial';
        }

        await invoice.save();

        const populatedReceipt = await ReceiptVoucher.findById(newReceipt._id)
            .populate('customer', 'fullName phone email')
            .populate('invoice', 'invoiceNumber totalAmount balanceDue')
            .populate('brand', 'name logo address phone email');

        res.status(201).json(populatedReceipt);
    } catch (error) {
        next(error);
    }
};

export const getReceiptsByInvoice = async (req, res, next) => {
    try {
        const { invoiceId } = req.params;
        const brandId = req.brandFilter.brand;

        // Verify invoice belongs to brand
        const invoice = await Invoice.findOne({ _id: invoiceId, brand: brandId });
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const receipts = await ReceiptVoucher.find({ invoice: invoiceId, brand: brandId })
            .populate('createdBy', 'name')
            .sort({ paymentDate: -1 });

        res.status(200).json(receipts);
    } catch (error) {
        next(error);
    }
};

export const getReceipt = async (req, res, next) => {
    try {
        const { id } = req.params;
        const brandId = req.brandFilter.brand;

        const receipt = await ReceiptVoucher.findOne({ _id: id, brand: brandId })
            .populate('customer', 'fullName phone email address')
            .populate('invoice', 'invoiceNumber invoiceDate totalAmount balanceDue')
            .populate('brand', 'name logo address phone email')
            .populate('createdBy', 'name');

        if (!receipt) {
            return res.status(404).json({ message: "Receipt not found" });
        }

        res.status(200).json(receipt);
    } catch (error) {
        next(error);
    }
};
