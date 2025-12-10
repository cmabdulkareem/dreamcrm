import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import { PlusIcon, RefreshIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

import API from "../../config/api";

export default function EmailInbox() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loading, setLoading] = useState(false);

  const { isOpen: isAccountModalOpen, openModal: openAccountModal, closeModal: closeAccountModal } = useModal();
  const { isOpen: isComposeModalOpen, openModal: openComposeModal, closeModal: closeComposeModal } = useModal();
  const { isOpen: isEmailModalOpen, openModal: openEmailModal, closeModal: closeEmailModal } = useModal();
  const { isOpen: isEditAccountModalOpen, openModal: openEditAccountModal, closeModal: closeEditAccountModal } = useModal();

  // Add Email Account form
  const [accountName, setAccountName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [protocol, setProtocol] = useState("imap");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("465");

  // Compose Email form
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  // Edit account
  const [editingAccountId, setEditingAccountId] = useState(null);

  useEffect(() => {
    fetchEmailAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchEmails();
    }
  }, [selectedAccount]);

  const fetchEmailAccounts = async () => {
    try {
      const response = await axios.get(`${API}/email/accounts`, { withCredentials: true });
      setEmailAccounts(response.data.accounts || []);
      if (response.data.accounts?.length > 0 && !selectedAccount) {
        setSelectedAccount(response.data.accounts[0]._id);
      }
    } catch (error) {
      console.error("Error fetching email accounts:", error);
    }
  };

  const fetchEmails = async () => {
    if (!selectedAccount) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API}/email/fetch/${selectedAccount}`, { withCredentials: true });
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error("Error fetching emails:", error);
      toast.error("Failed to fetch emails");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!accountName || !emailAddress || !password || !imapHost || !smtpHost) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await axios.post(
        `${API}/email/accounts/add`,
        {
          name: accountName,
          email: emailAddress,
          password,
          protocol,
          imapHost,
          imapPort: parseInt(imapPort),
          smtpHost,
          smtpPort: parseInt(smtpPort),
        },
        { withCredentials: true }
      );

      toast.success("Email account added successfully!");
      closeAccountModal();
      resetAccountForm();
      fetchEmailAccounts();
    } catch (error) {
      console.error("Error adding email account:", error);
      toast.error(error.response?.data?.message || "Failed to add email account");
    }
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await axios.post(
        `${API}/email/send`,
        {
          accountId: selectedAccount,
          to: composeTo,
          subject: composeSubject,
          body: composeBody,
        },
        { withCredentials: true }
      );

      toast.success("Email sent successfully!");
      closeComposeModal();
      resetComposeForm();
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send email");
    }
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
    openEmailModal();
  };

  const handleMarkAsRead = async (email, e) => {
    e.stopPropagation(); // Prevent opening modal

    if (!email.uid) {
      toast.error("Cannot mark email as read - missing UID");
      return;
    }

    try {
      await axios.post(
        `${API}/email/mark-read/${selectedAccount}/${email.uid}`,
        {},
        { withCredentials: true }
      );

      // Update local state
      setEmails(emails.map(e =>
        e.uid === email.uid ? { ...e, isRead: true } : e
      ));

      toast.success("Marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error(error.response?.data?.message || "Failed to mark as read");
    }
  };

  const handleDeleteEmail = async (email, e) => {
    e.stopPropagation(); // Prevent opening modal

    if (!email.uid) {
      toast.error("Cannot delete email - missing UID");
      return;
    }

    try {
      await axios.delete(
        `${API}/email/delete/${selectedAccount}/${email.uid}`,
        { withCredentials: true }
      );

      // Remove from local state
      setEmails(emails.filter(e => e.uid !== email.uid));

      toast.success("Email deleted successfully");
    } catch (error) {
      console.error("Error deleting email:", error);
      toast.error(error.response?.data?.message || "Failed to delete email");
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccountId(account._id);
    setAccountName(account.name);
    setEmailAddress(account.email);
    setPassword(""); // Don't show password for security
    setProtocol(account.protocol);
    setImapHost(account.imapHost);
    setImapPort(account.imapPort.toString());
    setSmtpHost(account.smtpHost);
    setSmtpPort(account.smtpPort.toString());
    openEditAccountModal();
  };

  const handleUpdateAccount = async () => {
    if (!accountName || !emailAddress || !imapHost || !smtpHost) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const updateData = {
        name: accountName,
        email: emailAddress,
        protocol,
        imapHost,
        imapPort: parseInt(imapPort),
        smtpHost,
        smtpPort: parseInt(smtpPort),
      };

      // Only update password if provided
      if (password) {
        updateData.password = password;
      }

      await axios.put(
        `${API}/email/accounts/${editingAccountId}`,
        updateData,
        { withCredentials: true }
      );

      toast.success("Email account updated successfully!");
      closeEditAccountModal();
      resetAccountForm();
      setEditingAccountId(null);
      fetchEmailAccounts();
    } catch (error) {
      console.error("Error updating email account:", error);
      toast.error(error.response?.data?.message || "Failed to update email account");
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm("Are you sure you want to delete this email account?")) {
      return;
    }

    try {
      await axios.delete(`${API}/email/accounts/${accountId}`, { withCredentials: true });
      toast.success("Email account deleted successfully!");

      // Reset selected account if it was deleted
      if (selectedAccount === accountId) {
        setSelectedAccount("");
        setEmails([]);
      }

      fetchEmailAccounts();
    } catch (error) {
      console.error("Error deleting email account:", error);
      toast.error("Failed to delete email account");
    }
  };

  const resetAccountForm = () => {
    setAccountName("");
    setEmailAddress("");
    setPassword("");
    setProtocol("imap");
    setImapHost("");
    setImapPort("993");
    setSmtpHost("");
    setSmtpPort("465");
  };

  const resetComposeForm = () => {
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const protocolOptions = [
    { value: "imap", label: "IMAP" },
    { value: "pop3", label: "POP3" },
  ];

  return (
    <div>
      <PageMeta title="Email Inbox | DreamCRM" description="Manage your emails" />
      <PageBreadcrumb pageTitle="Email" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <ComponentCard title="Email Accounts">
            <div className="space-y-3">
              <Button
                onClick={openComposeModal}
                className="w-full"
                endIcon={<PlusIcon className="size-4" />}
              >
                Compose Email
              </Button>

              <Button
                onClick={openAccountModal}
                variant="outline"
                className="w-full"
                endIcon={<PlusIcon className="size-4" />}
              >
                Add Account
              </Button>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Accounts
                </h3>
                {emailAccounts.length === 0 ? (
                  <p className="text-xs text-gray-500">No accounts added</p>
                ) : (
                  <div className="space-y-2">
                    {emailAccounts.map((account) => (
                      <div
                        key={account._id}
                        className={`group w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedAccount === account._id
                            ? "bg-brand-500 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                          }`}
                      >
                        <div onClick={() => setSelectedAccount(account._id)} className="cursor-pointer">
                          <div className="font-medium truncate">{account.name}</div>
                          <div className="text-xs opacity-80 truncate">{account.email}</div>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleEditAccount(account)}
                            className={`flex-1 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${selectedAccount === account._id
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                              }`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account._id)}
                            className={`flex-1 px-2 py-1 text-xs rounded transition-colors cursor-pointer ${selectedAccount === account._id
                                ? "bg-red-500/80 hover:bg-red-600 text-white"
                                : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
                              }`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <ComponentCard
            title="Inbox"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={fetchEmails}
                disabled={!selectedAccount || loading}
                endIcon={<RefreshIcon className="size-4" />}
              >
                Refresh
              </Button>
            }
          >
            {!selectedAccount ? (
              <div className="text-center py-12 text-gray-500">
                <p>Please select or add an email account to view emails</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12 text-gray-500">
                <p>Loading emails...</p>
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No emails found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <div
                    key={email.uid || index}
                    onClick={() => handleEmailClick(email)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${!email.isRead
                        ? "border-brand-300 bg-brand-50/50 dark:bg-brand-900/10 dark:border-brand-700"
                        : "border-gray-200 dark:border-gray-700"
                      } hover:border-brand-500 hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {!email.isRead && (
                          <div className="w-2 h-2 bg-brand-500 rounded-full mt-2 flex-shrink-0"></div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className={`truncate ${!email.isRead
                              ? "font-bold text-gray-900 dark:text-white"
                              : "font-semibold text-gray-800 dark:text-white"
                            }`}>
                            {email.subject || "(No Subject)"}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">
                            From: {email.from}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {formatDate(email.date)}
                        </span>
                        <div className="flex gap-1">
                          {!email.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(email, e)}
                              className="px-2 py-1 text-xs bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors cursor-pointer"
                              title="Mark as read"
                            >
                              Mark Read
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteEmail(email, e)}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors cursor-pointer"
                            title="Delete email"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      {/* Add Email Account Modal */}
      <Modal isOpen={isAccountModalOpen} onClose={closeAccountModal} className="max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Add Email Account
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Work Email"
              />
            </div>
            <div>
              <Label htmlFor="protocol">Protocol *</Label>
              <Select
                options={protocolOptions}
                value={protocol}
                onChange={setProtocol}
                placeholder="Select Protocol"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emailAddress">Email Address *</Label>
              <Input
                id="emailAddress"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Incoming Mail Server ({protocol.toUpperCase()})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imapHost">Server Host *</Label>
                <Input
                  id="imapHost"
                  type="text"
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                  placeholder="imap.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="imapPort">Port *</Label>
                <Input
                  id="imapPort"
                  type="number"
                  value={imapPort}
                  onChange={(e) => setImapPort(e.target.value)}
                  placeholder="993"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Outgoing Mail Server (SMTP)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">Server Host *</Label>
                <Input
                  id="smtpHost"
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">Port *</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="465"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={closeAccountModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleAddAccount}>
              Add Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* Compose Email Modal */}
      <Modal isOpen={isComposeModalOpen} onClose={closeComposeModal} className="max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Compose Email
        </h2>

        <div className="space-y-4">
          <div>
            <Label htmlFor="composeTo">To *</Label>
            <Input
              id="composeTo"
              type="email"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="recipient@email.com"
            />
          </div>

          <div>
            <Label htmlFor="composeSubject">Subject *</Label>
            <Input
              id="composeSubject"
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="Email subject"
            />
          </div>

          <div>
            <Label htmlFor="composeBody">Message *</Label>
            <textarea
              id="composeBody"
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Type your message here..."
              rows={10}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={closeComposeModal}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSendEmail}>
              Send Email
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Email Account Modal */}
      <Modal isOpen={isEditAccountModalOpen} onClose={closeEditAccountModal} className="max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
          Edit Email Account
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editAccountName">Account Name *</Label>
              <Input
                id="editAccountName"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., Work Email"
              />
            </div>
            <div>
              <Label htmlFor="editProtocol">Protocol *</Label>
              <Select
                options={protocolOptions}
                value={protocol}
                onChange={setProtocol}
                placeholder="Select Protocol"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editEmailAddress">Email Address *</Label>
              <Input
                id="editEmailAddress"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <Label htmlFor="editPassword">Password (leave blank to keep current)</Label>
              <Input
                id="editPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Incoming Mail Server ({protocol.toUpperCase()})
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editImapHost">Server Host *</Label>
                <Input
                  id="editImapHost"
                  type="text"
                  value={imapHost}
                  onChange={(e) => setImapHost(e.target.value)}
                  placeholder="imap.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="editImapPort">Port *</Label>
                <Input
                  id="editImapPort"
                  type="number"
                  value={imapPort}
                  onChange={(e) => setImapPort(e.target.value)}
                  placeholder="993"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Outgoing Mail Server (SMTP)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editSmtpHost">Server Host *</Label>
                <Input
                  id="editSmtpHost"
                  type="text"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="editSmtpPort">Port *</Label>
                <Input
                  id="editSmtpPort"
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="465"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => { closeEditAccountModal(); resetAccountForm(); setEditingAccountId(null); }}>
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateAccount}>
              Update Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Email Modal */}
      <Modal isOpen={isEmailModalOpen} onClose={closeEmailModal} className="max-w-3xl p-6">
        {selectedEmail && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                {selectedEmail.subject || "(No Subject)"}
              </h2>
              <div className="mt-2 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <p>From: {selectedEmail.from}</p>
                <p>{formatDate(selectedEmail.date)}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {selectedEmail.body || selectedEmail.text || "(No content)"}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ToastContainer position="top-center" className="!z-[999999]" style={{ zIndex: 999999 }} />
    </div>
  );
}
