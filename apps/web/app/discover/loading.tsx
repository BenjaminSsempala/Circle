export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-8 animate-pulse">
        <div className="h-8 w-48 bg-surface-container rounded-lg mb-2" />
        <div className="h-4 w-72 bg-surface-container rounded mb-6" />
        <div className="flex gap-2 mb-6 overflow-hidden">
          {[80, 88, 72, 96, 76, 84, 92].map((w, i) => (
            <div key={i} className="h-9 rounded-full bg-surface-container shrink-0" style={{ width: w }} />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-outline-variant/20">
              <div className="aspect-[3/4] bg-surface-container" />
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 w-3/4 bg-surface-container rounded" />
                <div className="h-3 w-1/2 bg-surface-container rounded" />
                <div className="h-8 bg-surface-container rounded-xl mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
