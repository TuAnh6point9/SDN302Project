import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";
import mongoose from "mongoose";
import { Category } from "./models/Category";
import { autoSeedCategories } from "./utils/seedHelper";

const startServer = async () => {
  await connectDB();

  // Auto-seed categories if none exist
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log("No categories found in database. Auto-seeding categories...");
      await autoSeedCategories();
    }
  } catch (error) {
    console.error("Auto-seeding check failed:", error);
  }

  const server = app.listen(env.port, () => {
    console.log(`GreenLeaf Books API running on port ${env.port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`${signal} received. Shutting down gracefully.`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });

    setTimeout(() => {
      console.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000).unref();
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
};

startServer().catch((error) => {
  console.error("Server startup failed", error);
  process.exit(1);
});
