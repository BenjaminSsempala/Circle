export default function Loading() {
  return (
    <div className="p-6 md:p-10 w-full animate-pulse">
      <div className="h-8 w-44 bg-surface-container rounded-lg mb-2" />
      <div className="h-4 w-72 bg-surface-container rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 flex flex-col gap-7">
          {/* Identity */}
          <div className="flex flex-col gap-4">
            <div className="h-4 w-20 bg-surface-container rounded" />
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-surface-container shrink-0" />
              <div className="h-9 w-28 bg-surface-container rounded-lg" />
            </div>
            <div className="h-10 bg-surface-container rounded-lg" />
            <div className="h-28 bg-surface-container rounded-lg" />
          </div>
          {/* Details */}
          <div className="flex flex-col gap-4">
            <div className="h-4 w-16 bg-surface-container rounded" />
            <div className="h-10 bg-surface-container rounded-lg" />
            <div className="h-10 bg-surface-container rounded-lg" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-surface-container rounded-lg" />
              <div className="h-10 bg-surface-container rounded-lg" />
            </div>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="bg-surface border border-outline-variant/20 rounded-2xl overflow-hidden">
            <div className="aspect-square bg-surface-container" />
            <div className="p-5 flex flex-col gap-3">
              <div className="h-5 w-32 bg-surface-container rounded" />
              <div className="h-10 bg-surface-container rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
