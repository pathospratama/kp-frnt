// src/components/UploadErrorBoundary.tsx
"use client";

import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export class UploadErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[UploadErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            Terjadi kesalahan saat upload
          </p>
          <p className="mt-1 text-xs text-red-600">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Coba Lagi
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}