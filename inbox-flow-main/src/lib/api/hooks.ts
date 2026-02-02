import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    onSuccess: (_, { id }) => {
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
