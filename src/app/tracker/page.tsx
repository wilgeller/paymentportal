import { TopNav } from "@/components/top-nav";
import { VolumeTracker } from "@/components/volume-tracker";

export default function TrackerPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 bg-background px-6 py-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/70">
            Whop
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            Volume tracker
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/60">
            Live total volume across paid charges, refreshed automatically.
          </p>
        </div>
        <TopNav />
      </header>

      <VolumeTracker />
    </div>
  );
}
