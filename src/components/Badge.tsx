import React from 'react';

type Tone = 'good' | 'info' | 'warn' | 'neutral';

type Props = {
  label: string;
  tone?: Tone;
};

const toneClass: Record<Tone, string> = {
  good: 'badgeGood',
  info: 'badgeInfo',
  warn: 'badgeWarn',
  neutral: 'badgeNeutral'
};

export default function Badge({ label, tone = 'neutral' }: Props) {
  return (
    <span className={`badge ${toneClass[tone]}`}>{label}</span>
  );
}
