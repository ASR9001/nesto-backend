import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI || process.env.DATABASE_URL_V1 || process.env.DATABASE_URL_V1;
    await mongoose.connect(dbUri);
		console.log("DB Connected successfully!");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

