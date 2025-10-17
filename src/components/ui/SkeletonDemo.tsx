import React from "react";
import {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonCard,
  SkeletonButton,
  SkeletonInput,
  SkeletonTable,
  SkeletonList,
  SkeletonGrid,
} from "./Skeleton";
import {
  DashboardSkeleton,
  SearchPageSkeleton,
  BusinessListsSkeleton,
  BusinessDetailSkeleton,
  AdminDashboardSkeleton,
  AuthPageSkeleton,
} from "./PageSkeletons";

export const SkeletonDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Skeleton Loading Components
          </h1>

          <div className="space-y-12">
            {/* Basic Skeleton Components */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Basic Components
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Basic Skeleton</h3>
                  <Skeleton />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Skeleton Text</h3>
                  <SkeletonText lines={3} />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Skeleton Title</h3>
                  <SkeletonTitle />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Skeleton Button</h3>
                  <SkeletonButton />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Skeleton Input</h3>
                  <SkeletonInput />
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium mb-4">Skeleton Card</h3>
                  <SkeletonCard />
                </div>
              </div>
            </section>

            {/* Complex Skeleton Components */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Complex Components
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Skeleton Table</h3>
                  <SkeletonTable rows={3} columns={4} />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Skeleton List</h3>
                  <SkeletonList items={3} />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Skeleton Grid</h3>
                  <SkeletonGrid items={6} columns={3} />
                </div>
              </div>
            </section>

            {/* Page Skeletons */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Page Skeletons
              </h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-4">Dashboard Skeleton</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <DashboardSkeleton />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Search Page Skeleton
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <SearchPageSkeleton />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Business Lists Skeleton
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <BusinessListsSkeleton />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Business Detail Skeleton
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <BusinessDetailSkeleton />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Admin Dashboard Skeleton
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AdminDashboardSkeleton />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Auth Page Skeleton</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <AuthPageSkeleton />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
    </div>
  );
};
