'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, MicOff, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useScrollLock } from '@/lib/hooks';
import { services } from '@/content/services';
import { rooms, equipment } from '@/content/studio';
import { team } from '@/content/people';
import { projects } from '@/content/work';
import { posts } from '@/content/posts';
import { courses, beats, events } from '@/content/commerce';

/**
 * Site search.
 *
 * The index is built from the same content modules the pages render, so a new
 * service or post is searchable the moment it is added — there is no second
 * list to forget to update. It runs entirely in the browser: the corpus is a
 * few hundred short records, which is far below the size where shipping a
 * search service would beat scoring them locally.
 */

type Entry = {
  title: string;
  href: string;
  group: string;
  /** Lowercased haystack — title, summary and tags concatenated. */
  haystack: string;
  description: string;
};

function buildIndex(): Entry[] {
  const entries: Entry[] = [];

  for (const service of services) {
    entries.push({
      title: service.name,
      href: `/services/${service.slug}`,
      group: 'Services',
      description: service.summary,
      haystack: `${service.name} ${service.summary} ${service.category}`.toLowerCase(),
    });
  }

  for (const room of rooms) {
    entries.push({
      title: room.name,
      href: `/rooms/${room.slug}`,
      group: 'Rooms',
      description: room.summary,
      haystack: `${room.name} ${room.kind} ${room.summary}`.toLowerCase(),
    });
  }

  for (const item of equipment) {
    entries.push({
      title: `${item.manufacturer} ${item.name}`,
      href: `/equipment#${item.slug}`,
      group: 'Equipment',
      description: item.summary,
      haystack: `${item.manufacturer} ${item.name} ${item.summary} ${item.category}`.toLowerCase(),
    });
  }

  for (const member of team) {
    entries.push({
      title: member.name,
      href: `/team/${member.slug}`,
      group: 'Team',
      description: member.role,
      haystack: `${member.name} ${member.role} ${member.skills.join(' ')}`.toLowerCase(),
    });
  }

  for (const project of projects) {
    entries.push({
      title: `${project.title} — ${project.artist}`,
      href: `/work/${project.slug}`,
      group: 'Work',
      description: project.summary,
      haystack: `${project.title} ${project.artist} ${project.summary} ${project.kind}`.toLowerCase(),
    });
  }

  for (const post of posts) {
    entries.push({
      title: post.title,
      href: `/blog/${post.slug}`,
      group: 'Journal',
      description: post.excerpt,
      haystack: `${post.title} ${post.excerpt} ${post.tags.join(' ')}`.toLowerCase(),
    });
  }

  for (const course of courses) {
    entries.push({
      title: course.title,
      href: `/academy#${course.slug}`,
      group: 'Academy',
      description: course.summary,
      haystack: `${course.title} ${course.summary} ${course.level}`.toLowerCase(),
    });
  }

  for (const beat of beats) {
    entries.push({
      title: beat.title,
      href: `/beats#${beat.slug}`,
      group: 'Beats',
      description: `${beat.bpm} BPM · ${beat.key}`,
      haystack: `${beat.title} ${beat.producer} ${beat.genres.join(' ')} ${beat.key}`.toLowerCase(),
    });
  }

  for (const studioEvent of events) {
    entries.push({
      title: studioEvent.title,
      href: `/events#${studioEvent.slug}`,
      group: 'Events',
      description: studioEvent.summary,
      haystack: `${studioEvent.title} ${studioEvent.summary} ${studioEvent.kind}`.toLowerCase(),
    });
  }

  return entries;
}

/** Minimal typing for the vendor-prefixed speech API, which is not in lib.dom. */
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: { 0: { 0: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function SiteSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const index = useMemo(buildIndex, []);
  useScrollLock(open);

  useEffect(() => {
    const constructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    setVoiceSupported(Boolean(constructor));
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    // Focus after the dialog has mounted, or the browser focuses nothing.
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];

    const terms = needle.split(/\s+/);

    return index
      .map((entry) => {
        // Every term must appear somewhere, then a title match outranks a
        // description match. Good enough for a corpus this size, and it never
        // returns a result the visitor cannot see the reason for.
        const matchesAll = terms.every((term) => entry.haystack.includes(term));
        if (!matchesAll) return null;

        const title = entry.title.toLowerCase();
        const score =
          (title.startsWith(needle) ? 100 : 0) +
          (title.includes(needle) ? 50 : 0) +
          terms.filter((term) => title.includes(term)).length * 10;

        return { entry, score };
      })
      .filter((match): match is { entry: Entry; score: number } => match !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((match) => match.entry);
  }, [index, query]);

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const constructor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    if (!constructor) return;

    const recognition = new constructor();
    recognition.lang = document.documentElement.lang || 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      setQuery(event.results[0][0].transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-canvas/80 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="mx-auto mt-24 w-full max-w-2xl px-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="glass overflow-hidden rounded-panel shadow-panel">
              <div className="flex items-center gap-3 border-b border-line px-5">
                <Search className="size-5 shrink-0 text-ink-subtle" aria-hidden />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search services, rooms, gear, people, work…"
                  aria-label="Search"
                  className="h-16 flex-1 bg-transparent text-base outline-none placeholder:text-ink-subtle"
                />
                {voiceSupported ? (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    aria-label={listening ? 'Stop voice search' : 'Search by voice'}
                    aria-pressed={listening}
                    className={cn(
                      'rounded-full p-2 transition-colors',
                      listening ? 'bg-brand/15 text-brand' : 'text-ink-subtle hover:text-ink',
                    )}
                  >
                    {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="rounded-full p-2 text-ink-subtle hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="max-h-[55vh] overflow-y-auto p-2" role="listbox" aria-label="Search results">
                {query.trim().length < 2 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink-subtle">
                    {listening
                      ? 'Listening…'
                      : 'Type at least two characters, or use the microphone.'}
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-ink-subtle">
                    Nothing matched “{query}”. Try a service, a room or an engineer’s name.
                  </p>
                ) : (
                  <ul>
                    {results.map((entry) => (
                      <li key={entry.href + entry.title}>
                        <Link
                          href={entry.href}
                          onClick={onClose}
                          className="flex items-baseline gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-surface-raised"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{entry.title}</span>
                            <span className="block truncate text-xs text-ink-subtle">
                              {entry.description}
                            </span>
                          </span>
                          <span className="shrink-0 text-[0.65rem] uppercase tracking-widest text-ink-subtle">
                            {entry.group}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
