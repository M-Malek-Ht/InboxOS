import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import {
  Email,
  EmailsQueryParams, CreateDraftRequest,
} from '@/lib/types';
import { api } from './realAdapter';

type EmailListData = { data: Email[]; total: number };


// Query keys
export const queryKeys = {
  emails: (params?: EmailsQueryParams) => ['emails', params] as const,
  email: (id: string) => ['email', id] as const,
  drafts: (emailId: string) => ['drafts', emailId] as const,
  job: (jobId: string) => ['job', jobId] as const,
};

// Email hooks
export function useEmails(params: EmailsQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.emails(params),
    queryFn: () => api.getEmails(params),
  });
}

export function useEmail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.email(id!),
    queryFn: () => api.getEmail(id!),
    enabled: !!id,
  });
}

export function useThread(emailId: string | null) {
  return useQuery({
    queryKey: ['thread', emailId] as const,
    queryFn: () => api.getThread(emailId!),
    enabled: !!emailId,
  });
}

export function useMarkEmailRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => 
      api.markEmailRead(id, isRead),
    onMutate: async ({ id, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ['emails'] });

      const previousEmail = queryClient.getQueryData<Email>(['email', id]);
      queryClient.setQueryData<Email>(['email', id], (old) =>
        old ? { ...old, isRead } : old,
      );

      queryClient.setQueriesData<EmailListData>({ queryKey: ['emails'] }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((email) => (email.id === id ? { ...email, isRead } : email)),
        };
      });

      return { previousEmail };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousEmail) {
        queryClient.setQueryData(['email', id], context.previousEmail);
      }
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.email(id) });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}

export function useClassifyEmail() {
  return useMutation({
    mutationFn: (emailId: string) => api.classifyEmail(emailId),
  });
}

export function useUpdateEmailPriority() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, priorityScore }: { id: string; priorityScore: number }) =>
      api.updateEmailPriority(id, priorityScore),
    onMutate: async ({ id, priorityScore }) => {
      const normalizedScore = Math.max(0, Math.min(100, Math.round(priorityScore)));

      await queryClient.cancelQueries({ queryKey: ['emails'] });
      await queryClient.cancelQueries({ queryKey: ['email', id] });

      const previousEmail = queryClient.getQueryData<Email>(['email', id]);
      queryClient.setQueryData<Email>(['email', id], (old) =>
        old ? { ...old, priorityScore: normalizedScore } : old,
      );

      queryClient.setQueriesData<EmailListData>({ queryKey: ['emails'] }, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((email) =>
            email.id === id ? { ...email, priorityScore: normalizedScore } : email,
          ),
        };
      });

      return { previousEmail };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousEmail) {
        queryClient.setQueryData(['email', id], context.previousEmail);
      }
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
    onSuccess: (updatedEmail, { id }) => {
      queryClient.setQueryData(['email', id], updatedEmail);
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.email(id) });
    },
  });
}

export function useSendReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ emailId, body, draftId }: { emailId: string; body: string; draftId?: string }) =>
      api.sendReply(emailId, body, draftId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['sent-emails'] });
      queryClient.invalidateQueries({ queryKey: ['thread'] });
    },
  });
}

export function useDeleteEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emailId: string) => api.deleteEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['trash-emails'] });
      queryClient.invalidateQueries({ queryKey: ['sent-emails'] });
    },
  });
}

// Draft hooks
export function useDrafts(emailId: string | null) {
  return useQuery({
    queryKey: queryKeys.drafts(emailId!),
    queryFn: () => api.getDrafts(emailId!),
    enabled: !!emailId,
  });
}

export function useGenerateDraft() {
  return useMutation({
    mutationFn: ({ emailId, request }: { emailId: string; request: CreateDraftRequest }) =>
      api.generateDraft(emailId, request),
  });
}

// Job polling hook
export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: queryKeys.job(jobId!),
    queryFn: () => api.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data;
      // Stop polling when job is done or failed
      if (job?.status === 'done' || job?.status === 'failed') {
        return false;
      }
      return 500; // Poll every 500ms while processing
    },
  });
}

// Sent emails
export function useSentEmails(params: { search?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ['sent-emails', params] as const,
    queryFn: () => api.getSentEmails(params),
  });
}

// Trash emails
export function useTrashEmails(params: { search?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ['trash-emails', params] as const,
    queryFn: () => api.getTrashEmails(params),
  });
}

// Untrash (restore from trash)
export function useUntrashEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emailId: string) => api.untrashEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-emails'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
    },
  });
}

// Permanently delete from trash
export function usePermanentlyDeleteEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emailId: string) => api.permanentlyDeleteEmail(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-emails'] });
    },
  });
}

// Auto-classify: fires once when emails load, classifies any without a category
export function useAutoClassify(emails: Email[] | undefined) {
  const queryClient = useQueryClient();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!emails?.length || firedRef.current) return;

    const unclassified = emails
      .filter((e) => !e.category)
      .map((e) => e.id);

    if (!unclassified.length) return;

    // Only fire once per mount
    firedRef.current = true;

    let poll: ReturnType<typeof setInterval> | undefined;

    api.classifyBatch(unclassified).then(({ jobId }) => {
      if (!jobId) return;

      // Poll the single batch job; refresh periodically as emails get classified
      poll = setInterval(async () => {
        try {
          const job = await api.getJob(jobId);
          // Refresh on every poll so the UI updates progressively
          queryClient.invalidateQueries({ queryKey: ['emails'] });

          if (job.status === 'done' || job.status === 'failed') {
            clearInterval(poll);
          }
        } catch {
          clearInterval(poll);
        }
      }, 3000);
    }).catch(() => {
      // Silently fail — classification is best-effort
    });

    return () => {
      if (poll) clearInterval(poll);
    };
  }, [emails, queryClient]);
}

// Settings hooks
export function useSettings() {
  return useQuery({
    queryKey: ['settings'] as const,
    queryFn: () => api.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: { defaultTone?: string; defaultLength?: string }) =>
      api.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// All drafts (latest per email)
export function useAllDrafts() {
  return useQuery({
    queryKey: ['allDrafts'] as const,
    queryFn: () => api.getAllDrafts(),
  });
}

// Reset demo data
export function useResetDemoData() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.resetDemoData(),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
