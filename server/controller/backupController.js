import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, '../backups');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export const createBackup = async (req, res) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}.zip`;
        const backupPath = path.join(BACKUP_DIR, backupName);

        const output = fs.createWriteStream(backupPath);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        output.on('close', () => {
            res.status(200).json({
                message: 'Backup created successfully',
                filename: backupName,
                size: archive.pointer()
            });
        });

        archive.on('error', (err) => {
            throw err;
        });

        archive.pipe(output);

        // 1. Export MongoDB Data
        const collections = await mongoose.connection.db.listCollections().toArray();
        const dataPath = path.join(BACKUP_DIR, `data-${timestamp}`);
        if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);

        for (const collection of collections) {
            const name = collection.name;
            const documents = await mongoose.connection.db.collection(name).find({}).toArray();
            fs.writeFileSync(path.join(dataPath, `${name}.json`), JSON.stringify(documents));
        }

        // Add MongoDB data to zip
        archive.directory(dataPath, 'database');

        // 2. Add Uploads to zip
        if (fs.existsSync(UPLOADS_DIR)) {
            archive.directory(UPLOADS_DIR, 'uploads');
        }

        await archive.finalize();

        // Cleanup temporary data directory
        setTimeout(() => {
            fs.rmSync(dataPath, { recursive: true, force: true });
        }, 5000);

    } catch (error) {
        console.error('Backup error:', error);
        res.status(500).json({ message: 'Error creating backup', error: error.message });
    }
};

export const listBackups = async (req, res) => {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith('.zip'))
            .map(file => {
                const stats = fs.statSync(path.join(BACKUP_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime
                };
            })
            .sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json({ backups: files });
    } catch (error) {
        res.status(500).json({ message: 'Error listing backups' });
    }
};

export const downloadBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(BACKUP_DIR, filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Backup file not found' });
        }

        res.download(filePath);
    } catch (error) {
        res.status(500).json({ message: 'Error downloading backup' });
    }
};

export const deleteBackup = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(BACKUP_DIR, filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({ message: 'Backup deleted successfully' });
        } else {
            res.status(404).json({ message: 'Backup file not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting backup' });
    }
};

export const restoreBackup = async (req, res) => {
    const backupFile = req.file;
    if (!backupFile) {
        return res.status(400).json({ message: 'No backup file provided' });
    }

    const extractPath = path.join(BACKUP_DIR, `restore-${Date.now()}`);

    try {
        // 1. Extract Zip
        await fs.createReadStream(backupFile.path)
            .pipe(unzipper.Extract({ path: extractPath }))
            .promise();

        // 2. Restore Database
        const dbPath = path.join(extractPath, 'database');
        if (fs.existsSync(dbPath)) {
            const files = fs.readdirSync(dbPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const collectionName = path.parse(file).name;
                    const data = JSON.parse(fs.readFileSync(path.join(dbPath, file), 'utf8'));

                    // Recursive helper to convert string IDs to ObjectIds
                    const processObjectIds = (obj) => {
                        if (Array.isArray(obj)) {
                            return obj.map(processObjectIds);
                        } else if (obj !== null && typeof obj === 'object') {
                            for (const key in obj) {
                                if (typeof obj[key] === 'string' && /^[0-9a-fA-F]{24}$/.test(obj[key])) {
                                    obj[key] = new mongoose.Types.ObjectId(obj[key]);
                                } else if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj[key])) {
                                    obj[key] = new Date(obj[key]);
                                } else {
                                    obj[key] = processObjectIds(obj[key]);
                                }
                            }
                        }
                        return obj;
                    };

                    const processedData = processObjectIds(data);
                    await mongoose.connection.db.collection(collectionName).deleteMany({});
                    if (processedData.length > 0) {
                        await mongoose.connection.db.collection(collectionName).insertMany(processedData);
                    }
                }
            }
        }

        // 3. Restore Uploads
        const restoreUploadsPath = path.join(extractPath, 'uploads');
        if (fs.existsSync(restoreUploadsPath)) {
            // Clear current uploads
            if (fs.existsSync(UPLOADS_DIR)) {
                fs.rmSync(UPLOADS_DIR, { recursive: true, force: true });
            }
            fs.renameSync(restoreUploadsPath, UPLOADS_DIR);
        }

        // Cleanup
        setTimeout(() => {
            fs.rmSync(extractPath, { recursive: true, force: true });
            if (fs.existsSync(backupFile.path)) fs.unlinkSync(backupFile.path);
        }, 5000);

        res.status(200).json({ message: 'System restored successfully' });

    } catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ message: 'Error restoring backup', error: error.message });
    }
};
