import React from "react";

import { RegionFallback } from "./RegionFallback";

interface RegionErrorBoundaryProps {
  region: "sidebar" | "editor" | "panel";
  children: React.ReactNode;
}

interface RegionErrorBoundaryState {
  hasError: boolean;
  resetKey: number;
  errorMessage: string;
}

export class RegionErrorBoundary extends React.Component<
  RegionErrorBoundaryProps,
  RegionErrorBoundaryState
> {
  constructor(props: RegionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, resetKey: 0, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<RegionErrorBoundaryState> {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      `[RegionErrorBoundary:${this.props.region}]`,
      error,
      info.componentStack,
    );
  }

  private readonly handleRetry = (): void => {
    this.setState((prev) => ({ hasError: false, resetKey: prev.resetKey + 1, errorMessage: "" }));
  };

  render(): JSX.Element {
    if (this.state.hasError) {
      return (
        <RegionFallback
          region={this.props.region}
          errorMessage={this.state.errorMessage}
          onRetry={this.handleRetry}
        />
      );
    }
    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
