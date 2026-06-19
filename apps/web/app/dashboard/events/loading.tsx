export default function Loading() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full animate-pulse">
      <div className="h-8 w-24 bg-surface-container rounded-lg mb-2" />
      <div className="h-4 w-64 bg-surface-container rounded mb-8" />
      <div className="flex justify-end mb-6">
        <div className="h-10 w-28 bg-surface-container rounded-xl" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-outline-variant/20 rounded-xl p-4 flex gap-4">
            <div className="w-16 h-16 rounded-lg bg-surface-container shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 w-48 bg-surface-container rounded" />
              <div className="h-3 w-32 bg-surface-container rounded" />
              <div className="h-3 w-40 bg-surface-container rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
