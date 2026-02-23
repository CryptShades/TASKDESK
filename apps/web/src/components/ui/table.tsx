import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

interface TableProps extends HTMLAttributes<HTMLTableElement> {}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

export function Table({ className, ...props }: TableProps) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-surface-raised/70 data-[state=selected]:bg-surface-raised',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle text-xs font-medium text-foreground-muted [&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TableCellProps) {
  return (
    <td
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  );
}
