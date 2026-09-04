export function Background() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -left-32 -top-32 size-[480px] rounded-full bg-amber-200/35 blur-[120px]" />
      <div className="absolute right-[-120px] top-1/4 size-[420px] rounded-full bg-orange-200/35 blur-[120px]" />
      <div className="absolute bottom-[-140px] left-1/3 size-[460px] rounded-full bg-yellow-200/35 blur-[130px]" />
      <div className="absolute right-1/4 top-[-100px] size-[300px] rounded-full bg-stone-200/40 blur-[100px]" />
    </div>
  );
}
