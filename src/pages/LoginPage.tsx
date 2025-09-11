import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabaseClient';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useCustomForm, setUseCustomForm] = useState(true); // Default al form OTP personalizzato
  const { signInWithOtp } = useAuth();

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await signInWithOtp(email);
      if (error) {
        setMessage(`Errore: ${error.message}`);
      } else {
        setMessage('Controlla la tua email per il link di login!');
      }
    } catch (error) {
      setMessage('Errore durante l\'invio dell\'email');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1b0e0e] mb-2">
            Salario Accessorio
          </h1>
          <p className="text-[#5f5252]">
            Accedi per gestire i fondi degli enti locali
          </p>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <Button
              variant={useCustomForm ? 'secondary' : 'primary'}
              onClick={() => setUseCustomForm(false)}
              className="mr-2"
              size="sm"
            >
              UI Supabase
            </Button>
            <Button
              variant={useCustomForm ? 'primary' : 'secondary'}
              onClick={() => setUseCustomForm(true)}
              size="sm"
            >
              Form Personalizzato
            </Button>
          </div>

          {useCustomForm ? (
            <div>
              <form onSubmit={handleCustomLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1b0e0e] mb-1">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tua.email@esempio.it"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Invio in corso...' : 'Invia Link di Login'}
                </Button>
              </form>
              {message && (
                <div className={`mt-4 p-3 rounded text-sm ${
                  message.includes('Errore') 
                    ? 'bg-red-50 text-red-600 border border-red-200' 
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          ) : (
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#1b0e0e',
                      brandAccent: '#5f5252',
                    },
                  },
                },
              }}
              theme="light"
              providers={[]}
              redirectTo={`${window.location.origin}/`}
              localization={{
                variables: {
                  sign_in: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Accedi',
                    loading_button_label: 'Accesso in corso...',
                    link_text: 'Hai già un account? Accedi'
                  },
                  sign_up: {
                    email_label: 'Email',
                    password_label: 'Password',
                    button_label: 'Registrati',
                    loading_button_label: 'Registrazione in corso...',
                    link_text: 'Non hai un account? Registrati'
                  },
                },
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};