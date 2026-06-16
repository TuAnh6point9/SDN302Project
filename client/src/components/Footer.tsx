import { Link } from 'react-router-dom';
import { Leaf, TreePine, Sprout, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-dark text-white mt-auto">
      {/* Decorative wave */}
      <div className="bg-background">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 60L48 52C96 44 192 28 288 22C384 16 480 20 576 28C672 36 768 48 864 48C960 48 1056 36 1152 28C1248 20 1344 16 1392 14L1440 12V60H0Z" fill="#1B5E20" />
        </svg>
      </div>

      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <Leaf className="w-6 h-6 text-primary-light" />
              </div>
              <span className="font-heading font-bold text-xl">
                GreenLeaf <span className="text-primary-light">Books</span>
              </span>
            </Link>
            <p className="text-white/70 text-sm leading-relaxed max-w-sm">
              Nền tảng trưng bày sách chuyên biệt về thế giới Động vật và Thực vật.
              Khám phá thiên nhiên qua từng trang sách.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <TreePine className="w-4 h-4 text-primary-light" />
              </div>
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Sprout className="w-4 h-4 text-primary-light" />
              </div>
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                <Leaf className="w-4 h-4 text-primary-light" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-white">Khám phá</h3>
            <ul className="space-y-2.5">
              <li>
                <Link to="/books" className="text-white/70 hover:text-primary-light text-sm transition-colors inline-flex items-center gap-2">
                  <Sprout className="w-3.5 h-3.5" /> Tất cả sách
                </Link>
              </li>
              <li>
                <Link to="/books?category=dong-vat" className="text-white/70 hover:text-primary-light text-sm transition-colors inline-flex items-center gap-2">
                  <Sprout className="w-3.5 h-3.5" /> Sách Động vật
                </Link>
              </li>
              <li>
                <Link to="/books?category=thuc-vat" className="text-white/70 hover:text-primary-light text-sm transition-colors inline-flex items-center gap-2">
                  <Sprout className="w-3.5 h-3.5" /> Sách Thực vật
                </Link>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-lg text-white">Về GreenLeaf</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Dành cho học sinh, sinh viên ngành sinh học – môi trường,
              giáo viên, phụ huynh và tất cả những người yêu thiên nhiên.
            </p>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <span>Dự án phi thương mại</span>
              <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-xs">
            © {currentYear} GreenLeaf Books. Trang web trưng bày sách về thiên nhiên.
          </p>
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <Leaf className="w-3 h-3" />
            <span>Được xây dựng với tình yêu thiên nhiên</span>
            <Leaf className="w-3 h-3" />
          </div>
        </div>
      </div>
    </footer>
  );
}
