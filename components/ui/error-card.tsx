type ErrorCardProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorCard({ title = "Something went wrong", message, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive-foreground" role="alert">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm opacity-90">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-3 rounded-md border border-destructive/40 bg-background px-3 py-1 text-sm text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
