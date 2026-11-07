"use client";
import { useActionState, useState } from "react";
import { createClient, saveSecret, setMark, setTaskStatus, type ActionResult } from "@/lib/actions";
import { t } from "@/lib/texts";

const btn = "rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50";
const btnMain = `${btn} bg-stone-900 text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300`;
const btnSoft = `${btn} border border-stone-300 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800`;
const input = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-950";

function Result({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return (
    <p role="status" className={`text-sm ${state.ok ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
      {state.message}
    </p>
  );
}

export function TaskActions({ client, id, status, kind }: { client: string; id: string; status: string; kind?: string }) {
  const [state, action, pending] = useActionState(setTaskStatus, null);
  const [answer, setAnswer] = useState("");
  const needsAnswer = kind === "decision";
  const current = state?.ok && state.status ? state.status : status;
  if (current !== "open") {
    return (
      <form action={action} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="client" value={client} />
        <input type="hidden" name="id" value={id} />
        <Result state={state} />
        <button name="status" value="open" disabled={pending} className={btnSoft}>{t.tasks.reopen}</button>
      </form>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="client" value={client} />
      <input type="hidden" name="id" value={id} />
      <label className="block text-xs text-stone-600 dark:text-stone-400">
        {t.tasks.answer}
        <textarea name="answer" rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} className={`${input} mt-1`} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button name="status" value="done" disabled={pending || (needsAnswer && !answer.trim())} className={btnMain}
                title={needsAnswer && !answer.trim() ? t.tasks.answerRequired : undefined}>
          {pending ? t.saving : t.tasks.done}
        </button>
        <button name="status" value="skipped" disabled={pending} className={btnSoft}>{t.tasks.skip}</button>
      </div>
      {needsAnswer && !answer.trim() && <p className="text-xs text-stone-500">{t.tasks.answerRequired}</p>}
      <Result state={state} />
    </form>
  );
}

export function MarkForm({ id, scope, client, status, note }: { id: string; scope: string; client?: string; status: string; note?: string }) {
  const [state, action, pending] = useActionState(setMark, null);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="scope" value={scope} />
      <input type="hidden" name="client" value={client ?? ""} />
      <div className="flex flex-wrap gap-3 text-sm">
        {(["done", "partial", "missing", "not_needed"] as const).map((s) => (
          <label key={s} className="flex items-center gap-1">
            <input type="radio" name="status" value={s} defaultChecked={s === status} /> {t.status[s]}
          </label>
        ))}
      </div>
      <input name="note" defaultValue={note} placeholder={t.setup.note} className={input} />
      <button disabled={pending} className={btnSoft}>{pending ? t.saving : t.setup.save}</button>
      <Result state={state} />
    </form>
  );
}

export function SecretForm({ name, hint }: { name: string; hint?: string }) {
  const [state, action, pending] = useActionState(saveSecret, null);
  return (
    <form action={action} className="space-y-2" autoComplete="off">
      <input type="hidden" name="name" value={name} />
      <label className="block text-xs text-stone-600 dark:text-stone-400">
        {t.keys.value} <code className="font-mono">{name}</code>
        {name === "GSC_CREDENTIALS"
          ? <textarea name="value" rows={3} className={`${input} mt-1 font-mono`} spellCheck={false} />
          : <input name="value" type="password" className={`${input} mt-1 font-mono`} spellCheck={false} />}
      </label>
      {hint && <p className="text-xs text-stone-500">{hint}</p>}
      <button disabled={pending} className={btnMain}>{pending ? t.saving : t.keys.save}</button>
      <Result state={state} />
    </form>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className={btnSoft}
            onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? t.tasks.copied : t.tasks.copy}
    </button>
  );
}

export function NewClientForm() {
  const [state, action, pending] = useActionState(createClient, null);
  const f = t.newClient;
  const field = (name: string, label: string, opts: { area?: boolean; placeholder?: string; required?: boolean } = {}) => (
    <label className="block text-sm">
      <span className="text-stone-700 dark:text-stone-300">{label}{opts.required && " *"}</span>
      {opts.area
        ? <textarea name={name} rows={3} placeholder={opts.placeholder} required={opts.required} className={`${input} mt-1`} />
        : <input name={name} placeholder={opts.placeholder} required={opts.required} className={`${input} mt-1`} />}
    </label>
  );
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {field("name", f.name, { placeholder: "acme-coffee", required: true })}
      {field("title", f.title_, { placeholder: "Acme Coffee" })}
      {field("domain", f.domain, { placeholder: "https://example.uz/", required: true })}
      {field("cms", f.cms, { placeholder: "wordpress | tilda | bitrix | custom" })}
      {field("region", f.region, { placeholder: "Tashkent, Uzbekistan" })}
      <fieldset className="text-sm">
        <legend className="text-stone-700 dark:text-stone-300">{f.languages} *</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {["ru", "uz-Latn", "uz-Cyrl", "en"].map((l) => (
            <label key={l} className="flex items-center gap-1"><input type="checkbox" name="languages" value={l} defaultChecked={l === "ru"} /> {l}</label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">{field("services", f.services, { area: true, required: true })}</div>
      {field("key_urls", f.keyUrls, { area: true })}
      {field("competitors", f.competitors, { area: true })}
      {field("gsc_site", f.gsc, { placeholder: "sc-domain:example.uz" })}
      {field("brand_tone", f.tone, { placeholder: "дружелюбно, на «вы», без канцелярита" })}
      <div className="sm:col-span-2">{field("forbidden_claims", f.forbidden, { area: true, placeholder: "самые низкие цены" })}</div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button disabled={pending} className={btnMain}>{pending ? t.saving : f.submit}</button>
        <Result state={state} />
      </div>
    </form>
  );
}
