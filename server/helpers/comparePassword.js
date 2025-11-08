import bcrypt from "bcryptjs";

export const comparePassword = async (plain, hashed) => {
  return await bcrypt.compare(plain, hashed);
};
