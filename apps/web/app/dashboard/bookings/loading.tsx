export default function Loading() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-8 w-40 bg-surface-container rounded-lg mb-6" />
      <div className="flex gap-2 mb-6">
        {[80, 72, 88, 76].map((w, i) => (
          <div key={i} className="h-9 rounded-full bg-surface-container" style={{ width: w }} />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-outline-variant/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-container shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-32 bg-surface-container rounded" />
              <div className="h-3 w-48 bg-surface-container rounded" />
            </div>
            <div className="hidden sm:flex gap-8">
              <div className="h-4 w-24 bg-surface-container rounded" />
              <div className="h-4 w-20 bg-surface-container rounded" />
              <div className="h-6 w-20 bg-surface-container rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
