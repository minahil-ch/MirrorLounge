import { useAuth } from '../contexts/AuthContext';
import { User } from 'firebase/auth';

interface ChatAuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export const useChatAuth = (): ChatAuthState => {
  const { user, loading } = useAuth();
  
  return {
    user,
    isLoading: loading,
    error: null
  };
};