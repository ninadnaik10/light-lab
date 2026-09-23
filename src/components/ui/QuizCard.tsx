import { useState } from 'react'
import { Button } from './Button'
import { Card } from './Card'

export type QuizOption = { label: string; correct?: boolean; explain: string }
export type QuizQuestion = {
  id: string
  prompt: string
  options: QuizOption[]
  /** Sets the visualization to the scenario of this question ("Show me"). */
  applyScenario?: () => void
}

/**
 * Predict-then-reveal quiz. The student commits to an answer, then sees whether
 * it is right, a one-line explanation, and can jump the diagram to the scenario.
 */
export function QuizCard({ questions, title = 'Predict, then check' }: { questions: QuizQuestion[]; title?: string }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  if (questions.length === 0) return null
  const q = questions[index % questions.length]
  const chosen = picked !== null ? q.options[picked] : null
  const next = () => {
    setPicked(null)
    setIndex((i) => (i + 1) % questions.length)
  }
  return (
    <Card title={title} tone="accent" action={<span className="text-xs text-slate-500">{(index % questions.length) + 1} / {questions.length}</span>}>
      <p className="mb-3 text-sm leading-relaxed text-slate-100">{q.prompt}</p>
      <div className="space-y-1.5">
        {q.options.map((o, i) => {
          const isPicked = picked === i
          const reveal = picked !== null
          const cls = !reveal
            ? 'border-slate-700 bg-slate-900 hover:border-cyan-500/60 hover:bg-slate-800'
            : o.correct
              ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-100'
              : isPicked
                ? 'border-rose-500/70 bg-rose-500/10 text-rose-100'
                : 'border-slate-800 bg-slate-900/50 text-slate-500'
          return (
            <button key={o.label} type="button" disabled={reveal} onClick={() => setPicked(i)} className={`block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${cls}`}>
              <span className="mr-2 font-mono text-xs opacity-70">{String.fromCharCode(65 + i)}</span>
              {o.label}
            </button>
          )
        })}
      </div>
      {chosen && (
        <div className="fade-in mt-3 space-y-2">
          <p className={`text-sm font-semibold ${chosen.correct ? 'text-emerald-300' : 'text-rose-300'}`}>{chosen.correct ? 'Correct!' : 'Not quite.'}</p>
          <p className="text-sm text-slate-300">{chosen.correct ? chosen.explain : `${chosen.explain} ${q.options.find((o) => o.correct)?.explain ?? ''}`}</p>
          <div className="flex gap-2">
            {q.applyScenario && (
              <Button variant="primary" size="sm" onClick={q.applyScenario}>
                Show me
              </Button>
            )}
            <Button size="sm" onClick={next}>
              Next question
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
