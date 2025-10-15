import { useEffect, useMemo, useRef, useState } from "react";

type RegenSettings = {
  fanVolt: number; // volt
  heaterTemp: number; // °C
  durationMin: number; // minutes
};

type ScabSettings = {
  fanVolt: number; // volt
  durationMin: number; // minutes
};

type SavedFormat = {
  id: string;
  title: string;
  regen: RegenSettings;
  scab: ScabSettings;
  savedAt: number;
};

const STORAGE_KEY = "panel-formats";

const SideBar = () => {
  const [title, setTitle] = useState("");
  const [regen, setRegen] = useState<RegenSettings>({
    fanVolt: 12,
    heaterTemp: 60,
    durationMin: 10,
  });
  const [scab, setScab] = useState<ScabSettings>({
    fanVolt: 9,
    durationMin: 5,
  });
  const [running, setRunning] = useState<"idle" | "running">("idle");

  // formats
  const [formats, setFormats] = useState<SavedFormat[]>([]);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); // popover for each card

  // load formats from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setFormats(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: SavedFormat[]) => {
    setFormats(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleStart = () => {
    setRunning("running");
    console.log("START ▶️", { regen, scab });
  };
  const handleStop = () => {
    setRunning("idle");
    console.log("STOP ⏹️");
  };

  const handleSave = () => {
    const cleanTitle = title.trim() || `Format ${new Date().toLocaleString()}`;
    const d = new Date();
    const fmt: SavedFormat = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      regen,
      scab,
      savedAt: `${d.getDate()}/${
        d.getMonth() + 1
      }/${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}` as unknown as number,
    };
    const next = [fmt, ...formats];
    persist(next);
    setTitle(""); // clear title after save
  };

  const handleUse = (fmt: SavedFormat) => {
    setRegen(fmt.regen);
    setScab(fmt.scab);
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    const next = formats.filter((f) => f.id !== id);
    persist(next);
    if (activeMenuId === id) setActiveMenuId(null);
  };

  const scrollByCard = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = 220; // approximate card width incl. gap
    el.scrollBy({
      left: dir === "left" ? -cardWidth : cardWidth,
      behavior: "smooth",
    });
  };

  const prettyDate = (ms: number) =>
    new Date(ms).toLocaleString(undefined, { hour12: false });

  const disabledStart = running === "running";
  const disabledStop = running === "idle";

  const statLine = useMemo(
    () =>
      `R:${regen.fanVolt}v/${regen.heaterTemp}°C/${regen.durationMin}m | S:${scab.fanVolt}v/${scab.durationMin}m`,
    [regen, scab]
  );

  return (
    <div className="fixed rounded-r-2xl left-0 top-0 h-screen w-[540px] bg-gray-900 text-gray-100 flex flex-col justify-between shadow-lg">
      {/* Header */}
      <div className="p-6 text-2xl text-center font-bold tracking-wider border-b border-gray-700">
        <span className="text-blue-500">SSSD</span>CartridgeTest
      </div>

      {/* Panel input */}
      <div className="flex-1 mt-4 overflow-y-auto px-6 pb-36 space-y-6">
        {/* Title */}
        <section className="space-y-4 mt-1">
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-5 text-sm text-gray-300">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ตั้งชื่อ format (เช่น Regen 60C / Scab 9v)"
              className="col-span-7 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </section>

        <hr className="border-gray-700" />

        {/* Regen mode */}
        <section className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-gray-400">
            Regen mode
          </h3>

          {/* Fan volt */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-5 text-sm text-gray-300">
              Fan volt (max 10) reset ค้าง 806182 กดค้าง C
            </label>
            <input
              type="number"
              className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
              step={0.1}
              max={10}
              value={regen.fanVolt}
              onChange={(e) =>
                setRegen((s) => ({ ...s, fanVolt: Number(e.target.value) }))
              }
            />
            <div className="col-span-2 text-right text-xs text-gray-400">
              volt
            </div>
          </div>

          {/* Heater temp */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-5 text-sm text-gray-300">
              Heater temp
            </label>
            <input
              type="number"
              className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
              step={1}
              value={regen.heaterTemp}
              onChange={(e) =>
                setRegen((s) => ({ ...s, heaterTemp: Number(e.target.value) }))
              }
            />
            <div className="col-span-2 text-right text-xs text-gray-400">
              °C
            </div>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-5 text-sm text-gray-300">Duration</label>
            <input
              type="number"
              className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
              step={1}
              value={regen.durationMin}
              onChange={(e) =>
                setRegen((s) => ({ ...s, durationMin: Number(e.target.value) }))
              }
            />
            <div className="col-span-2 text-right text-xs text-gray-400">
              นาที
            </div>
          </div>
        </section>

        <hr className="border-gray-700" />

        {/* Scab mode */}
        <section className="space-y-4">
          <h3 className="text-sm uppercase tracking-wider text-gray-400">
            Scab mode
          </h3>

          {/* Fan volt */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-5 text-sm text-gray-300">
              Fan volt (max 10)
            </label>
            <input
              type="number"
              className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
              step={0.1}
              max={10}
              value={scab.fanVolt}
              onChange={(e) =>
                setScab((s) => ({ ...s, fanVolt: Number(e.target.value) }))
              }
            />
            <div className="col-span-2 text-right text-xs text-gray-400">
              volt
            </div>
          </div>

          {/* Duration */}
          <div className="grid grid-cols-12 items-center gap-3">
            <label className="col-span-5 text-sm text-gray-300">Duration</label>
            <input
              type="number"
              className="col-span-5 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={0}
              step={1}
              value={scab.durationMin}
              onChange={(e) =>
                setScab((s) => ({ ...s, durationMin: Number(e.target.value) }))
              }
            />
            <div className="col-span-2 text-right text-xs text-gray-400">
              นาที
            </div>
          </div>
        </section>

        <hr className="border-gray-700" />

        {/* Save button */}
        <div className="flex items-center">
          <button
            onClick={handleSave}
            className="px-4 py-2 border w-full rounded-lg hover:bg-gray-800"
          >
            SAVE FORMAT
          </button>
        </div>

        {/* List Format that save */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm uppercase tracking-wider text-gray-400">
              List Formats
            </h4>
            {/* slide buttons */}
            <div className="hidden md:flex gap-2">
              <button
                onClick={() => scrollByCard("left")}
                className="px-2 py-1 rounded border border-gray-700 hover:bg-gray-800"
              >
                ◀
              </button>
              <button
                onClick={() => scrollByCard("right")}
                className="px-2 py-1 rounded border border-gray-700 hover:bg-gray-800"
              >
                ▶
              </button>
            </div>
          </div>

          {/* horizontal scroller */}
          <div
            ref={scrollerRef}
            className="flex gap-3 overflow-x-auto no-scrollbar pr-2"
          >
            {formats.length === 0 && (
              <div className="text-xs text-gray-500 py-2">
                ยังไม่มี Format ที่บันทึก
              </div>
            )}

            {formats.map((f) => (
              <div
                key={f.id}
                className="relative shrink-0 w-[210px] rounded-xl border border-gray-700 bg-gray-850/60 bg-gray-800 p-3 hover:border-blue-500 transition cursor-pointer"
                onClick={() =>
                  setActiveMenuId((prev) => (prev === f.id ? null : f.id))
                }
              >
                {/* Title (truncate) */}
                <div className="font-semibold text-sm text-white truncate">
                  {f.title}
                </div>
                <div className="text-[10px] text-gray-400 mb-1">
                  {prettyDate(f.savedAt)}
                </div>

                {/* preview values */}
                <div className="text-xs text-gray-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Regen</span>
                    <span>
                      {f.regen.fanVolt}v / {f.regen.heaterTemp}°C /{" "}
                      {f.regen.durationMin}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Scab</span>
                    <span>
                      {f.scab.fanVolt}v / {f.scab.durationMin}m
                    </span>
                  </div>
                </div>

                {/* popover menu */}
                {activeMenuId === f.id && (
                  <div className="absolute right-2 top-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUse(f);
                      }}
                      className="block px-3 py-2 text-sm text-blue-400 hover:bg-gray-800 rounded-t-lg w-full text-left"
                    >
                      USE
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(f.id);
                      }}
                      className="block px-3 py-2 text-sm text-rose-400 hover:bg-gray-800 rounded-b-lg w-full text-left"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* current summary */}
        <div className="text-[11px] text-gray-400 pt-1">
          Current: {statLine}
        </div>
      </div>

      {/* Footer actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            Status:{" "}
            <span
              className={
                running === "running" ? "text-green-400" : "text-gray-300"
              }
            >
              {running === "running" ? "Running" : "Idle"}
            </span>
          </div>
          <div className="flex gap-10">
            <button
              onClick={handleStart}
              disabled={disabledStart}
              className="px-4 py-2 w-[100px] rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start
            </button>
            <button
              onClick={handleStop}
              disabled={disabledStop}
              className="px-4 py-2 w-[100px] rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
