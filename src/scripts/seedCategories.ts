import { connectDB } from "../config/db";
import { Category } from "../models/Category";
import { toSlug } from "../utils/slug";

const categoryTree = [
  {
    name: "Động vật",
    children: [
      "Động vật có vú",
      "Chim",
      "Bò sát & Lưỡng cư",
      "Côn trùng & Động vật không xương sống",
      "Sinh vật biển"
    ]
  },
  {
    name: "Thực vật",
    children: [
      "Thực vật học đại cương",
      "Cây cảnh & Làm vườn",
      "Cây thuốc/Thảo dược",
      "Sinh thái rừng"
    ]
  }
];

const seed = async () => {
  await connectDB();

  for (const root of categoryTree) {
    const rootCategory = await Category.findOneAndUpdate(
      { slug: toSlug(root.name) },
      { name: root.name, slug: toSlug(root.name), parent: null },
      { upsert: true, new: true }
    );

    for (const childName of root.children) {
      await Category.findOneAndUpdate(
        { slug: toSlug(childName) },
        { name: childName, slug: toSlug(childName), parent: rootCategory._id },
        { upsert: true, new: true }
      );
    }
  }

  console.log("Seeded Động vật and Thực vật category tree");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
