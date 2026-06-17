import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { Shield } from 'lucide-react'

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">CarAdmin</h1>
          <p className="text-muted mt-2">Admin Dashboard Sign In</p>
        </div>

        {/* Card */}
        <div className="bg-secondary border border-border rounded-lg p-8 shadow-xl">
          <AuthForm mode="sign-in" />
          
          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted text-center mb-3">Demo Credentials</p>
            <div className="bg-background/50 rounded p-3 space-y-1 text-xs">
              <p className="text-foreground"><span className="font-semibold">Email:</span> admin@admin.com</p>
              <p className="text-foreground"><span className="font-semibold">Password:</span> admincarrentadmin123456789</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted mt-6">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  )
}
