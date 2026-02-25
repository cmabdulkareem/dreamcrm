import mongoose from 'mongoose';
import Payment from '../model/paymentModel.js';
import Student from '../model/studentModel.js';
import Customer from '../model/customerModel.js';
import Brand from '../model/brandModel.js';
import ReceiptVoucher from '../model/receiptModel.js';
import { getFinancialYearRange } from '../utils/dateUtils.js';
import { logActivity } from "../utils/activityLogger.js";
import { emitNotification } from '../realtime/socket.js';

// Create new payment
export const createPayment = async (req, res) => {
    try {
        const {
            studentId,
            leadId,
            amount,
            paymentDate,
            paymentMode,
            transactionId,
            remarks,
            brandId
        } = req.body;

        // Validate inputs
        if (!amount || !paymentMode || !paymentDate) {
            return res.status(400).json({ message: "Amount, Payment Mode, and Date are required." });
        }

        if (!studentId && !leadId) {
            return res.status(400).json({ message: "Payment must be associated with a Student or Lead." });
        }

        // Determine Brand
        // If brandId passed explicitly (e.g. from frontend form), use it.
        // Otherwise fallback to user's first brand or header.
        // Note: Creating payment usually requires strict brand context.
        let targetBrandId = brandId;
        if (!targetBrandId && req.brandFilter && req.brandFilter.brand) {
            targetBrandId = req.brandFilter.brand;
        }

        // Verify student/lead exists
        if (studentId) {
            const student = await Student.findById(studentId);
            if (!student) return res.status(404).json({ message: "Student not found." });
            if (!targetBrandId) targetBrandId = student.brand; // Fallback to student's brand
        } else if (leadId) {
            const lead = await Customer.findById(leadId);
            if (!lead) return res.status(404).json({ message: "Lead not found." });
            if (!targetBrandId) targetBrandId = lead.brand; // Fallback to lead's brand
        }

        if (!targetBrandId) {
            return res.status(400).json({ message: "Brand context missing for this payment." });
        }

        // Generate simple receipt number (timestamp + random)
        const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const newPayment = new Payment({
            student: studentId || null,
            lead: leadId || null,
            amount: parseFloat(amount),
            paymentDate: new Date(paymentDate),
            paymentMode,
            transactionId,
            remarks,
            collectedBy: req.user.id,
            brand: targetBrandId,
            receiptNumber
        });

        await newPayment.save();

        // Log activity
        await logActivity(req.user.id, 'CREATE', 'Finance', {
            entityId: newPayment._id,
            description: `Recorded payment of ₹${amount} for ${studentId ? 'student' : 'lead'}`
        });

        // Notification Logic
        try {
            const collectorName = req.user.fullName || "Unknown";
            const entity = studentId ? await Student.findById(studentId) : await Customer.findById(leadId);
            const entityName = entity ? entity.fullName : (studentId ? "Student" : "Lead");

            const notificationData = {
                userName: collectorName,
                action: 'collected payment of',
                entityName: `₹${amount} from ${entityName}`,
                module: 'Finance',
                actionUrl: `/finance`,
                metadata: { paymentId: newPayment._id },
                timestamp: new Date().toISOString()
            };

            emitNotification({
                brandId: targetBrandId,
                notification: notificationData
            });
        } catch (notifError) {
            console.error('Error sending payment notification:', notifError);
        }

        return res.status(201).json({
            message: "Payment recorded successfully.",
            payment: newPayment
        });

    } catch (error) {
        console.error("Error creating payment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get all payments (with filters)
export const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, startDate, endDate, studentId } = req.query;

        let query = {};

        // Apply Brand Filter
        if (req.brandFilter) {
            query = { ...query, ...req.brandFilter };
        }

        if (studentId) {
            query.student = studentId;
        }

        if (startDate && endDate) {
            query.paymentDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Search logic (complex due to refs) - for now keep simple or search by receipt/transaction
        if (search) {
            query.$or = [
                { receiptNumber: { $regex: search, $options: 'i' } },
                { transactionId: { $regex: search, $options: 'i' } },
                { remarks: { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Payment.find(query)
            .populate('student', 'firstName lastName fullName email phone')
            .populate('lead', 'fullName email phone1')
            .populate('collectedBy', 'fullName')
            .populate('brand', 'name')
            .sort({ paymentDate: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments(query);

        return res.status(200).json({
            payments,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            totalPayments: total
        });

    } catch (error) {
        console.error("Error fetching payments:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get Payment Stats for Dashboard
export const getPaymentStats = async (req, res) => {
    try {
        // Current state context
        let brandQuery = {};
        const headerBrandId = req.headers['x-brand-id'];

        if (headerBrandId) {
            brandQuery.brand = new mongoose.Types.ObjectId(headerBrandId);
        } else if (req.brandFilter) {
            brandQuery = { ...req.brandFilter };

            // If viewing All Brands and not a Global Admin, restrict to managed brands only
            // for the high-level stats view.
            if (!req.user.isAdmin) {
                const { getManagedBrandIds } = await import('../utils/roleHelpers.js');
                const managedBrandIds = getManagedBrandIds(req.user);
                brandQuery.brand = { $in: managedBrandIds.map(id => new mongoose.Types.ObjectId(id)) };
            } else if (brandQuery.brand) {
                // Aggregation $match needs explicit ObjectId casting (unlike find)
                if (typeof brandQuery.brand === 'string') {
                    brandQuery.brand = new mongoose.Types.ObjectId(brandQuery.brand);
                } else if (brandQuery.brand.$in) {
                    brandQuery.brand.$in = brandQuery.brand.$in.map(id => new mongoose.Types.ObjectId(id));
                }
            }
        }

        // 1. Current Month Revenue (Local)
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // 2. Last Month Revenue (Local)
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // 4. Financial Year Revenue (India: April 1 to March 31)
        const { startDate: fyStart, endDate: fyEnd } = getFinancialYearRange(now);

        // Helper to sum from Payments (Collections)
        const sumAmount = async (start, end) => {
            // Sum from general Payments
            const paymentResult = await Payment.aggregate([
                {
                    $match: {
                        ...brandQuery,
                        paymentDate: { $gte: start, $lte: end },
                        status: 'Completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }
                }
            ]);

            // Sum from Invoice Receipts
            const receiptResult = await ReceiptVoucher.aggregate([
                {
                    $match: {
                        ...brandQuery,
                        paymentDate: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" }
                    }
                }
            ]);

            const paymentTotal = paymentResult.length > 0 ? paymentResult[0].total : 0;
            const receiptTotal = receiptResult.length > 0 ? receiptResult[0].total : 0;

            const totalGross = paymentTotal + receiptTotal;
            return totalGross / 1.18; // Net of 18% tax
        };

        // Helper to sum from Students (Sales/Enrollment Revenue)
        const sumStudentRevenue = async (start, end) => {
            const result = await Student.aggregate([
                {
                    $match: {
                        ...brandQuery,
                        enrollmentDate: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$finalAmount" }
                    }
                }
            ]);
            const totalGross = result.length > 0 ? result[0].total : 0;
            return totalGross / 1.18; // Net of 18% tax
        };

        // In Leads Dashboard, "Revenue" usually refers to enrollment value
        const currentMonthRevenue = await sumStudentRevenue(currentMonthStart, currentMonthEnd);
        const lastMonthRevenue = await sumStudentRevenue(lastMonthStart, lastMonthEnd);
        const todayRevenue = await sumAmount(todayStart, todayEnd); // Today's collections
        const financialYearRevenue = await sumStudentRevenue(fyStart, fyEnd);

        // Actual Collections (Received Money)
        const currentMonthCollection = await sumAmount(currentMonthStart, currentMonthEnd);
        const lastMonthCollection = await sumAmount(lastMonthStart, lastMonthEnd);
        const financialYearCollection = await sumAmount(fyStart, fyEnd);

        // 5. Last 12 Months Data for Chart
        const monthlyRevenue = [];
        const monthNames = [];

        // Iterate last 12 months
        for (let i = 11; i >= 0; i--) {
            const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - i, 1));
            const mStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
            const mEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

            const mRevenue = await sumStudentRevenue(mStart, mEnd);

            monthNames.push(d.toLocaleDateString('en-US', { month: 'short' }));
            monthlyRevenue.push(mRevenue / 100000); // In Lakhs
        }


        return res.status(200).json({
            currentMonthRevenue,
            lastMonthRevenue,
            todayRevenue,
            financialYearRevenue,
            currentMonthCollection,
            lastMonthCollection,
            financialYearCollection,
            revenueGraph: {
                months: monthNames,
                revenue: monthlyRevenue
            }
        });

    } catch (error) {
        console.error("Error fetching payment stats:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
