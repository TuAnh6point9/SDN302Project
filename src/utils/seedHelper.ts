import { Category } from "../models/Category";
import { toSlug } from "./slug";

export const categoryTree = [
  {
    name: "Động vật",
    description: "Khám phá thế giới động vật đa dạng từ các loài có vú kì thú, thế giới loài chim bay lượn, đến sinh vật đại dương sâu thẳm.",
    image: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=900&q=80",
    children: [
      {
        name: "Động vật có vú",
        description: "Tài liệu chuyên sâu về tập tính, tiến hóa và bảo tồn các loài thú trong tự nhiên.",
        image: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Chim",
        description: "Cẩm nang hướng dẫn nhận diện, tập tính di cư và tập quán làm tổ của các loài chim thế giới.",
        image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Bò sát & Lưỡng cư",
        description: "Tìm hiểu vòng đời kì diệu, cơ chế thích nghi của các sinh vật máu lạnh trên Trái Đất.",
        image: "https://images.unsplash.com/photo-1504450758481-7338ecc7524a?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Côn trùng & Động vật không xương sống",
        description: "Khám phá cấu tạo tinh vi và vai trò tối quan trọng của những sinh vật nhỏ bé nhất.",
        image: "https://images.unsplash.com/photo-1472491235688-bdc81a63246e?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Sinh vật biển",
        description: "Hành trình xuống lòng đại dương sâu thẳm nghiên cứu hệ sinh thái san hô và sinh vật biển.",
        image: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  {
    name: "Thực vật",
    description: "Hành trình tìm hiểu thế giới thảo mộc xanh tươi, thực vật học đại cương, các phương pháp làm vườn và hệ sinh thái rừng.",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=80",
    children: [
      {
        name: "Thực vật học đại cương",
        description: "Khái quát cấu trúc, phân loại, sinh trưởng và tiến hóa của các loài cây.",
        image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Cây cảnh & Làm vườn",
        description: "Nghệ thuật chăm sóc cây cảnh, kiến tạo không gian sống xanh và kỹ thuật làm vườn bền vững.",
        image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Cây thuốc/Thảo dược",
        description: "Kiến thức nhận diện, thu hái và dược tính trị bệnh của các loài thảo mộc dân gian.",
        image: "https://images.unsplash.com/photo-1563201373-79a1157c57ab?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Sinh thái rừng",
        description: "Khám phá cấu trúc phức tạp và chu trình sống của những cánh rừng tự nhiên lớn nhất.",
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80"
      }
    ]
  },
  {
    name: "Môi trường",
    description: "Tài liệu khoa học về biến đổi khí hậu, sinh thái học tổng quan và lối sống xanh bền vững.",
    image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=900&q=80",
    children: [
      {
        name: "Biến đổi khí hậu",
        description: "Nghiên cứu nguyên nhân, tác động toàn cầu và các giải pháp thích ứng khẩn cấp cho nhân loại.",
        image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Bảo tồn thiên nhiên",
        description: "Chiến dịch bảo vệ đa dạng sinh học và giữ gìn các khu bảo tồn thiên nhiên hoang dã.",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Sinh thái học",
        description: "Mối liên hệ giữa các loài sinh vật với môi trường sống xung quanh chúng.",
        image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=900&q=80"
      },
      {
        name: "Sống xanh",
        description: "Các ý tưởng và thực hành lối sống giảm rác thải, tiết kiệm năng lượng tại hộ gia đình.",
        image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80"
      }
    ]
  }
];

export const autoSeedCategories = async (): Promise<void> => {
  for (const root of categoryTree) {
    const rootCategory = await Category.findOneAndUpdate(
      { slug: toSlug(root.name) },
      { name: root.name, slug: toSlug(root.name), description: root.description, image: root.image, parent: null },
      { upsert: true, new: true }
    );

    for (const child of root.children) {
      await Category.findOneAndUpdate(
        { slug: toSlug(child.name) },
        { name: child.name, slug: toSlug(child.name), description: child.description, image: child.image, parent: rootCategory._id },
        { upsert: true, new: true }
      );
    }
  }
  console.log("Seeded Động vật, Thực vật and Môi trường category tree automatically");
};
