'use client';
import { Component, type ReactNode } from 'react';

/** A failed 3D chunk must never take navigation or shopping controls with it. */
export class PreviewBoundary extends Component<
  {
    children: ReactNode;
    onError: () => void;
  },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
