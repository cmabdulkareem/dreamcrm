export const validatePassword = (password) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}$/;
  
  if (!regex.test(password)) {
    return "Password must be at least 8 characters long, and include uppercase, lowercase, number, and special character.";
  }
  
  return null;
};
