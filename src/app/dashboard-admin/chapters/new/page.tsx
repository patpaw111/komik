"use client";

import { Suspense } from "react";
import { ChapterCreateForm } from "./ChapterCreateForm";
import { SelectSeriesForm } from "./SelectSeriesForm";

export default function NewChapterPage() {
  return (
    <Suspense fallback={<div className="p-4">Memuat...</div>}>
      <ChapterPageContent />
    </Suspense>
  );
}

function ChapterPageContent() {
  return (
    <div className="flex w-full flex-col gap-6 px-2">
      <SelectSeriesForm />
      <ChapterCreateForm />
    </div>
  );
}

