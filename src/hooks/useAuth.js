// Hook de autenticação - será implementado na task_04
export function useAuth() {
  return {
    user: null,
    session: null,
    signInWithGoogle: () => {},
    signOut: () => {},
    loading: false,
  }
}
