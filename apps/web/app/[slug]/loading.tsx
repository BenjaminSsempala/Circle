export default function Loading() {
  return (
    <div className="bg-surface min-h-screen flex flex-col animate-pulse">
      {/* Nav skeleton */}
      <div className="h-16 border-b border-outline-variant/20 bg-surface" />

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-4 md:px-10 py-lg grid grid-cols-1 md:grid-cols-12 gap-gutter mt-4">
        {/* Left col: events placeholder */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="h-6 w-32 bg-surface-container rounded" />
          <div className="h-24 bg-surface-container rounded-2xl" />
          <div className="h-24 bg-surface-container rounded-2xl" />
        </div>

        {/* Centre col: profile */}
        <div className="md:col-span-6 flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full bg-surface-container shrink-0" />
            <div className="flex-1 flex flex-col gap-3">
              <div className="h-8 w-48 bg-surface-container rounded-lg" />
              <div className="h-4 w-36 bg-surface-container rounded" />
              <div className="flex gap-2">
                <div className="h-7 w-20 bg-surface-container rounded-full" />
                <div className="h-7 w-20 bg-surface-container rounded-full" />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <div className="h-4 w-full bg-surface-container rounded" />
            <div className="h-4 w-5/6 bg-surface-container rounded" />
            <div className="h-4 w-4/5 bg-surface-container rounded" />
            <div className="h-4 w-3/4 bg-surface-container rounded" />
          </div>

          {/* Works grid */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-video bg-surface-container rounded-xl" />
            ))}
          </div>
        </div>

        {/* Right col: packages */}
        <div className="md:col-span-3 flex flex-col gap-4">
          <div className="h-6 w-28 bg-surface-container rounded" />
          <div className="h-40 bg-surface-container rounded-2xl" />
          <div className="h-40 bg-surface-container rounded-2xl" />
        </div>
      </main>
    </div>
  );
}
