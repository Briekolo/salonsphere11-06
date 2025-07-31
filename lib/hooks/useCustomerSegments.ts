import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SegmentService, CustomerSegment, SegmentCriteria } from '@/lib/services/segmentService'
import { useToast } from '@/components/providers/ToastProvider'

export function useCustomerSegments() {
  return useQuery({
    queryKey: ['customerSegments'],
    queryFn: () => SegmentService.getSegments(),
  })
}

export function useCustomerSegment(segmentId: string) {
  return useQuery({
    queryKey: ['customerSegments', segmentId],
    queryFn: () => SegmentService.getSegment(segmentId),
    enabled: !!segmentId,
  })
}

export function useCreateCustomerSegment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<CustomerSegment>) => SegmentService.createSegment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSegments'] })
      toast({
        title: 'Segment aangemaakt',
        description: 'Het klantsegment is succesvol aangemaakt.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het aanmaken van het segment.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateCustomerSegment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerSegment> }) => 
      SegmentService.updateSegment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customerSegments'] })
      queryClient.invalidateQueries({ queryKey: ['customerSegments', variables.id] })
      toast({
        title: 'Segment bijgewerkt',
        description: 'Het klantsegment is succesvol bijgewerkt.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het bijwerken van het segment.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteCustomerSegment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => SegmentService.deleteSegment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSegments'] })
      toast({
        title: 'Segment verwijderd',
        description: 'Het klantsegment is succesvol verwijderd.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het verwijderen van het segment.',
        variant: 'destructive',
      })
    },
  })
}

export function useCalculateSegmentMembers() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (segmentId: string) => SegmentService.calculateSegmentMembers(segmentId),
    onSuccess: (_, segmentId) => {
      queryClient.invalidateQueries({ queryKey: ['customerSegments', segmentId] })
      toast({
        title: 'Segment bijgewerkt',
        description: 'De segmentleden zijn opnieuw berekend.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het berekenen van segmentleden.',
        variant: 'destructive',
      })
    },
  })
}

export function useSegmentMembers(segmentId: string, page = 1, limit = 50) {
  return useQuery({
    queryKey: ['customerSegments', segmentId, 'members', page, limit],
    queryFn: () => SegmentService.getSegmentMembers(segmentId, page, limit),
    enabled: !!segmentId,
  })
}

export function useDuplicateSegment() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) => 
      SegmentService.duplicateSegment(id, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerSegments'] })
      toast({
        title: 'Segment gedupliceerd',
        description: 'Het klantsegment is succesvol gedupliceerd.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het dupliceren van het segment.',
        variant: 'destructive',
      })
    },
  })
}

export function useTestSegmentCriteria() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (criteria: SegmentCriteria[]) => SegmentService.testSegmentCriteria(criteria),
    onError: (error) => {
      toast({
        title: 'Fout',
        description: 'Er is een fout opgetreden bij het testen van de criteria.',
        variant: 'destructive',
      })
    },
  })
}

export function usePredefinedSegments() {
  return SegmentService.getPredefinedSegments()
}

export function useSegmentFields() {
  return SegmentService.getAvailableFields()
}

export function useSegmentOperators(fieldType: string) {
  return SegmentService.getOperatorsForField(fieldType)
}