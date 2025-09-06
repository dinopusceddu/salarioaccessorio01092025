// src/components/dashboard/HomePageSkeleton.tsx
import React from 'react';
import { Card } from '../shared/Card.tsx';
import { Skeleton } from '../shared/Skeleton.tsx';

export const HomePageSkeleton: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* DashboardSummary Skeleton */}
            <Card>
                <div className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-8 w-48" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-8 w-44" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-8 w-52" />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <div className="p-6">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <div className="flex justify-center items-center h-64">
                            <Skeleton className="h-48 w-48 rounded-full" />
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="p-6">
                        <Skeleton className="h-6 w-1/2 mb-4" />
                        <div className="flex justify-center items-center h-64">
                            <Skeleton className="h-48 w-48 rounded-full" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Compliance Widget Skeleton */}
            <Card>
                <div className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            </Card>
        </div>
    );
}
