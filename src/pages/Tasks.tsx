import { CheckCircle2, Copy, ListTodo, Repeat, ThumbsDown, ThumbsUp, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CATEGORY_ICONS } from '../components/icons';
import { OptionTitle, useOption } from '../components/Recommendation';
import { Button, Card, Chip, Empty, Monogram, PageHeader, Segmented, cx } from '../components/ui';
import { primaryCategory } from '../lib/analyzer';
import { CATEGORY_BY_ID } from '../lib/categories';
import { accountName, monogram } from '../lib/catalog';
import { DAYS, timeAgo } from '../lib/time';
import type { Task, TaskStatus } from '../lib/types';
import { go } from '../router';
import { useStore } from '../store';

const TABS: { value: TaskStatus; label: string }[] = [
  { value: 'sent', label: 'In progress' },
  { value: 'todo', label: 'To do' },
  { value: 'done', label: 'Done' },
];

export function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const accounts = useStore((s) => s.accounts);
  const [tab, setTab] = useState<TaskStatus>(() => (tasks.some((t) => t.status === 'sent') ? 'sent' : 'todo'));

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { todo: 0, sent: 0, done: 0 };
    for (const t of tasks) c[t.status] += 1;
    return c;
  }, [tasks]);

  const stats = useMemo(() => {
    const now = Date.now();
    const week = tasks.filter((t) => now - t.createdAt < 7 * DAYS);
    const rated = tasks.filter((t) => t.rating);
    const good = rated.filter((t) => t.rating === 'good').length;
    const byAccount = new Map<string, number>();
    for (const t of week) if (t.pick) byAccount.set(t.pick.accountId, (byAccount.get(t.pick.accountId) ?? 0) + 1);
    const [topId] = [...byAccount.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    const top = accounts.find((a) => a.id === topId);
    return {
      week: week.length,
      done: week.filter((t) => t.status === 'done').length,
      satisfaction: rated.length ? Math.round((good / rated.length) * 100) : undefined,
      top: top ? `${accountName(top)}${top.label ? ` (${top.label})` : ''}` : undefined,
    };
  }, [tasks, accounts]);

  const list = tasks.filter((t) => t.status === tab);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Everything you routed through Quiver. Mark tasks done and rate the result; Quiver learns from your ratings."
        action={
          <Button variant="gold" onClick={() => go('new')}>
            New task
          </Button>
        }
      />

      {tasks.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Tasks this week" value={stats.week} />
          <Stat label="Done this week" value={stats.done} />
          <Stat label="Good results" value={stats.satisfaction === undefined ? '—' : `${stats.satisfaction}%`} />
          <Stat label="Most used" value={stats.top ?? '—'} small />
        </div>
      )}

      <div className="mb-4">
        <Segmented
          label="Task status"
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => ({
            value: t.value,
            label: (
              <span className="flex items-center gap-1.5">
                {t.label}
                <span className="text-xs text-ink-faint tabular-nums">{counts[t.value]}</span>
              </span>
            ),
          }))}
        />
      </div>

      {list.length === 0 ? (
        <Empty icon={<ListTodo size={32} />} title={tab === 'sent' ? 'Nothing in progress' : tab === 'todo' ? 'Nothing waiting' : 'Nothing done yet'}>
          {tab === 'done'
            ? 'Finished tasks land here with your rating.'
            : 'Describe a task on the New task page and Quiver will route it.'}
        </Empty>
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className={cx('mt-0.5 truncate font-display font-semibold tabular-nums', small ? 'text-base' : 'text-2xl')}>{value}</p>
    </Card>
  );
}

function TaskRow({ task }: { task: Task }) {
  const updateTask = useStore((s) => s.updateTask);
  const removeTask = useStore((s) => s.removeTask);
  const setDraft = useStore((s) => s.setDraft);
  const picked = useOption(task.pick);
  const [copied, setCopied] = useState(false);
  const category = primaryCategory(task.analysis);
  const Icon = CATEGORY_ICONS[category];

  const reroute = () => {
    setDraft(task.text);
    if (task.status === 'todo') removeTask(task.id);
    go('new');
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <p dir="auto" className="line-clamp-2 font-medium text-ink">
            {task.text}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
            <Chip>
              <Icon size={12} /> {CATEGORY_BY_ID[category].short}
            </Chip>
            <span>{timeAgo(task.status === 'done' && task.doneAt ? task.doneAt : task.sentAt ?? task.createdAt)}</span>
          </div>
        </div>
        {picked && (
          <div className="flex items-center gap-2.5">
            <Monogram text={monogram(picked.account)} size="sm" />
            <div className="text-sm leading-tight">
              <p className="font-medium">{picked.offering?.name ?? task.pick?.offeringId}</p>
              <OptionTitle account={picked.account} small />
            </div>
          </div>
        )}
        {task.pick && !picked && <p className="text-xs text-ink-faint">Sent to an AI you’ve since removed</p>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        {task.status === 'todo' && (
          <Button variant="primary" size="sm" onClick={reroute}>
            <Repeat size={14} /> Find the best AI
          </Button>
        )}
        {task.status === 'sent' && (
          <>
            <span className="mr-1 text-sm text-ink-soft">How did it go?</span>
            <Button variant="ghost" size="sm" onClick={() => updateTask(task.id, { status: 'done', doneAt: Date.now(), rating: 'good' })}>
              <ThumbsUp size={14} /> Good
            </Button>
            <Button variant="ghost" size="sm" onClick={() => updateTask(task.id, { status: 'done', doneAt: Date.now(), rating: 'bad' })}>
              <ThumbsDown size={14} /> Not great
            </Button>
            <Button variant="quiet" size="sm" onClick={() => updateTask(task.id, { status: 'done', doneAt: Date.now() })}>
              <CheckCircle2 size={14} /> Just mark done
            </Button>
          </>
        )}
        {task.status === 'done' && (
          <>
            <span className="mr-1 text-sm text-ink-soft">Result</span>
            <Chip active={task.rating === 'good'} onClick={() => updateTask(task.id, { rating: task.rating === 'good' ? undefined : 'good' })}>
              <ThumbsUp size={12} /> Good
            </Chip>
            <Chip active={task.rating === 'bad'} onClick={() => updateTask(task.id, { rating: task.rating === 'bad' ? undefined : 'bad' })}>
              <ThumbsDown size={12} /> Not great
            </Chip>
          </>
        )}
        <div className="ml-auto flex gap-1">
          {task.prompt && (
            <Button
              variant="quiet"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(task.prompt ?? '');
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                } catch {
                  /* clipboard blocked */
                }
              }}
            >
              <Copy size={14} /> {copied ? 'Copied' : 'Prompt'}
            </Button>
          )}
          {task.status !== 'todo' && (
            <Button variant="quiet" size="sm" onClick={reroute} title="Route this task again">
              <Repeat size={14} /> Again
            </Button>
          )}
          <Button variant="quiet" size="sm" onClick={() => removeTask(task.id)} aria-label="Delete task">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
