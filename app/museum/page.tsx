"use client";

import Link from "next/link";

import { LocaleToggle } from "@/components/LocaleToggle";
import { MuseumCard } from "@/components/MuseumCard";
import { Terminal } from "@/components/Terminal";
import { t } from "@/lib/i18n";
import { useGameStore } from "@/store/gameStore";

export default function MuseumPage() {
  const records = useGameStore((state) => state.museumRecords);
  const locale = useGameStore((state) => state.settings.locale);

  return (
    <main className="min-h-screen px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-pixel text-lg text-phosphor">{t(locale, "museum.title")}</div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
              {t(locale, "museum.body")}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <LocaleToggle />
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 transition hover:bg-white/10"
            >
              {t(locale, "museum.back")}
            </Link>
          </div>
        </div>
        <Terminal className="p-6 sm:p-8">
          {records.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/10 p-12 text-center">
              <div className="font-pixel text-sm text-phosphor">{t(locale, "museum.emptyTitle")}</div>
              <p className="mt-4 text-sm leading-7 text-white/60">
                {t(locale, "museum.emptyBody")}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {records.map((record) => (
                <MuseumCard key={record.id} record={record} locale={locale} />
              ))}
            </div>
          )}
        </Terminal>
      </div>
    </main>
  );
}
