import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <p className="font-display text-3xl text-fg">Bir şeyler ters gitti</p>
          <p className="mt-2 text-sm text-muted">Sayfayı yenilemeyi deneyin. Sorun devam ederse TJK verisi geçici olarak erişilemez olabilir.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-bg"
          >
            Sayfayı yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
