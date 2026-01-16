import * as React from 'react';
import { cn } from '@/lib/utils';

export type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, ...props }, ref) => {
  return (
    <div className="w-full overflow-auto">
      <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
});

Table.displayName = 'Table';

export type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => {
    return <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />;
  }
);

TableHeader.displayName = 'TableHeader';

export type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => {
    return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
  }
);

TableBody.displayName = 'TableBody';

export type TableRowProps = React.HTMLAttributes<HTMLTableRowElement>;

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn(
          'border-b transition-colors hover:bg-gray-50',
          'data-[state=selected]:bg-gray-100',
          className
        )}
        {...props}
      />
    );
  }
);

TableRow.displayName = 'TableRow';

export type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>;

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-medium text-gray-700',
          '[&:has([role=checkbox])]:pr-0',
          className
        )}
        {...props}
      />
    );
  }
);

TableHead.displayName = 'TableHead';

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => {
    return (
      <td
        ref={ref}
        className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
        {...props}
      />
    );
  }
);

TableCell.displayName = 'TableCell';

export type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement>;

const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  ({ className, ...props }, ref) => {
    return <caption ref={ref} className={cn('mt-4 text-sm text-gray-500', className)} {...props} />;
  }
);

TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
