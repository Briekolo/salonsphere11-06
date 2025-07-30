-- Create notifications table for the notification system
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('appointment', 'client', 'payment', 'inventory', 'system', 'staff')),
    severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
    action_url TEXT,
    action_label TEXT,
    metadata JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_notifications_tenant_user ON public.notifications(tenant_id, user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read_status ON public.notifications(tenant_id, user_id, read_at) WHERE read_at IS NULL;

-- RLS policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications or tenant-wide notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        ))
    );

-- Users can update their own notifications (mark as read/dismissed)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND tenant_id IN (
            SELECT tenant_id FROM public.users WHERE id = auth.uid()
        ))
    );

-- System/admin can insert notifications
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();