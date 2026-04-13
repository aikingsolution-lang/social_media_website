"use client";

import { CalendarDays, Clock3 } from "lucide-react";

type QuickScheduleProps = {
    scheduleDate: string;
    setScheduleDate: (value: string) => void;
    scheduleTime: string;
    setScheduleTime: (value: string) => void;
};

export default function QuickSchedule({
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
}: QuickScheduleProps) {
    return (
        <div className="rounded-[28px] border border-white/10 bg-[#041434] p-6 shadow-[0_0_35px_rgba(59,130,246,0.08)]">
            <h2 className="text-3xl font-bold leading-tight text-white">
                Quick Schedule
            </h2>
            <p className="mt-2 text-sm text-slate-400">
                Choose date and time before creating a scheduled post.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-300">
                        Schedule date
                    </label>
                    <div className="relative">
                        <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="h-16 w-full rounded-[22px] border border-white/10 bg-[#0a193a] px-5 pr-12 text-lg text-white outline-none focus:border-violet-500/50"
                        />
                        <CalendarDays className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>

                <div>
                    <label className="mb-3 block text-sm font-semibold text-slate-300">
                        Schedule time
                    </label>
                    <div className="relative">
                        <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="h-16 w-full rounded-[22px] border border-white/10 bg-[#0a193a] px-5 pr-12 text-lg text-white outline-none focus:border-violet-500/50"
                        />
                        <Clock3 className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}