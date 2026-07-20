import bcrypt from "bcryptjs";
import mongoose, { Types } from "mongoose";
import { connectDB } from "../config/db";
import { Book } from "../models/Book";
import { Cart } from "../models/Cart";
import { Category } from "../models/Category";
import { Order } from "../models/Order";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { Voucher } from "../models/Voucher";
import { toSlug } from "../utils/slug";

const demoPassword = "Password123";

const categoryTree = [
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

const demoBooks = [
  {
    title: "Đời sống kỳ thú của các loài thú",
    author: "Nguyễn Minh Lâm",
    publisher: "NXB Tri Thức",
    category: "Động vật có vú",
    description: "Một hành trình dễ đọc về tập tính, môi trường sống và vai trò sinh thái của các loài thú phổ biến.",
    price: 185000,
    discountPrice: 159000,
    stockQuantity: 24,
    tags: ["Khám phá", "Sinh thái", "Động vật"],
    isFeatured: true,
    pages: 256,
    publishedYear: 2024,
    isbn: "9786040000011",
    image: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Sổ tay nhận diện chim Việt Nam",
    author: "Trần Hoài Nam",
    publisher: "NXB Khoa Học",
    category: "Chim",
    description: "Cẩm nang nhận diện các nhóm chim thường gặp, kèm gợi ý quan sát và ghi chép ngoài thực địa.",
    price: 220000,
    stockQuantity: 12,
    tags: ["Hướng dẫn", "Sách ảnh", "Chim"],
    isFeatured: true,
    pages: 320,
    publishedYear: 2023,
    isbn: "9786040000012",
    image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Cây thuốc quanh ta",
    author: "Lê An Nhiên",
    publisher: "NXB Y Học",
    category: "Cây thuốc/Thảo dược",
    description: "Giới thiệu các loài cây thuốc phổ biến, cách nhận biết, công dụng tham khảo và lưu ý sử dụng an toàn.",
    price: 145000,
    stockQuantity: 18,
    tags: ["Thảo dược", "Hướng dẫn", "Sức khỏe"],
    isFeatured: true,
    pages: 210,
    publishedYear: 2022,
    isbn: "9786040000013",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Nhập môn thực vật học",
    author: "Phạm Khánh Linh",
    publisher: "NXB Giáo Dục",
    category: "Thực vật học đại cương",
    description: "Tài liệu nhập môn về cấu trúc, phân loại, sinh trưởng và vai trò của thực vật trong hệ sinh thái.",
    price: 198000,
    discountPrice: 175000,
    stockQuantity: 30,
    tags: ["Giáo trình", "Sinh học", "Thực vật"],
    isFeatured: false,
    pages: 280,
    publishedYear: 2025,
    isbn: "9786040000014",
    image: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Rừng mưa nhiệt đới",
    author: "Hoàng Bảo Sơn",
    publisher: "NXB Tự Nhiên",
    category: "Sinh thái rừng",
    description: "Khám phá cấu trúc tầng rừng, chu trình dinh dưỡng, đa dạng sinh học và các mối đe dọa với rừng mưa.",
    price: 260000,
    discountPrice: 229000,
    stockQuantity: 16,
    tags: ["Rừng", "Bảo tồn", "Sinh thái"],
    isFeatured: true,
    pages: 340,
    publishedYear: 2024,
    isbn: "9786040000015",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Côn trùng trong vườn nhà",
    author: "Vũ Hải Đăng",
    publisher: "NXB Nông Nghiệp",
    category: "Côn trùng & Động vật không xương sống",
    description: "Hướng dẫn quan sát côn trùng có ích, sâu hại phổ biến và cách chăm sóc khu vườn cân bằng tự nhiên.",
    price: 132000,
    stockQuantity: 21,
    tags: ["Côn trùng", "Làm vườn", "Hướng dẫn"],
    isFeatured: false,
    pages: 188,
    publishedYear: 2021,
    isbn: "9786040000016",
    image: "https://images.unsplash.com/photo-1509967733342-437077d8e41a?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Đại dương xanh và sinh vật biển",
    author: "Mai Phương Anh",
    publisher: "NXB Biển",
    category: "Sinh vật biển",
    description: "Một cuốn sách trực quan về hệ sinh thái biển, rạn san hô, sinh vật phù du và vấn đề rác thải nhựa.",
    price: 235000,
    stockQuantity: 14,
    tags: ["Biển", "Sách ảnh", "Bảo tồn"],
    isFeatured: true,
    pages: 300,
    publishedYear: 2023,
    isbn: "9786040000017",
    image: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Sống xanh từ những thói quen nhỏ",
    author: "Đặng Thu Hà",
    publisher: "NXB Trẻ",
    category: "Sống xanh",
    description: "Các gợi ý thực hành bền vững trong mua sắm, ăn uống, di chuyển và quản lý rác tại gia đình.",
    price: 118000,
    discountPrice: 99000,
    stockQuantity: 40,
    tags: ["Sống xanh", "Bền vững", "Gia đình"],
    isFeatured: false,
    pages: 176,
    publishedYear: 2024,
    isbn: "9786040000018",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Biến đổi khí hậu dễ hiểu",
    author: "Ngô Quốc Việt",
    publisher: "NXB Thế Giới",
    category: "Biến đổi khí hậu",
    description: "Giải thích nền tảng khoa học khí hậu, tác động lên đời sống và các kịch bản thích ứng cho cộng đồng.",
    price: 168000,
    stockQuantity: 22,
    tags: ["Khí hậu", "Môi trường", "Khoa học"],
    isFeatured: false,
    pages: 240,
    publishedYear: 2025,
    isbn: "9786040000019",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Nghệ thuật chăm sóc bonsai",
    author: "Lý Thành Công",
    publisher: "NXB Mỹ Thuật",
    category: "Cây cảnh & Làm vườn",
    description: "Từ chọn cây, tạo dáng, cắt tỉa đến chăm sóc bonsai theo mùa dành cho người mới bắt đầu.",
    price: 210000,
    stockQuantity: 9,
    tags: ["Bonsai", "Cây cảnh", "Làm vườn"],
    isFeatured: true,
    pages: 260,
    publishedYear: 2022,
    isbn: "9786040000020",
    image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Thế giới bò sát: Từ thằn lằn đến trăn khổng lồ",
    author: "Trịnh Gia Huy",
    publisher: "NXB Khoa Học Tự Nhiên",
    category: "Bò sát & Lưỡng cư",
    description: "Khám phá đặc điểm sinh học, tập tính săn mồi và môi trường sống của các loài bò sát từ vùng nhiệt đới đến sa mạc khô cằn.",
    price: 175000,
    stockQuantity: 20,
    tags: ["Bò sát", "Sinh học", "Khám phá"],
    isFeatured: true,
    pages: 232,
    publishedYear: 2023,
    isbn: "9786040000021",
    image: "https://images.unsplash.com/photo-1504450758481-7338ecc7524a?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Ếch nhái Việt Nam - Cẩm nang nhận diện",
    author: "Bùi Thanh Tùng",
    publisher: "NXB Nông Nghiệp",
    category: "Bò sát & Lưỡng cư",
    description: "Cẩm nang minh họa hơn 80 loài lưỡng cư bản địa, kèm đặc điểm hình thái, tiếng kêu và môi trường sống đặc trưng.",
    price: 195000,
    discountPrice: 169000,
    stockQuantity: 15,
    tags: ["Lưỡng cư", "Sách ảnh", "Việt Nam"],
    isFeatured: false,
    pages: 264,
    publishedYear: 2024,
    isbn: "9786040000022",
    image: "https://images.unsplash.com/photo-1504450758481-7338ecc7524a?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Cuộc chiến bảo tồn loài nguy cấp",
    author: "Đỗ Minh Quang",
    publisher: "NXB Chính Trị Quốc Gia",
    category: "Bảo tồn thiên nhiên",
    description: "Câu chuyện thực tế về nỗ lực cứu hộ các loài động vật quý hiếm bên bờ tuyệt chủng và vai trò của khu bảo tồn.",
    price: 210000,
    stockQuantity: 18,
    tags: ["Bảo tồn", "Động vật quý hiếm", "Môi trường"],
    isFeatured: true,
    pages: 288,
    publishedYear: 2023,
    isbn: "9786040000023",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Khu bảo tồn thiên nhiên Việt Nam",
    author: "Phan Thị Ngọc Mai",
    publisher: "NXB Tài Nguyên Môi Trường",
    category: "Bảo tồn thiên nhiên",
    description: "Giới thiệu hệ thống vườn quốc gia và khu bảo tồn trọng điểm, cùng những thách thức trong công tác gìn giữ đa dạng sinh học.",
    price: 189000,
    stockQuantity: 12,
    tags: ["Bảo tồn", "Vườn quốc gia", "Sinh thái"],
    isFeatured: false,
    pages: 220,
    publishedYear: 2022,
    isbn: "9786040000024",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Nhập môn sinh thái học",
    author: "Trần Bảo Ngọc",
    publisher: "NXB Giáo Dục",
    category: "Sinh thái học",
    description: "Giáo trình căn bản về mối quan hệ giữa sinh vật và môi trường, chuỗi thức ăn và cân bằng hệ sinh thái.",
    price: 205000,
    discountPrice: 179000,
    stockQuantity: 25,
    tags: ["Sinh thái học", "Giáo trình", "Khoa học"],
    isFeatured: true,
    pages: 300,
    publishedYear: 2025,
    isbn: "9786040000025",
    image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Mạng lưới sự sống: Hệ sinh thái vận hành như thế nào",
    author: "Lâm Tuấn Kiệt",
    publisher: "NXB Tri Thức",
    category: "Sinh thái học",
    description: "Phân tích các mối tương tác phức tạp giữa loài, quần thể và môi trường sống trong tự nhiên.",
    price: 225000,
    stockQuantity: 14,
    tags: ["Sinh thái học", "Hệ sinh thái", "Khoa học"],
    isFeatured: false,
    pages: 256,
    publishedYear: 2024,
    isbn: "9786040000026",
    image: "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Chúa sơn lâm và những kẻ săn mồi hàng đầu",
    author: "Nguyễn Hữu Phát",
    publisher: "NXB Tri Thức",
    category: "Động vật có vú",
    description: "Tìm hiểu chiến thuật săn mồi, cấu trúc bầy đàn và vị thế đỉnh chuỗi thức ăn của các loài thú ăn thịt lớn.",
    price: 199000,
    stockQuantity: 17,
    tags: ["Động vật", "Thú ăn thịt", "Khám phá"],
    isFeatured: false,
    pages: 240,
    publishedYear: 2023,
    isbn: "9786040000027",
    image: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Hành trình di cư của các loài chim",
    author: "Vương Thảo My",
    publisher: "NXB Khoa Học",
    category: "Chim",
    description: "Khám phá bí ẩn đường bay di cư hàng ngàn cây số và bản năng định hướng kỳ diệu của các loài chim.",
    price: 178000,
    stockQuantity: 19,
    tags: ["Chim", "Di cư", "Khám phá"],
    isFeatured: false,
    pages: 216,
    publishedYear: 2022,
    isbn: "9786040000028",
    image: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Thế giới bí ẩn của loài kiến và ong",
    author: "Đinh Xuân Bách",
    publisher: "NXB Nông Nghiệp",
    category: "Côn trùng & Động vật không xương sống",
    description: "Khám phá tổ chức xã hội phức tạp, phân công lao động và vai trò thụ phấn quan trọng của côn trùng xã hội.",
    price: 155000,
    discountPrice: 135000,
    stockQuantity: 22,
    tags: ["Côn trùng", "Sinh học", "Khám phá"],
    isFeatured: false,
    pages: 200,
    publishedYear: 2024,
    isbn: "9786040000029",
    image: "https://images.unsplash.com/photo-1472491235688-bdc81a63246e?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Rạn san hô và sự sống dưới đáy đại dương",
    author: "Huỳnh Gia Bảo",
    publisher: "NXB Biển",
    category: "Sinh vật biển",
    description: "Hành trình khám phá hệ sinh thái rạn san hô rực rỡ và những sinh vật kỳ lạ ẩn mình dưới lòng đại dương.",
    price: 245000,
    stockQuantity: 11,
    tags: ["Sinh vật biển", "San hô", "Sách ảnh"],
    isFeatured: true,
    pages: 288,
    publishedYear: 2023,
    isbn: "9786040000030",
    image: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Giải phẫu và sinh lý thực vật",
    author: "Cao Minh Đức",
    publisher: "NXB Đại Học Quốc Gia",
    category: "Thực vật học đại cương",
    description: "Tài liệu chuyên sâu về cấu tạo tế bào, quá trình quang hợp và sinh lý sinh trưởng của thực vật.",
    price: 215000,
    stockQuantity: 13,
    tags: ["Thực vật học", "Giáo trình", "Sinh học"],
    isFeatured: false,
    pages: 312,
    publishedYear: 2025,
    isbn: "9786040000031",
    image: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Làm vườn ban công cho người mới bắt đầu",
    author: "Ngô Bích Phượng",
    publisher: "NXB Phụ Nữ",
    category: "Cây cảnh & Làm vườn",
    description: "Hướng dẫn chọn chậu, đất trồng và chăm sóc rau, hoa trong không gian ban công nhỏ hẹp đô thị.",
    price: 138000,
    discountPrice: 119000,
    stockQuantity: 28,
    tags: ["Làm vườn", "Cây cảnh", "Đô thị"],
    isFeatured: false,
    pages: 180,
    publishedYear: 2024,
    isbn: "9786040000032",
    image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Rừng ngập mặn Việt Nam",
    author: "Lương Đình Phong",
    publisher: "NXB Tài Nguyên Môi Trường",
    category: "Sinh thái rừng",
    description: "Nghiên cứu vai trò chắn sóng, lọc nước và nuôi dưỡng đa dạng sinh học của hệ sinh thái rừng ngập mặn ven biển.",
    price: 192000,
    stockQuantity: 16,
    tags: ["Rừng", "Sinh thái", "Ven biển"],
    isFeatured: false,
    pages: 248,
    publishedYear: 2023,
    isbn: "9786040000033",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Trái Đất nóng lên: Sự thật và giải pháp",
    author: "Trương Anh Tuấn",
    publisher: "NXB Thế Giới",
    category: "Biến đổi khí hậu",
    description: "Tổng hợp dữ liệu khoa học về hiện tượng nóng lên toàn cầu và những giải pháp công nghệ, chính sách ứng phó.",
    price: 172000,
    stockQuantity: 20,
    tags: ["Khí hậu", "Môi trường", "Khoa học"],
    isFeatured: false,
    pages: 224,
    publishedYear: 2025,
    isbn: "9786040000034",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=900&q=80"
  },
  {
    title: "Zero Waste - Sống tối giản không rác thải",
    author: "Phạm Yến Nhi",
    publisher: "NXB Trẻ",
    category: "Sống xanh",
    description: "Hành trình cá nhân giảm thiểu rác thải nhựa, tái sử dụng đồ vật và xây dựng lối sống tối giản bền vững.",
    price: 128000,
    discountPrice: 109000,
    stockQuantity: 30,
    tags: ["Sống xanh", "Zero Waste", "Bền vững"],
    isFeatured: true,
    pages: 196,
    publishedYear: 2024,
    isbn: "9786040000035",
    image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80"
  }
];

const vouchers = [
  {
    code: "GREEN10",
    type: "percent" as const,
    value: 10,
    minOrderValue: 150000,
    maxDiscount: 50000,
    usageLimit: 100,
    usedCount: 0,
    isActive: true
  },
  {
    code: "FREESHIP30",
    type: "fixed" as const,
    value: 30000,
    minOrderValue: 250000,
    usageLimit: 50,
    usedCount: 0,
    isActive: true
  },
  {
    code: "WELCOME50",
    type: "fixed" as const,
    value: 50000,
    minOrderValue: 300000,
    usageLimit: 30,
    usedCount: 1,
    isActive: true,
    isHomepageEvent: true
  },
  {
    code: "GREENLEAF2NAM",
    type: "percent" as const,
    value: 20,
    minOrderValue: 200000,
    maxDiscount: 100000,
    usageLimit: 500,
    usedCount: 0,
    isActive: true,
    isHomepageEvent: true,
    expiresAt: new Date("2026-12-31T23:59:59+07:00")
  }
];

const seedCategories = async () => {
  const categoryMap = new Map<string, Types.ObjectId>();

  for (const root of categoryTree) {
    const rootCategory = await Category.findOneAndUpdate(
      { slug: toSlug(root.name) },
      {
        name: root.name,
        slug: toSlug(root.name),
        description: root.description,
        image: root.image,
        parent: null
      },
      { upsert: true, new: true, runValidators: true }
    );

    categoryMap.set(root.name, rootCategory._id as Types.ObjectId);

    for (const child of root.children) {
      const childCategory = await Category.findOneAndUpdate(
        { slug: toSlug(child.name) },
        {
          name: child.name,
          slug: toSlug(child.name),
          description: child.description,
          image: child.image,
          parent: rootCategory._id
        },
        { upsert: true, new: true, runValidators: true }
      );
      categoryMap.set(child.name, childCategory._id as Types.ObjectId);
    }
  }

  return categoryMap;
};

const seedUsers = async () => {
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const admin = await User.findOneAndUpdate(
    { email: "admin@greenleaf.test" },
    {
      name: "GreenLeaf Admin",
      email: "admin@greenleaf.test",
      passwordHash,
      role: "admin",
      isActive: true,
      phone: "0900000001",
      addresses: []
    },
    { upsert: true, new: true, runValidators: true }
  );

  const customer = await User.findOneAndUpdate(
    { email: "customer@greenleaf.test" },
    {
      name: "Khách hàng demo",
      email: "customer@greenleaf.test",
      passwordHash,
      role: "customer",
      isActive: true,
      phone: "0900000002",
      addresses: [
        {
          recipientName: "Khách hàng demo",
          phone: "0900000002",
          addressLine: "123 Đường Sách",
          city: "TP. Hồ Chí Minh",
          isDefault: true
        }
      ]
    },
    { upsert: true, new: true, runValidators: true }
  );

  const customer2 = await User.findOneAndUpdate(
    { email: "reader@greenleaf.test" },
    {
      name: "Bạn đọc GreenLeaf",
      email: "reader@greenleaf.test",
      passwordHash,
      role: "customer",
      isActive: true,
      phone: "0900000003",
      addresses: [
        {
          recipientName: "Bạn đọc GreenLeaf",
          phone: "0900000003",
          addressLine: "45 Nguyễn Văn Bình",
          city: "TP. Hồ Chí Minh",
          isDefault: true
        }
      ]
    },
    { upsert: true, new: true, runValidators: true }
  );

  return { admin, customer, customer2 };
};

const seedBooks = async (categoryMap: Map<string, Types.ObjectId>) => {
  const bookMap = new Map<string, Types.ObjectId>();

  for (const book of demoBooks) {
    const category = categoryMap.get(book.category);
    if (!category) continue;

    const savedBook = await Book.findOne({ slug: toSlug(book.title) }) ?? new Book();
    savedBook.set({
      title: book.title,
      slug: toSlug(book.title),
      author: book.author,
      publisher: book.publisher,
      description: book.description,
      price: book.price,
      discountPrice: book.discountPrice,
      stockQuantity: book.stockQuantity,
      images: [book.image],
      category,
      tags: book.tags,
      isbn: book.isbn,
      language: "vi",
      pages: book.pages,
      publishedYear: book.publishedYear,
      isFeatured: book.isFeatured
    });
    await savedBook.save();

    bookMap.set(book.title, savedBook._id as Types.ObjectId);
  }

  return bookMap;
};

const seedVouchers = async () => {
  for (const voucher of vouchers) {
    await Voucher.findOneAndUpdate(
      { code: voucher.code },
      voucher,
      { upsert: true, new: true, runValidators: true }
    );
  }
};

const seedCartAndWishlist = async (
  users: Awaited<ReturnType<typeof seedUsers>>,
  bookMap: Map<string, Types.ObjectId>
) => {
  const cartItems = [
    "Sống xanh từ những thói quen nhỏ",
    "Cây thuốc quanh ta"
  ]
    .map((title, index) => {
      const book = bookMap.get(title);
      return book ? { book, quantity: index + 1 } : undefined;
    })
    .filter(Boolean);

  await Cart.findOneAndUpdate(
    { user: users.customer._id },
    { user: users.customer._id, items: cartItems },
    { upsert: true, new: true, runValidators: true }
  );

  const wishlist = [
    "Rừng mưa nhiệt đới",
    "Đại dương xanh và sinh vật biển",
    "Nghệ thuật chăm sóc bonsai"
  ]
    .map((title) => bookMap.get(title))
    .filter(Boolean);

  await User.updateOne(
    { _id: users.customer._id },
    { $set: { wishlist } }
  );
};

const seedOrders = async (
  users: Awaited<ReturnType<typeof seedUsers>>,
  bookMap: Map<string, Types.ObjectId>
) => {
  await Order.deleteMany({
    orderCode: { $in: ["GL-DEMO-1001", "GL-DEMO-1002", "GL-DEMO-1003"] }
  });

  const bookA = await Book.findById(bookMap.get("Đời sống kỳ thú của các loài thú"));
  const bookB = await Book.findById(bookMap.get("Sổ tay nhận diện chim Việt Nam"));
  const bookC = await Book.findById(bookMap.get("Cây thuốc quanh ta"));
  const bookD = await Book.findById(bookMap.get("Biến đổi khí hậu dễ hiểu"));

  if (!bookA || !bookB || !bookC || !bookD) return;

  await Order.insertMany([
    {
      orderCode: "GL-DEMO-1001",
      user: users.customer._id,
      items: [
        { book: bookA._id, title: bookA.title, price: bookA.discountPrice ?? bookA.price, quantity: 1 },
        { book: bookB._id, title: bookB.title, price: bookB.discountPrice ?? bookB.price, quantity: 1 }
      ],
      subtotal: (bookA.discountPrice ?? bookA.price) + (bookB.discountPrice ?? bookB.price),
      discountTotal: 50000,
      voucherCode: "WELCOME50",
      shippingFee: 30000,
      total: (bookA.discountPrice ?? bookA.price) + (bookB.discountPrice ?? bookB.price) - 50000 + 30000,
      shippingAddress: users.customer.addresses[0],
      paymentMethod: "COD",
      paymentStatus: "paid",
      orderStatus: "delivered",
      statusHistory: [
        { status: "pending", note: "Đơn hàng demo được tạo" },
        { status: "confirmed", note: "Admin đã xác nhận đơn" },
        { status: "shipping", note: "Đơn đang được giao" },
        { status: "delivered", note: "Giao hàng thành công" }
      ]
    },
    {
      orderCode: "GL-DEMO-1002",
      user: users.customer._id,
      items: [
        { book: bookC._id, title: bookC.title, price: bookC.discountPrice ?? bookC.price, quantity: 2 }
      ],
      subtotal: (bookC.discountPrice ?? bookC.price) * 2,
      discountTotal: 0,
      shippingFee: 30000,
      total: (bookC.discountPrice ?? bookC.price) * 2 + 30000,
      shippingAddress: users.customer.addresses[0],
      paymentMethod: "ONLINE",
      paymentStatus: "pending",
      orderStatus: "pending",
      statusHistory: [
        { status: "pending", note: "Đơn hàng VietQR đang chờ thanh toán" }
      ]
    },
    {
      orderCode: "GL-DEMO-1003",
      user: users.customer2._id,
      items: [
        { book: bookD._id, title: bookD.title, price: bookD.discountPrice ?? bookD.price, quantity: 1 }
      ],
      subtotal: bookD.discountPrice ?? bookD.price,
      discountTotal: 0,
      shippingFee: 30000,
      total: (bookD.discountPrice ?? bookD.price) + 30000,
      shippingAddress: users.customer2.addresses[0],
      paymentMethod: "COD",
      paymentStatus: "pending",
      orderStatus: "confirmed",
      statusHistory: [
        { status: "pending", note: "Đơn hàng demo được tạo" },
        { status: "confirmed", note: "Admin đã xác nhận đơn" }
      ]
    }
  ]);
};

const seedReviews = async (
  users: Awaited<ReturnType<typeof seedUsers>>,
  bookMap: Map<string, Types.ObjectId>
) => {
  const reviewSeeds = [
    {
      user: users.customer._id,
      book: bookMap.get("Đời sống kỳ thú của các loài thú"),
      rating: 5,
      comment: "Nội dung dễ hiểu, nhiều ví dụ thực tế và rất phù hợp cho người mới tìm hiểu về động vật."
    },
    {
      user: users.customer._id,
      book: bookMap.get("Sổ tay nhận diện chim Việt Nam"),
      rating: 4,
      comment: "Sách trình bày rõ ràng, phần nhận diện ngoài thực địa rất hữu ích."
    },
    {
      user: users.customer2._id,
      book: bookMap.get("Cây thuốc quanh ta"),
      rating: 5,
      comment: "Thông tin cây thuốc gần gũi, có lưu ý an toàn nên đọc rất yên tâm."
    },
    {
      user: users.customer2._id,
      book: bookMap.get("Rừng mưa nhiệt đới"),
      rating: 4,
      comment: "Hình ảnh đẹp, nội dung bảo tồn rừng được viết mạch lạc."
    }
  ];

  for (const review of reviewSeeds) {
    if (!review.book) continue;
    await Review.findOneAndUpdate(
      { user: review.user, book: review.book },
      review,
      { upsert: true, new: true, runValidators: true }
    );
  }

  for (const bookId of bookMap.values()) {
    const stats = await Review.aggregate([
      { $match: { book: bookId } },
      {
        $group: {
          _id: "$book",
          ratingAverage: { $avg: "$rating" },
          numReviews: { $sum: 1 }
        }
      }
    ]);

    await Book.updateOne(
      { _id: bookId },
      {
        $set: {
          ratingAverage: stats[0]?.ratingAverage ?? 0,
          numReviews: stats[0]?.numReviews ?? 0
        }
      }
    );
  }
};

const seed = async () => {
  await connectDB();
  await Book.collection.dropIndex("title_text_author_text_tags_text").catch(() => undefined);
  await Book.syncIndexes();

  const categoryMap = await seedCategories();
  const users = await seedUsers();
  const bookMap = await seedBooks(categoryMap);
  await seedVouchers();
  await seedCartAndWishlist(users, bookMap);
  await seedOrders(users, bookMap);
  await seedReviews(users, bookMap);

  console.log("Seed demo completed");
  console.log(`Database: ${mongoose.connection.name}`);
  console.log(`Categories: ${await Category.countDocuments()}`);
  console.log(`Books: ${await Book.countDocuments()}`);
  console.log(`Users: ${await User.countDocuments()}`);
  console.log(`Vouchers: ${await Voucher.countDocuments()}`);
  console.log(`Orders: ${await Order.countDocuments({ orderCode: /^GL-DEMO-/ })}`);
  console.log(`Reviews: ${await Review.countDocuments()}`);
  console.log(`Admin: admin@greenleaf.test / ${demoPassword}`);
  console.log(`Customer: customer@greenleaf.test / ${demoPassword}`);
  console.log(`Reader: reader@greenleaf.test / ${demoPassword}`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
