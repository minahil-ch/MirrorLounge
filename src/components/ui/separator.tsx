'use client';

import * as React from 'react';

type SeparatorProps = {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Separator({ orientation = 'horizontal', className, ...props }: SeparatorProps) {
  return (
    <div
      role="separator"
      className={`shrink-0 bg-border ${orientation === 'vertical' ? 'w-px h-4' : 'h-[1px] w-full my-2'} ${className ?? ''}`}
      {...props}
    />
  );
}
