import { Gamepad2, Video, Wrench, PenLine, HelpCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAppMode } from "../contexts/AppModeContext";

export default function OnboardingScreen() {
  const { transitionToChat } = useAppMode();

  const items: Array<{
    id: "game" | "video" | "app" | "writing" | "not sure";
    label: string;
    Icon: any;
  }> = [
    { id: "game", label: "Game", Icon: Gamepad2 },
    { id: "video", label: "Video", Icon: Video },
    { id: "app", label: "App / Tool", Icon: Wrench },
    { id: "writing", label: "Writing", Icon: PenLine },
    { id: "not sure", label: "Not sure", Icon: HelpCircle },
  ];

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="text-5xl font-semibold tracking-tight text-neutral-100">
            I•A•I
          </div>
          <div className="text-sm text-neutral-400">
            Local-first · Private by default
          </div>
          <div className="text-base text-neutral-200 pt-2">
            What do you want to create today?
          </div>
        </div>

        <div className="space-y-3">
          {items.map(({ id, label, Icon }) => (
            <Button
              key={id}
              variant="outline"
              onClick={() => transitionToChat(id)}
              className="w-full justify-start h-auto py-4 px-5"
            >
              <span className="mr-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-900/60 border border-neutral-800">
                <Icon className="h-5 w-5 text-neutral-200" />
              </span>
              <span className="text-base font-medium">{label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
