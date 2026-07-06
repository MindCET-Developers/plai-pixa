import { he } from "@/lib/i18n/he";

export function StudentWaitingScreen({ name }: { name: string }) {
  return (
    <div className="glass-card w-full max-w-md border border-white/20 p-6 text-center text-white">
      <p className="text-sm font-bold text-white/70">PIXA</p>
      <h1 className="mt-2 text-2xl font-extrabold">{he.play.joinedSuccess}</h1>
      <p className="mt-2 text-white/80">
        {name}, {he.play.waitForStart}
      </p>
      <div className="mx-auto mt-6 h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-white" />
    </div>
  );
}
