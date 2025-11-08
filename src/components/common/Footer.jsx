const Footer = () => {
  return (
    <footer className="py-4 text-center border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} - Dremzone School of Creative Studies | Kasaragod
      </p>
    </footer>
  );
};

export default Footer;
