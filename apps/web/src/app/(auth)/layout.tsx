export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground">
            Taskdesk
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-primary" />
          </h1>
          <p className="mt-2 text-sm italic text-foreground-muted">
            See what&apos;s about to break — before it does.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}