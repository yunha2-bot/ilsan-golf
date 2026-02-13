import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xs pt-8 text-center text-xs text-emerald-200/80">
          로딩 중…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
