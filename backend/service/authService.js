
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendVerificationEmail } from '../config/sendVerificationEmail.js';

class AuthService {
  constructor(userModel, tokenService) {
    this.userModel = userModel;
    this.tokenService = tokenService;
  }

  async register(Username, Full_Name, email, password, dob, role) {
    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = await this.userModel.create({
      Username,
      Full_Name,
      email,
      password: hashedPassword,
      dob,
      role,
      verificationToken,
      isVerified: false
    });

    await sendVerificationEmail(email, verificationToken);

    return { message: 'Verification email sent. Please verify to continue.' };
  }

  async authenticate(email, password) {
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email before logging in.');
    }

    return this.tokenService.generateToken(user);
  }

  

  async logout(res) {
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
  }
}

export default AuthService;
