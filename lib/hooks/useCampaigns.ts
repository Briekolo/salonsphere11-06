import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CampaignService, Campaign } from '@/lib/services/campaignService'
import { useToast } from '@/components/providers/ToastProvider'

export function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: () => CampaignService.getCampaigns(),
  })
}

export function useCampaign(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId],
    queryFn: () => CampaignService.getCampaign(campaignId),
    enabled: !!campaignId,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Campaign>) => CampaignService.createCampaign(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Campagne aangemaakt',
        description: 'De campagne is succesvol aangemaakt.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het aanmaken van de campagne.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => 
      CampaignService.updateCampaign(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.id] })
      toast({
        title: 'Campagne bijgewerkt',
        description: 'De campagne is succesvol bijgewerkt.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het bijwerken van de campagne.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CampaignService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Campagne verwijderd',
        description: 'De campagne is succesvol verwijderd.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het verwijderen van de campagne.',
        variant: 'destructive',
      })
    },
  })
}

export function useSendCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CampaignService.sendCampaign(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Campagne verzonden',
        description: `${data.queued} e-mails zijn in de wachtrij geplaatst voor verzending.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: error instanceof Error ? error.message : 'Er is een fout opgetreden bij het verzenden van de campagne.',
        variant: 'destructive',
      })
    },
  })
}

export function useScheduleCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: Date }) => 
      CampaignService.scheduleCampaign(id, scheduledAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Campagne ingepland',
        description: 'De campagne is succesvol ingepland.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het inplannen van de campagne.',
        variant: 'destructive',
      })
    },
  })
}

export function usePauseCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CampaignService.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Campagne gepauzeerd',
        description: 'De campagne is gepauzeerd.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het pauzeren van de campagne.',
        variant: 'destructive',
      })
    },
  })
}

export function useResumeCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CampaignService.resumeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Campagne hervat',
        description: 'De campagne wordt hervat.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het hervatten van de campagne.',
        variant: 'destructive',
      })
    },
  })
}

export function useCampaignAnalytics(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'analytics'],
    queryFn: () => CampaignService.getCampaignAnalytics(campaignId),
    enabled: !!campaignId,
  })
}

export function useCampaignRecipients(campaignId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'recipients', page, limit],
    queryFn: () => CampaignService.getCampaignRecipients(campaignId, page, limit),
    enabled: !!campaignId,
  })
}

export function useAddRecipients() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ campaignId, clientIds }: { campaignId: string; clientIds: string[] }) => 
      CampaignService.addRecipients(campaignId, clientIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId] })
      toast({
        title: 'Ontvangers toegevoegd',
        description: `${data.count} ontvangers zijn toegevoegd aan de campagne.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het toevoegen van ontvangers.',
        variant: 'destructive',
      })
    },
  })
}

export function useAddRecipientsFromSegment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ campaignId, segmentId }: { campaignId: string; segmentId: string }) => 
      CampaignService.addRecipientsFromSegment(campaignId, segmentId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId] })
      toast({
        title: 'Segment toegevoegd',
        description: `${data.count} ontvangers uit het segment zijn toegevoegd aan de campagne.`,
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het toevoegen van het segment.',
        variant: 'destructive',
      })
    },
  })
}

export function useTerminateCampaign() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => CampaignService.terminateCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      toast({
        title: 'Campagne beëindigd',
        description: 'De campagne is succesvol beëindigd en alle wachtende e-mails zijn verwijderd.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het beëindigen van de campagne.',
        variant: 'destructive',
      })
    },
  })
}