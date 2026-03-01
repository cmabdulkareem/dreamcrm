// Table Component
const Table = ({ children, className, ...rest }) => {
  return <table className={`min-w-full  ${className}`} {...rest}>{children}</table>;
};

// TableHeader Component
const TableHeader = ({ children, className, ...rest }) => {
  return <thead className={className} {...rest}>{children}</thead>;
};

// TableBody Component
const TableBody = ({ children, className, ...rest }) => {
  return <tbody className={className} {...rest}>{children}</tbody>;
};

// TableRow Component
const TableRow = ({ children, className, ...rest }) => {
  return <tr className={className} {...rest}>{children}</tr>;
};

// TableCell Component
const TableCell = ({
  children,
  isHeader = false,
  className,
  ...rest
}) => {
  const CellTag = isHeader ? "th" : "td";
  return <CellTag className={` ${className}`} {...rest}>{children}</CellTag>;
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
