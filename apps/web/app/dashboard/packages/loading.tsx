export default function Loading() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-8 w-36 bg-surface-container rounded-lg mb-2" />
          <div className="h-4 w-56 bg-surface-container rounded" />
        </div>
        <div className="h-10 w-32 bg-surface-container rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-outline-variant/20 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex justify-between">
              <div className="h-4 w-4 bg-surface-container rounded" />
              <div className="flex gap-2">
                <div className="h-7 w-7 bg-surface-container rounded-lg" />
                <div className="h-7 w-7 bg-surface-container rounded-lg" />
                <div className="h-6 w-11 bg-surface-container rounded-full" />
              </div>
            </div>
            <div className="h-5 w-32 bg-surface-container rounded" />
            <div className="h-3 w-full bg-surface-container rounded" />
            <div className="h-3 w-4/5 bg-surface-container rounded" />
            <div className="flex gap-2 mt-1">
              <div className="h-6 w-16 bg-surface-container rounded-full" />
              <div className="h-6 w-24 bg-surface-container rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
