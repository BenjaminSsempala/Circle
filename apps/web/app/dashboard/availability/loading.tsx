export default function Loading() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-8 w-52 bg-surface-container rounded-lg mb-2" />
      <div className="h-4 w-48 bg-surface-container rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-outline-variant/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-9 w-16 bg-surface-container rounded-lg" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-surface-container rounded-full" />
              <div className="h-5 w-32 bg-surface-container rounded" />
              <div className="w-8 h-8 bg-surface-container rounded-full" />
            </div>
            <div className="w-20" />
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square bg-surface-container rounded-lg" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-primary/20 rounded-2xl p-5 h-24" />
          <div className="bg-surface border border-outline-variant/20 rounded-2xl p-5 h-48" />
        </div>
      </div>
    </div>
  );
}
