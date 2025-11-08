import mongoose from 'mongoose';

const emailAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      // NOTE: In production, this should be encrypted
    },
    protocol: {
      type: String,
      enum: ['imap', 'pop3'],
      default: 'imap',
    },
    imapHost: {
      type: String,
      required: true,
    },
    imapPort: {
      type: Number,
      default: 993,
    },
    smtpHost: {
      type: String,
      required: true,
    },
    smtpPort: {
      type: Number,
      default: 465,
    },
  },
  {
    timestamps: true,
  }
);

const EmailAccount = mongoose.model('EmailAccount', emailAccountSchema);

export default EmailAccount;
