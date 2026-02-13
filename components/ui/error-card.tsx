type ErrorCardProps = {
  title?: string;
  message: string;
  onRetry?: () => void;
};

export function ErrorCard({ title = "Something went wrong", message, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-4 text-red-900" role="alert">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          className="mt-3 rounded border border-red-300 bg-white px-3 py-1 text-sm"
          onClick={onRetry}
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
