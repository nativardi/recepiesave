// Description: Loading skeleton for dashboard page

import { RecipeGridSkeleton } from "@/components/composites/RecipeGridSkeleton";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section Skeleton */}
      <div className="px-4">
        <div className="h-12 w-48 bg-gray-200 rounded-lg animate-pulse pt-2 pb-4" />

        {/* URL Capture Skeleton */}
        <div className="mt-4 h-14 bg-gray-100 rounded-full animate-pulse" />
      </div>

      {/* Recent Saves Skeleton */}
      <div>
        <div className="px-4 pb-3">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-40">
              <div className="aspect-[4/5] bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Your Library Skeleton */}
      <div>
        <div className="px-4 pb-3 pt-4">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Filter Tabs Skeleton */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Platform Filter Skeleton */}
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>

        <div className="px-4">
          <RecipeGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
