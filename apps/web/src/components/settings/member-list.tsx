'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MoreHorizontal, Shield, UserMinus, XCircle, Loader2, UserPlus, Clock, Mail } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { InviteModal } from './invite-modal';
import { PageHeader } from '@/components/ui/page-header';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'founder' | 'manager' | 'member';
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: 'founder' | 'manager' | 'member';
  created_at: string;
}

export function MemberList() {
  const { currentUser } = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // Member ID
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Member/Invite ID being acted upon

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await fetch('/api/org/members');
      const data = await res.json();
      if (data.data) {
        setMembers(data.data.members);
        setInvites(data.data.invites);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole as any } : m));
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemoveMember(memberId: string) {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/org/members/${memberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        setConfirmDelete(null);
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    setActionLoading(inviteId);
    try {
      const res = await fetch(`/api/auth/invite/${inviteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
      }
    } catch (err) {
      console.error('Failed to revoke invite:', err);
    } finally {
      setActionLoading(null);
    }
  }

  const memberToDelete = members.find(m => m.id === confirmDelete);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Team Members"
        subtitle="Manage your team, invite new members, and control workspace access."
        action={
          <Button onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-8 p-6">
          {/* Members Table */}
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Member</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} size="md" />
                        <div>
                          <p className="font-medium">{member.name}</p>
                          {member.id === currentUser?.id && (
                            <span className="text-[10px] text-primary font-bold uppercase tracking-wider">You</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground-muted">{member.email}</TableCell>
                    <TableCell>
                      {member.role === 'founder' || member.id === currentUser?.id ? (
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={actionLoading === member.id}
                          className="bg-transparent text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 -ml-1 h-8 transition-colors hover:bg-surface-raised cursor-pointer"
                        >
                          <option value="manager">Manager</option>
                          <option value="member">Member</option>
                        </select>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground-muted">
                      {formatDate(member.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {member.role !== 'founder' && member.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-risk-hard opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setConfirmDelete(member.id)}
                          disabled={actionLoading === member.id}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pending Invites Section */}
          {invites.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground-muted flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Pending Invitations
              </h3>
              <div className="bg-surface-raised rounded-lg border border-border divide-y divide-border">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 px-6 group">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-border flex items-center justify-center text-foreground-muted border border-border border-dashed">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{invite.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="h-5 text-[10px] px-1.5 capitalize opacity-70">
                            {invite.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-foreground-muted hover:text-risk-hard transition-colors"
                        onClick={() => handleRevokeInvite(invite.id)}
                        disabled={actionLoading === invite.id}
                      >
                        {actionLoading === invite.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5 mr-2" />
                            Revoke
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          fetchData();
          // Optional: Show success toast
        }}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-surface rounded-xl border border-risk-hard-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-risk-hard">Remove Member?</h3>
            <p className="text-sm text-foreground-muted leading-relaxed">
              Remove <span className="font-semibold text-foreground">{memberToDelete.name}</span> from the organization? 
              They will lose access immediately.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="outline" 
                className="bg-risk-hard text-white hover:bg-risk-hard/90 border-transparent"
                onClick={() => handleRemoveMember(confirmDelete)}
                loading={actionLoading === confirmDelete}
              >
                Remove Member
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
