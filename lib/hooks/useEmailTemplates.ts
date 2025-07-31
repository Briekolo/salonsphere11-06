import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmailTemplateService, EmailTemplate } from '@/lib/services/emailTemplateService'
import { useToast } from '@/components/providers/ToastProvider'

export function useEmailTemplates(category?: string) {
  return useQuery({
    queryKey: ['emailTemplates', category],
    queryFn: () => EmailTemplateService.getTemplates(undefined, category),
  })
}

export function useEmailTemplate(templateId: string) {
  return useQuery({
    queryKey: ['emailTemplates', templateId],
    queryFn: () => EmailTemplateService.getTemplate(templateId),
    enabled: !!templateId,
  })
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<EmailTemplate>) => EmailTemplateService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
      toast({
        title: 'Sjabloon aangemaakt',
        description: 'Het e-mailsjabloon is succesvol aangemaakt.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het aanmaken van het sjabloon.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EmailTemplate> }) => 
      EmailTemplateService.updateTemplate(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['emailTemplates', variables.id] })
      toast({
        title: 'Sjabloon bijgewerkt',
        description: 'Het e-mailsjabloon is succesvol bijgewerkt.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het bijwerken van het sjabloon.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => EmailTemplateService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
      toast({
        title: 'Sjabloon verwijderd',
        description: 'Het e-mailsjabloon is succesvol verwijderd.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het verwijderen van het sjabloon.',
        variant: 'destructive',
      })
    },
  })
}

export function useDuplicateEmailTemplate() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      EmailTemplateService.duplicateTemplate(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailTemplates'] })
      toast({
        title: 'Sjabloon gedupliceerd',
        description: 'Het e-mailsjabloon is succesvol gedupliceerd.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het dupliceren van het sjabloon.',
        variant: 'destructive',
      })
    },
  })
}

export function useTemplateCategories() {
  return EmailTemplateService.getCategories()
}