import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function HelpPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Help</CardTitle>
            <CardDescription>Quick FAQ.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <details className="rounded-xl border border-neutral-800 bg-neutral-900/20 p-4">
              <summary className="cursor-pointer text-sm font-medium text-neutral-100">
                What is I•A•I UI Shell?
              </summary>
              <div className="mt-2 text-sm text-neutral-300">
                This is a frontend shell to prototype the experience before backend integration.
              </div>
            </details>

            <details className="rounded-xl border border-neutral-800 bg-neutral-900/20 p-4">
              <summary className="cursor-pointer text-sm font-medium text-neutral-100">
                Where is my data stored?
              </summary>
              <div className="mt-2 text-sm text-neutral-300">
                Write/History uses localStorage (browser local-only).
              </div>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
