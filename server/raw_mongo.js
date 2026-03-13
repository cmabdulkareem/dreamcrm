const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config();

async function run() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const db = client.db(); 
    const calllists = db.collection('calllists');
    const docs = await calllists.find({}).sort({createdAt: -1}).limit(5).toArray();
    fs.writeFileSync('calllists_dump.json', JSON.stringify(docs.map(d => ({
        remarks: d.remarks,
        callLogs: d.callLogs
    })), null, 2));
    console.log("Dump successful");
  } finally {
    await client.close();
  }
}
run();
