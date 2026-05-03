import { RetroWindow } from "@/components/ui/RetroWindow";

interface RetroDialogProps {
  message: string;
}

export function RetroDialog({ message }: RetroDialogProps) {
  return (
    <RetroWindow title="Alert.exe" className="retro-dialog">
      <p>{message}</p>
    </RetroWindow>
  );
}
