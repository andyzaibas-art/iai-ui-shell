import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function RulesPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Rules</CardTitle>
            <CardDescription>Stub page (content later).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-neutral-300">
              Content coming soon…
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
