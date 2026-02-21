const Footer = () => {
  return (
    <footer className="py-4 text-center border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Copyright &copy; {new Date().getFullYear()} - CDC International, Crafted by{" "}
        <a
          href="https://www.codesprouts.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-500 hover:text-brand-600 transition-colors duration-200"
        >
          CodeSprouts innovation
        </a>
      </p>
    </footer>
  );
};

export default Footer;
