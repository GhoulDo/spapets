import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-green-50 to-brown-50">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </main>
  )
}
