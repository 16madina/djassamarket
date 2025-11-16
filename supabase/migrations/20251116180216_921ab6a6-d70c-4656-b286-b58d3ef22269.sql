-- Create system_notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.system_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.system_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_system_notifications_user_id ON public.system_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_is_read ON public.system_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_system_notifications_created_at ON public.system_notifications(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_system_notifications_updated_at
  BEFORE UPDATE ON public.system_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();