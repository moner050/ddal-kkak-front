import React from 'react';

interface EmptyStateProps {
  message?: string;
  icon?: string;
}

export default function EmptyState({
  message = "표시할 데이터가 없습니다.",
  icon = "📭"
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <div className="text-sm text-gray-600">{message}</div>
    </div>
  );
}
