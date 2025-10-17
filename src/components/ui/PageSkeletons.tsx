import React from "react";
import {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonCard,
  SkeletonButton,
  SkeletonInput,
} from "./Skeleton";

// Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <SkeletonTitle className="mb-2" />
          <SkeletonText lines={1} className="w-1/2" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton height="h-4" width="w-16" />
                  <Skeleton height="h-8" width="w-20" />
                </div>
                <Skeleton height="h-12" width="w-12" rounded="full" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <SkeletonTitle className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <SkeletonTitle className="mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton height="h-10" width="w-10" rounded="full" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="h-4" width="w-1/3" />
                  <Skeleton height="h-3" width="w-1/2" />
                </div>
                <Skeleton height="h-4" width="w-16" />
              </div>
            ))}
          </div>
        </div>
    </div>
  </div>
);

// Search Page Skeleton
export const SearchPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <SkeletonTitle className="mb-2" />
          <SkeletonText lines={2} className="w-2/3" />
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <SkeletonTitle className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton height="h-4" width="w-20" />
                <SkeletonInput />
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </div>

        {/* Results Area */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <SkeletonTitle />
            <SkeletonButton />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <Skeleton height="h-5" width="w-2/3" />
                  <SkeletonText lines={2} />
                  <div className="flex gap-2">
                    <Skeleton height="h-6" width="w-16" />
                    <Skeleton height="h-6" width="w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  </div>
);

// Business Lists Skeleton
export const BusinessListsSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <SkeletonTitle className="mb-2" />
              <SkeletonText lines={1} className="w-1/2" />
            </div>
            <SkeletonButton />
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <SkeletonInput />
            <SkeletonButton />
          </div>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="space-y-4">
                <Skeleton height="h-6" width="w-2/3" />
                <SkeletonText lines={2} />
                <div className="flex items-center justify-between">
                  <Skeleton height="h-4" width="w-20" />
                  <div className="flex gap-2">
                    <Skeleton height="h-8" width="w-16" />
                    <Skeleton height="h-8" width="w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  </div>
);

// Business Detail Skeleton
export const BusinessDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <SkeletonTitle className="mb-2" />
              <SkeletonText lines={1} className="w-1/2" />
            </div>
            <div className="flex gap-2">
              <SkeletonButton />
              <SkeletonButton />
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <SkeletonTitle />
              <SkeletonText lines={3} />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton height="h-4" width="w-16" />
                    <Skeleton height="h-4" width="w-24" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton height="h-48" width="w-full" rounded="lg" />
              <div className="flex gap-2">
                <SkeletonButton />
                <SkeletonButton />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Forms */}
        <div className="bg-white rounded-lg shadow p-6">
          <SkeletonTitle className="mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="space-y-3">
                  <Skeleton height="h-5" width="w-1/3" />
                  <SkeletonText lines={2} />
                  <div className="flex gap-2">
                    <Skeleton height="h-6" width="w-16" />
                    <Skeleton height="h-6" width="w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  </div>
);

// Admin Dashboard Skeleton
export const AdminDashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-8">
    <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <SkeletonTitle className="mb-2" />
          <SkeletonText lines={1} className="w-1/2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton height="h-4" width="w-16" />
                  <Skeleton height="h-8" width="w-20" />
                </div>
                <Skeleton height="h-12" width="w-12" rounded="full" />
              </div>
            </div>
          ))}
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <SkeletonTitle className="mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton height="h-10" width="w-10" rounded="full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton height="h-4" width="w-1/3" />
                    <Skeleton height="h-3" width="w-1/2" />
                  </div>
                  <Skeleton height="h-4" width="w-16" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <SkeletonTitle className="mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton height="h-10" width="w-10" rounded="full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton height="h-4" width="w-1/3" />
                    <Skeleton height="h-3" width="w-1/2" />
                  </div>
                  <Skeleton height="h-4" width="w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  </div>
);

// Auth Pages Skeleton
export const AuthPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Skeleton
            height="h-12"
            width="w-12"
            rounded="full"
            className="mx-auto mb-4"
          />
          <SkeletonTitle className="mb-2" />
          <SkeletonText lines={1} className="w-2/3 mx-auto" />
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton height="h-4" width="w-20" />
                <SkeletonInput />
              </div>
            ))}
            <SkeletonButton className="w-full" />
          </div>
        </div>
    </div>
  </div>
);
