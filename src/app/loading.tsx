export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-indigo-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}
