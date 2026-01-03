// Description: Loading skeleton for recipe detail page

export default function RecipeDetailLoading() {
  return (
    <div className="flex flex-col">
      {/* Hero Image Skeleton */}
      <div className="relative w-full min-h-[30vh] bg-gray-200 animate-pulse rounded-xl mx-4 mt-4" />

      {/* Title and Meta Skeleton */}
      <div className="px-4 pt-6 space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="flex gap-2 pb-4">
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-14 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex gap-3 mt-4">
          <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 h-12 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="px-4 py-6 space-y-4">
        <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
