export default function Loading() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full animate-pulse">
      <div className="h-8 w-48 bg-surface-container rounded-lg mb-2" />
      <div className="h-4 w-32 bg-surface-container rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface border border-outline-variant/20 rounded-xl p-6 h-40" />
          <div className="bg-surface border border-outline-variant/20 rounded-xl p-6 h-48" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-outline-variant/20 rounded-xl p-5 h-32" />
          <div className="bg-surface border border-outline-variant/20 rounded-xl p-5 h-44" />
          <div className="bg-surface border border-outline-variant/20 rounded-xl p-5 h-44" />
        </div>
      </div>
    </div>
  );
}
