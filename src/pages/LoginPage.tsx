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
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useCustomForm, setUseCustomForm] = useState(true); // Default al form email/password personalizzato
  const { signInWithPassword } = useAuth();

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Email e password sono obbligatori');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setMessage('Email o password non corretti');
        } else {
          setMessage(`Errore: ${error.message}`);
        }
      } else {
        setMessage('Login effettuato con successo!');
      }
    } catch (error) {
      setMessage('Errore durante il login');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/attached_assets/LOGO_FP_1758267371308.jpg" 
              alt="FP CGIL Lombardia" 
              className="h-24 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-[#1b0e0e] mb-2">
            Salario Accessorio
          </h1>
          <p className="text-[#5f5252]">
            Accedi per gestire i fondi degli enti locali
          </p>
        </div>

        <Card className="p-6">
          <div className="mb-4 text-center">
            <h2 className="text-xl font-semibold text-[#1b0e0e]">
              Accesso Riservato
            </h2>
            <p className="text-sm text-[#994d51] mt-1">
              Solo gli amministratori possono accedere al sistema
            </p>
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
                    placeholder="admin@example.com"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#1b0e0e] mb-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Inserisci la password"
                    required
                    disabled={loading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || !email || !password}
                >
                  {loading ? 'Accesso in corso...' : 'Accedi'}
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
            <div className="text-center py-6">
              <div className="text-[#994d51] mb-4">
                <p>La registrazione automatica è disabilitata.</p>
                <p className="text-sm mt-2">Contatta l'amministratore per ottenere un account.</p>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => setUseCustomForm(true)}
                size="sm"
              >
                Torna al Login
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};