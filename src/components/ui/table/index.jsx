import React from 'react';

// Table Component
const Table = React.forwardRef(({ children, className, ...rest }, ref) => {
  return <table ref={ref} className={`min-w-full  ${className}`} {...rest}>{children}</table>;
});
Table.displayName = 'Table';

// TableHeader Component
const TableHeader = React.forwardRef(({ children, className, ...rest }, ref) => {
  return <thead ref={ref} className={className} {...rest}>{children}</thead>;
});
TableHeader.displayName = 'TableHeader';

// TableBody Component
const TableBody = React.forwardRef(({ children, className, ...rest }, ref) => {
  return <tbody ref={ref} className={className} {...rest}>{children}</tbody>;
});
TableBody.displayName = 'TableBody';

// TableRow Component
const TableRow = React.forwardRef(({ children, className, ...rest }, ref) => {
  return <tr ref={ref} className={className} {...rest}>{children}</tr>;
});
TableRow.displayName = 'TableRow';

// TableCell Component
const TableCell = React.forwardRef(({
  children,
  isHeader = false,
  className,
  ...rest
}, ref) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag ref={ref} className={` ${className}`} {...rest}>{children}</CellTag>;
});
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableCell };
