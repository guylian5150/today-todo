"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "today-todo.tasks";

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== "object") {
    return false;
  }

  const task = value as Record<string, unknown>;

  return (
    typeof task.id === "string" &&
    typeof task.text === "string" &&
    typeof task.completed === "boolean" &&
    typeof task.createdAt === "number"
  );
}

function readStoredTasks(): Task[] {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return [];
    }

    const parsedValue: unknown = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isTask) : [];
  } catch {
    return [];
  }
}

function createTaskId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [hasLoaded, setHasLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setTasks(readStoredTasks());
      setHasLoaded(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [hasLoaded, tasks]);

  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks],
  );
  const remainingCount = tasks.length - completedCount;

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newTask.trim();

    if (!text) {
      inputRef.current?.focus();
      return;
    }

    setTasks((currentTasks) => [
      {
        id: createTaskId(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
      ...currentTasks,
    ]);
    setNewTask("");
    inputRef.current?.focus();
  }

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  return (
    <main className="page-shell">
      <div className="sun-shape" aria-hidden="true" />
      <section className="todo-card" aria-labelledby="page-title">
        <header className="page-header">
          <div>
            <p className="eyebrow">Daily focus</p>
            <h1 id="page-title">Today</h1>
            <p className="intro">Make space for what matters.</p>
          </div>
          <div className="date-mark" aria-hidden="true">
            <span>{new Intl.DateTimeFormat("en", { weekday: "short" }).format()}</span>
            <strong>{new Date().getDate()}</strong>
          </div>
        </header>

        <form className="task-form" onSubmit={addTask}>
          <label className="sr-only" htmlFor="new-task">
            Add a task
          </label>
          <input
            ref={inputRef}
            id="new-task"
            name="task"
            type="text"
            value={newTask}
            onChange={(event) => setNewTask(event.target.value)}
            placeholder="What needs doing?"
            maxLength={120}
            autoComplete="off"
          />
          <button type="submit" aria-label="Add task" disabled={!newTask.trim()}>
            <PlusIcon />
            <span>Add task</span>
          </button>
        </form>

        <div className="list-heading" aria-live="polite">
          <p>
            {remainingCount === 0
              ? "All clear"
              : `${remainingCount} ${remainingCount === 1 ? "task" : "tasks"} left`}
          </p>
          {tasks.length > 0 && (
            <span>
              {completedCount}/{tasks.length} done
            </span>
          )}
        </div>

        {!hasLoaded ? (
          <div className="empty-state" aria-label="Loading tasks">
            <span className="loading-dot" />
            <p>Gathering your list...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">
              <CheckIcon />
            </div>
            <h2>A quiet list</h2>
            <p>Add your first task and give the day a little direction.</p>
          </div>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li className={task.completed ? "task completed" : "task"} key={task.id}>
                <button
                  className="check-button"
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={
                    task.completed
                      ? `Mark ${task.text} as incomplete`
                      : `Mark ${task.text} as complete`
                  }
                  aria-pressed={task.completed}
                >
                  {task.completed && <CheckIcon />}
                </button>
                <span className="task-text">{task.text}</span>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.text}`}
                >
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}

        <footer className="card-footer">
          <span aria-hidden="true">✦</span>
          <p>Your list stays on this device.</p>
        </footer>
      </section>
    </main>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12.5 4.2 4L19 7" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" />
    </svg>
  );
}
