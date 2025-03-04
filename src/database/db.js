import mongoose from 'mongoose';
// import User from './userSchema.js';

const uri = 'mongodb://127.0.0.1:27017/Athar';

async function main() {
  await mongoose.connect(uri);

  console.info('Connected to database:', uri);

  //          Log all collections and documents in the database
  // const collections = await mongoose.connection.db.listCollections().toArray();
  // for (const collection of collections) {
  //   const documents = await mongoose.connection.db.collection(collection.name).find({}).toArray();
  //   console.log(`Collection: ${collection.name}`);
  //   console.log(documents);
  // }
}

export default main;