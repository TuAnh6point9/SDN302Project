export default function BookCardSkeleton() {
  return (
    <div className="card animate-pulse flex flex-col h-full pointer-events-none border border-gray-100">
      {/* Cover Image Placeholder */}
      <div className="relative aspect-[3/4] bg-gray-150" />

      {/* Content Placeholder */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Title Lines */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-150 rounded-lg w-full" />
          <div className="h-4 bg-gray-150 rounded-lg w-2/3" />
        </div>
        
        {/* Author Line */}
        <div className="h-3 bg-gray-150 rounded-lg w-1/3" />

        {/* Pricing & Details Link */}
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
          <div className="h-4 bg-gray-150 rounded-lg w-20" />
          <div className="h-3 bg-gray-150 rounded-lg w-12" />
        </div>
      </div>
    </div>
  );
}
