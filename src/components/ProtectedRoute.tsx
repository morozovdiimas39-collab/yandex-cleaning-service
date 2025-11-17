interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Авторизация отключена - все страницы доступны
  return <>{children}</>;
}
