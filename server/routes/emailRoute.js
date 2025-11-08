import express from 'express';
import verifyToken from '../middleware/verifyToken.js';
import EmailAccount from '../model/emailAccountModel.js';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';

const router = express.Router();

// Get all email accounts for logged-in user
router.get('/accounts', verifyToken, async (req, res) => {
  try {
    const accounts = await EmailAccount.find({ userId: req.user.id }).select('-password');
    res.status(200).json({ accounts });
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ message: 'Failed to fetch email accounts' });
  }
});

// Add new email account
router.post('/accounts/add', verifyToken, async (req, res) => {
  try {
    const { name, email, password, protocol, imapHost, imapPort, smtpHost, smtpPort } = req.body;

    console.log('req.user:', req.user); // Debug log
    console.log('userId:', req.user?.id); // Debug log

    if (!name || !email || !password || !imapHost || !smtpHost) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Skip IMAP connection test for now - save directly
    const emailAccount = new EmailAccount({
      userId: req.user.id,
      name,
      email,
      password, // In production, encrypt this
      protocol: protocol || 'imap',
      imapHost,
      imapPort: imapPort || 993,
      smtpHost,
      smtpPort: smtpPort || 465,
    });

    await emailAccount.save();
    res.status(201).json({ message: 'Email account added successfully', account: emailAccount });
  } catch (error) {
    console.error('Error adding email account:', error);
    res.status(500).json({ message: error.message || 'Failed to add email account' });
  }
});

// Fetch emails from specific account
router.get('/fetch/:accountId', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    const imap = new Imap({
      user: account.email,
      password: account.password,
      host: account.imapHost,
      port: account.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error('Error opening inbox:', err);
          return res.status(500).json({ message: 'Failed to open inbox' });
        }

        if (box.messages.total === 0) {
          imap.end();
          return res.status(200).json({ emails: [] });
        }

        // Fetch last 50 emails
        const fetchRange = Math.max(1, box.messages.total - 49) + ':*';
        const fetch = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true,
          markSeen: false
        });

        fetch.on('message', (msg, seqno) => {
          let emailData = { seqno };
          
          msg.on('body', (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err) {
                emailData.from = parsed.from?.text || 'Unknown';
                emailData.to = parsed.to?.text || '';
                emailData.subject = parsed.subject || '(No Subject)';
                emailData.date = parsed.date;
                emailData.body = parsed.text || parsed.html || '';
                emailData.text = parsed.text;
              }
            });
          });

          msg.once('attributes', (attrs) => {
            emailData.uid = attrs.uid;
            emailData.flags = attrs.flags || [];
            emailData.isRead = attrs.flags.includes('\\Seen');
          });

          msg.once('end', () => {
            emails.push(emailData);
          });
        });

        fetch.once('error', (err) => {
          console.error('Fetch error:', err);
          imap.end();
          res.status(500).json({ message: 'Failed to fetch emails' });
        });

        fetch.once('end', () => {
          // Wait longer for all async parsing to complete
          setTimeout(() => {
            imap.end();
            emails.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log(`Fetched ${emails.length} emails`);
            console.log('First email UID check:', emails[0]?.uid);
            console.log('Sample email:', JSON.stringify(emails[0], null, 2));
            res.status(200).json({ emails });
          }, 2000);
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP connection error:', err);
      res.status(500).json({ message: 'Failed to connect to email server' });
    });

    imap.connect();
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ message: 'Failed to fetch emails' });
  }
});

// Send email
router.post('/send', verifyToken, async (req, res) => {
  try {
    const { accountId, to, subject, body } = req.body;

    if (!accountId || !to || !subject || !body) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    const transporter = nodemailer.createTransport({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: true,
      auth: {
        user: account.email,
        pass: account.password,
      },
    });

    await transporter.sendMail({
      from: account.email,
      to,
      subject,
      text: body,
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

// Delete email account
router.delete('/accounts/:accountId', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    await EmailAccount.findOneAndDelete({ _id: accountId, userId: req.user.id });
    res.status(200).json({ message: 'Email account deleted successfully' });
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({ message: 'Failed to delete email account' });
  }
});

// Update email account
router.put('/accounts/:accountId', verifyToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { name, email, password, protocol, imapHost, imapPort, smtpHost, smtpPort } = req.body;

    if (!name || !email || !imapHost || !smtpHost) {
      return res.status(400).json({ message: 'All fields except password are required' });
    }

    const updateData = {
      name,
      email,
      protocol: protocol || 'imap',
      imapHost,
      imapPort: imapPort || 993,
      smtpHost,
      smtpPort: smtpPort || 465,
    };

    // Only update password if provided
    if (password) {
      updateData.password = password;
    }

    const updatedAccount = await EmailAccount.findOneAndUpdate(
      { _id: accountId, userId: req.user.id },
      updateData,
      { new: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    res.status(200).json({ message: 'Email account updated successfully', account: updatedAccount });
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(500).json({ message: 'Failed to update email account' });
  }
});

// Mark email as read
router.post('/mark-read/:accountId/:uid', verifyToken, async (req, res) => {
  try {
    const { accountId, uid } = req.params;
    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    const imap = new Imap({
      user: account.email,
      password: account.password,
      host: account.imapHost,
      port: account.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          console.error('Error opening inbox:', err);
          imap.end();
          return res.status(500).json({ message: 'Failed to open inbox' });
        }

        imap.addFlags(uid, ['\\Seen'], (err) => {
          imap.end();
          if (err) {
            console.error('Error marking as read:', err);
            return res.status(500).json({ message: 'Failed to mark as read' });
          }
          res.status(200).json({ message: 'Email marked as read' });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      res.status(500).json({ message: 'Failed to connect to email server' });
    });

    imap.connect();
  } catch (error) {
    console.error('Error marking email as read:', error);
    res.status(500).json({ message: 'Failed to mark email as read' });
  }
});

// Delete email
router.delete('/delete/:accountId/:uid', verifyToken, async (req, res) => {
  try {
    const { accountId, uid } = req.params;
    const account = await EmailAccount.findOne({ _id: accountId, userId: req.user.id });

    if (!account) {
      return res.status(404).json({ message: 'Email account not found' });
    }

    const imap = new Imap({
      user: account.email,
      password: account.password,
      host: account.imapHost,
      port: account.imapPort,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) {
          console.error('Error opening inbox:', err);
          imap.end();
          return res.status(500).json({ message: 'Failed to open inbox' });
        }

        // Mark as deleted
        imap.addFlags(uid, ['\\Deleted'], (err) => {
          if (err) {
            console.error('Error marking as deleted:', err);
            imap.end();
            return res.status(500).json({ message: 'Failed to delete email' });
          }
          
          // Expunge to permanently delete
          imap.expunge((err) => {
            imap.end();
            if (err) {
              console.error('Error expunging:', err);
              return res.status(500).json({ message: 'Failed to delete email' });
            }
            res.status(200).json({ message: 'Email deleted successfully' });
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP error:', err);
      res.status(500).json({ message: 'Failed to connect to email server' });
    });

    imap.connect();
  } catch (error) {
    console.error('Error deleting email:', error);
    res.status(500).json({ message: 'Failed to delete email' });
  }
});

export default router;
