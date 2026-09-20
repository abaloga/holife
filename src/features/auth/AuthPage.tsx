import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, useReducedMotion } from 'motion/react';
import { MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Wordmark } from '@/components/common/wordmark';
import { toast } from '@/components/ui/toaster';
import { transitions } from '@/lib/motion';
import { toUserMessage } from '@/lib/errors';
import { useAuth } from './auth-context';
import { sendPasswordReset, signIn, signUp } from './api';
import { signInSchema, signUpSchema, type SignInValues, type SignUpValues } from './schema';

type Mode = 'sign-in' | 'sign-up';

export function AuthPage() {
  const { user, initialising } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  if (initialising) return <AuthShell>{null}</AuthShell>;
  if (user) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }

  if (awaitingConfirmation) {
    return (
      <AuthShell>
        <div className="space-y-4 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent-subtle text-accent">
            <MailCheck className="size-5" aria-hidden />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{awaitingConfirmation}</span>. Open it
              to finish setting up your account.
            </p>
          </div>
          <Button
            variant="subtle"
            block
            onClick={() => {
              setAwaitingConfirmation(null);
              setMode('sign-in');
            }}
          >
            Back to sign in
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <motion.div
        key={mode}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitions.soft}
      >
        {mode === 'sign-in' ? (
          <SignInForm onSwitch={() => setMode('sign-up')} />
        ) : (
          <SignUpForm
            onSwitch={() => setMode('sign-in')}
            onNeedsConfirmation={setAwaitingConfirmation}
          />
        )}
      </motion.div>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-6 py-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Wordmark size="lg" />
            <p className="mt-2 text-sm text-muted-foreground">
              A small collection of apps for your life, in one calm place.
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function SignInForm({ onSwitch }: { onSwitch: () => void }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      await signIn(values);
    } catch (cause) {
      setFormError(toUserMessage(cause));
    }
  });

  const handleReset = async () => {
    const email = form.getValues('email').trim();
    if (!email) {
      setFormError('Enter your email address first, then tap reset.');
      return;
    }
    setResetting(true);
    try {
      await sendPasswordReset(email);
      toast.success('Password reset email sent');
    } catch (cause) {
      setFormError(toUserMessage(cause));
    } finally {
      setResetting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="sign-in-email" error={form.formState.errors.email?.message}>
        <Input
          id="sign-in-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          enterKeyHint="next"
          placeholder="you@example.com"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register('email')}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="sign-in-password"
        error={form.formState.errors.password?.message ?? formError ?? undefined}
      >
        <Input
          id="sign-in-password"
          type="password"
          autoComplete="current-password"
          enterKeyHint="go"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register('password')}
        />
      </Field>

      <Button type="submit" block loading={form.formState.isSubmitting}>
        Sign in
      </Button>

      <div className="flex items-center justify-between pt-1 text-[0.8125rem]">
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create an account
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-60"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );
}

function SignUpForm({
  onSwitch,
  onNeedsConfirmation,
}: {
  onSwitch: () => void;
  onNeedsConfirmation: (email: string) => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await signUp(values);
      if (result.needsEmailConfirmation) onNeedsConfirmation(values.email);
    } catch (cause) {
      setFormError(toUserMessage(cause));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        label="Name"
        htmlFor="sign-up-name"
        error={form.formState.errors.displayName?.message}
      >
        <Input
          id="sign-up-name"
          autoComplete="name"
          enterKeyHint="next"
          placeholder="Alex"
          aria-invalid={Boolean(form.formState.errors.displayName)}
          {...form.register('displayName')}
        />
      </Field>

      <Field label="Email" htmlFor="sign-up-email" error={form.formState.errors.email?.message}>
        <Input
          id="sign-up-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          enterKeyHint="next"
          placeholder="you@example.com"
          aria-invalid={Boolean(form.formState.errors.email)}
          {...form.register('email')}
        />
      </Field>

      <Field
        label="Password"
        htmlFor="sign-up-password"
        hint="At least 8 characters."
        error={form.formState.errors.password?.message ?? formError ?? undefined}
      >
        <Input
          id="sign-up-password"
          type="password"
          autoComplete="new-password"
          enterKeyHint="go"
          aria-invalid={Boolean(form.formState.errors.password)}
          {...form.register('password')}
        />
      </Field>

      <Button type="submit" block loading={form.formState.isSubmitting}>
        Create account
      </Button>

      <p className="pt-1 text-center text-[0.8125rem] text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
