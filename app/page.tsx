"use client";

import { useMemo, useState } from "react";
import rulesRaw from "../data/rules.json";

type Rule = {
  rule_id: string;
  rule_sentence: string;
  trigger_text: string;
};

const RULES = rulesRaw as Rule[];

// ---------- utils ----------
function escapeHtml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const words = q.trim().split(/\s+/).filter((w) => w.length >= 2);
  if (words.length === 0) return text;

  const pattern = words.map(escapeRegExp).join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  return text.replace(re, `<mark class="bg-yellow-200 px-1 rounded">$1</mark>`);
}

function boldJobCode(text: string) {
  return text.replace(
    /(\d{4,5}\s[가-힣][가-힣\s]{1,30})/g,
    `<strong>$1</strong>`
  );
}

function norm(s: string) {
  return s.replace(/\s+/g, "").toLowerCase();
}

function splitTriggers(triggerText: string) {
  return (triggerText || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// ---------- main ----------
type Scored = {
  rule: Rule;
  score: number;
  matchedTriggers: string[];
};

export default function Page() {
  const [q, setQ] = useState("");

  const results = useMemo<Scored[]>(() => {
    const query = q.trim();
    if (!query) return [];

    const qN = norm(query);
    const qWords = query.split(/\s+/).map((w) => w.trim()).filter(Boolean);

    const scored = RULES.map((rule) => {
      const triggers = splitTriggers(rule.trigger_text);
      const sentenceN = norm(rule.rule_sentence);

      let score = 0;
      const matchedTriggers: string[] = [];

      // trigger matching (higher weight)
      for (const t of triggers) {
        const tN = norm(t);
        if (!tN) continue;

        if (qN.includes(tN)) {
          score += 6;
          matchedTriggers.push(t);
          continue;
        }

        for (const w of qWords) {
          const wN = norm(w);
          if (wN.length >= 2 && tN.includes(wN)) {
            score += 2;
            if (!matchedTriggers.includes(t)) matchedTriggers.push(t);
            break;
          }
        }
      }

      // sentence bonus
      for (const w of qWords) {
        const wN = norm(w);
        if (wN.length >= 2 && sentenceN.includes(wN)) score += 1;
      }

      return { rule, score, matchedTriggers };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.rule.rule_id.localeCompare(b.rule.rule_id));

    return scored;
  }, [q]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold text-gray-900">경제활동인구조사 직업분류 도우미</h1>
      <p className="mt-2 text-sm text-gray-600">
        제8차 한국표준직업분류(KSCO) 이용 지침을 참고하여 직업분류 규칙을 검색할 수 있도록 구성한 도우미입니다.
      </p>

      <div className="mt-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="예: 감자 재배"
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:border-black focus:outline-none"
        />
      </div>

      {q.trim() && (
        <div className="mt-4 text-sm text-gray-700">
          결과 <strong>{results.length}</strong>건
        </div>
      )}

      {q.trim() && results.length === 0 && (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
          “<strong>{q}</strong>”에 대한 검색결과가 없습니다.
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {results.map((item, idx) => {
          const r = item.rule;
          const html = boldJobCode(highlight(escapeHtml(r.rule_sentence), q));
          const isTop = idx === 0;

          return (
            <li
              key={r.rule_id}
              className={[
                "rounded-md border bg-white p-4",
                isTop ? "border-black ring-1 ring-black/10" : "border-gray-200",
              ].join(" ")}
            >
              <div className="mb-2 flex items-center gap-2">
                <div className="text-xs text-gray-500">{r.rule_id}</div>

                {isTop && (
                  <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                    Top match
                  </span>
                )}

                <div className="ml-auto text-xs text-gray-500">score {item.score}</div>
              </div>

              <p
                className="text-sm leading-6 text-gray-900"
                dangerouslySetInnerHTML={{ __html: html }}
              />

              {/* matched triggers (chips) */}
              {item.matchedTriggers.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-gray-500 mr-1">판단 근거</span>
                  {item.matchedTriggers.slice(0, 6).map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700"
                    >
                      {t}
                    </span>
                  ))}
                  {item.matchedTriggers.length > 6 && (
                    <span className="text-xs text-gray-500">
                      +{item.matchedTriggers.length - 6}
                    </span>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
