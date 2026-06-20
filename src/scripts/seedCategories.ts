import { connectDB } from "../config/db";
import { autoSeedCategories } from "../utils/seedHelper";

const seed = async () => {
  await connectDB();
  await autoSeedCategories();
  console.log("Category seeding script finished successfully.");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
