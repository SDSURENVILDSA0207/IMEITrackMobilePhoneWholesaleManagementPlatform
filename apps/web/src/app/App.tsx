import { AppRouter } from "@/app/router/AppRouter";
import { AuthBootstrap } from "@/features/auth/components/AuthBootstrap";

export default function App() {
  return (
    <>
      <AuthBootstrap />
      <AppRouter />
    </>
  );
}
