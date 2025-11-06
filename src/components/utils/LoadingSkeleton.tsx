import React from 'react';
import { classNames } from '../../utils/format';

interface LoadingSkeletonProps {
  className?: string;
}

export function LoadingSkeleton({ className = "" }: LoadingSkeletonProps) {
  return (
    <div className={classNames("animate-pulse rounded-2xl bg-gray-200", className)}>
      <div className="h-full w-full" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="h-8 w-1/2 rounded bg-gray-200" />
        <div className="h-24 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}
