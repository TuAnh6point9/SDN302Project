import { Leaf } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-5 animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center">
        {/* Outer spinner ring */}
        <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary/10 border-t-primary" />
        {/* Inner pulsing leaf card */}
        <div className="absolute w-12 h-12 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
          <Leaf className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-heading font-extrabold text-lg text-primary-dark tracking-wide">GreenLeaf Books</h3>
        <p className="text-[10px] text-text-secondary/60 font-bold tracking-widest uppercase">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
