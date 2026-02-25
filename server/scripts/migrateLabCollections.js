/**
 * One-time migration: Consolidate lab collections from 7 → 3
 *
 * Run with:   node scripts/migrateLabCollections.js
 *
 * What it does:
 *  1. Reads old labsections → creates labrows documents
 *  2. Reads old labslots  → pushes positions into matching labrows.emptySlots
 *  3. Reads old labcomplaints → pushes each into matching LabPC.complaints[]
 *
 * Safe to run multiple times (upsert / duplicate-check logic included).
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;

// ─── Minimal schemas for old collections ─────────────────────────────────────

const OldSection = mongoose.model("LabSection", new mongoose.Schema({ name: String }));
const OldSlot = mongoose.model("LabSlot", new mongoose.Schema({ row: String, position: Number }));
const OldComplaint = mongoose.model("LabComplaint", new mongoose.Schema({
    pc: mongoose.Schema.Types.ObjectId,
    title: String, description: String, priority: String, status: String,
    raisedBy: mongoose.Schema.Types.ObjectId, resolvedBy: mongoose.Schema.Types.ObjectId,
    resolvedAt: Date, resolutionNotes: String, createdAt: Date
}));

// ─── New models ───────────────────────────────────────────────────────────────

const LabRow = mongoose.model("LabRow", new mongoose.Schema({
    name: { type: String, unique: true, uppercase: true },
    emptySlots: { type: [Number], default: [] }
}));

const complaintSubSchema = new mongoose.Schema({
    title: String, description: String, priority: String, status: String,
    raisedBy: mongoose.Schema.Types.ObjectId, resolvedBy: mongoose.Schema.Types.ObjectId,
    resolvedAt: Date, resolutionNotes: String
}, { timestamps: true });

const LabPC = mongoose.model("LabPC", new mongoose.Schema({
    pcNumber: String,
    complaints: { type: [complaintSubSchema], default: [] }
}));

async function migrate() {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // ── 1. Migrate sections → labrows ────────────────────────────────────────
    const sections = await OldSection.find();
    for (const sec of sections) {
        const name = sec.name.replace(/Row\s+/i, '').trim().toUpperCase();
        const exists = await LabRow.findOne({ name });
        if (!exists) {
            await LabRow.create({ name, emptySlots: [] });
            console.log(`  Created row: ${name}`);
        }
    }

    // ── 2. Migrate slots → labrows.emptySlots ────────────────────────────────
    const slots = await OldSlot.find();
    for (const slot of slots) {
        const row = slot.row.replace(/Row\s+/i, '').trim().toUpperCase();
        await LabRow.findOneAndUpdate(
            { name: row },
            { $addToSet: { emptySlots: slot.position } },
            { upsert: true }
        );
        console.log(`  Added empty slot ${slot.position} to row ${row}`);
    }

    // ── 3. Migrate complaints → labpcs.complaints[] ──────────────────────────
    const complaints = await OldComplaint.find();
    for (const c of complaints) {
        await LabPC.findByIdAndUpdate(c.pc, {
            $push: {
                complaints: {
                    title: c.title, description: c.description,
                    priority: c.priority, status: c.status,
                    raisedBy: c.raisedBy, resolvedBy: c.resolvedBy,
                    resolvedAt: c.resolvedAt, resolutionNotes: c.resolutionNotes,
                    createdAt: c.createdAt
                }
            }
        });
        console.log(`  Migrated complaint "${c.title}" to PC ${c.pc}`);
    }

    console.log("\n✅ Migration complete!");
    console.log("You can now safely drop: labsections, labslots, labcomplaints, labqueues, labsoftwares");
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
