import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useEffect } from 'react';
import {
  Email, Draft, Task, CalendarEvent, Job,
  EmailsQueryParams, CreateDraftRequest, CreateTaskRequest,
  UpdateTaskRequest, CreateEventRequest, EventsQueryParams, TasksQueryParams
} from '@/lib/types';
import { api } from './realAdapter';


// Query keys
export const queryKeys = {
  emails: (params?: EmailsQueryParams) => ['emails', params] as const,
  email: (id: string) => ['email', id] as const,
  drafts: (emailId: string) => ['drafts', emailId] as const,
  tasks: (params?: TasksQueryParams) => ['tasks', params] as const,
  events: (params: EventsQueryParams) => ['events', params] as const,
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

export function useMarkEmailRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => 
      api.markEmailRead(id, isRead),
    onMutate: async ({ id, isRead }) => {
      await queryClient.cancelQueries({ queryKey: ['emails'] });

      const previousEmail = queryClient.getQueryData(['email', id]);
      queryClient.setQueryData(['email', id], (old: any) =>
        old ? { ...old, isRead } : old,
      );

      queryClient.setQueriesData({ queryKey: ['emails'] }, (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((e: any) => (e.id === id ? { ...e, isRead } : e)),
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

// Task hooks
export function useTasks(params: TasksQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => api.getTasks(params),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateTaskRequest) => api.createTask(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateTaskRequest }) =>
      api.updateTask(id, request),
    onMutate: async ({ id, request }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks', {}]);
      
      // Optimistically update
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks', {}], 
          previousTasks.map(t => t.id === id ? { ...t, ...request } : t)
        );
      }
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', {}], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// Event hooks
export function useEvents(params: EventsQueryParams) {
  return useQuery({
    queryKey: queryKeys.events(params),
    queryFn: () => api.getEvents(params),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateEventRequest) => api.createEvent(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, request }: { id: string; request: Partial<CreateEventRequest> }) =>
      api.updateEvent(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
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

// Extract dates hook
export function useExtractDates() {
  return useMutation({
    mutationFn: (emailId: string) => api.extractDates(emailId),
  });
}

// Auto-classify: fires once when emails load, classifies any without a category
export function useAutoClassify(emails: Email[] | undefined) {
  const queryClient = useQueryClient();
  const sentRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!emails?.length) return;

    const unclassified = emails
      .filter((e) => !e.category && !sentRef.current.has(e.id))
      .map((e) => e.id);

    if (!unclassified.length) return;

    // Mark as sent so we don't re-fire
    unclassified.forEach((id) => sentRef.current.add(id));

    api.classifyBatch(unclassified).then(({ jobIds }) => {
      if (!jobIds.length) return;

      // Poll the last job as a proxy for batch completion, then refresh
      const lastJobId = jobIds[jobIds.length - 1];
      const poll = setInterval(async () => {
        try {
          const job = await api.getJob(lastJobId);
          if (job.status === 'done' || job.status === 'failed') {
            clearInterval(poll);
            queryClient.invalidateQueries({ queryKey: ['emails'] });
          }
        } catch {
          clearInterval(poll);
        }
      }, 1500);
    }).catch(() => {
      // Silently fail — classification is best-effort
    });
  }, [emails, queryClient]);
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
