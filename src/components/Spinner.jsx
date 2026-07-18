export default function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block w-4 h-4 rounded-full border-2 border-primary-light border-t-primary animate-spin ${className}`}
    />
  );
}
