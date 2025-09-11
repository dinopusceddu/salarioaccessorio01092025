// pages/AdminPage.tsx - Pagina di amministrazione per visualizzare tutti i dati utenti
import React, { useEffect, useState } from 'react';
import { DatabaseService, AdminEntryView, UserProfile } from '../services/database';
import { AdminRoute } from '../components/shared/AdminRoute';
import { Card } from '../components/shared/Card';
import { Button } from '../components/shared/Button';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { Select } from '../components/shared/Select';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AdminDashboard: React.FC = () => {
  const [entries, setEntries] = useState<AdminEntryView[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  
  // Stati per creazione utente
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('📊 AdminPage: loadData() called');
      setLoading(true);
      
      console.log('📊 AdminPage: Loading entries and users...');
      const [entriesData, usersData] = await Promise.all([
        DatabaseService.getAllEntries(),
        DatabaseService.getAllUsers()
      ]);
      
      console.log('📊 AdminPage: Data loaded:', {
        entriesCount: entriesData.length,
        usersCount: usersData.length,
        users: usersData
      });
      
      setEntries(entriesData);
      setUsers(usersData);
    } catch (error) {
      console.error('❌ AdminPage: Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (userId: string, newRole: 'user' | 'admin') => {
    const confirmMessage = newRole === 'admin' 
      ? 'Sei sicuro di voler promuovere questo utente ad amministratore?' 
      : 'Sei sicuro di voler retrocedere questo utente a ruolo normale?';
    
    const confirmed = window.confirm(confirmMessage);
    
    if (!confirmed) return;

    const success = await DatabaseService.updateUserRole(userId, newRole);
    if (success) {
      await loadData(); // Ricarica i dati
      alert('Ruolo aggiornato con successo!');
    } else {
      alert('Errore nell\'aggiornamento del ruolo');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createUserForm.email || !createUserForm.password) {
      alert('Email e password sono obbligatori');
      return;
    }

    setCreatingUser(true);
    
    try {
      const result = await DatabaseService.createUser(
        createUserForm.email,
        createUserForm.password,
        createUserForm.fullName || undefined
      );

      if (result.success) {
        alert('Utente creato con successo!');
        setCreateUserForm({ email: '', password: '', fullName: '' });
        setShowCreateUser(false);
        await loadData(); // Ricarica i dati
      } else {
        alert(`Errore nella creazione dell'utente: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Errore nella creazione dell\'utente');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      `Sei sicuro di voler eliminare l'utente ${userEmail}? Questa azione eliminerà anche tutti i suoi dati e non può essere annullata.`
    );
    
    if (!confirmed) return;

    const success = await DatabaseService.deleteUser(userId);
    if (success) {
      alert('Utente eliminato con successo!');
      await loadData(); // Ricarica i dati
    } else {
      alert('Errore nell\'eliminazione dell\'utente');
    }
  };

  // Filtri
  const filteredEntries = entries.filter(entry => {
    const userMatch = selectedUser === 'all' || entry.user_id === selectedUser;
    const yearMatch = selectedYear === 'all' || entry.year.toString() === selectedYear;
    return userMatch && yearMatch;
  });

  const availableYears = [...new Set(entries.map(entry => entry.year))].sort((a, b) => b - a);

  if (loading) {
    return <LoadingSpinner text="Caricamento dati amministrazione..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#1b0e0e]">
          Pannello di Amministrazione
        </h1>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowCreateUser(true)} 
            variant="primary"
          >
            + Crea Utente
          </Button>
          <Button onClick={loadData} variant="secondary">
            Aggiorna Dati
          </Button>
        </div>
      </div>

      {/* Statistiche Generali */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Utenti Totali">
          <div className="text-3xl font-bold text-[#ea2832]">{users.length}</div>
          <div className="text-sm text-[#994d51]">
            Admin: {users.filter(u => u.role === 'admin').length} | 
            User: {users.filter(u => u.role === 'user').length}
          </div>
        </Card>
        <Card title="Inserimenti Totali">
          <div className="text-3xl font-bold text-[#ea2832]">{entries.length}</div>
          <div className="text-sm text-[#994d51]">
            Anni: {availableYears.length}
          </div>
        </Card>
        <Card title="Ultimo Aggiornamento">
          <div className="text-sm font-medium text-[#1b0e0e]">
            {entries.length > 0 && entries[0]?.updated_at ? formatDate(entries[0].updated_at) : 'Nessun dato'}
          </div>
        </Card>
      </div>

      {/* Modale Creazione Utente */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-[#1b0e0e] mb-4">Crea Nuovo Utente</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={createUserForm.email}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#f3e7e8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea2832]"
                  placeholder="utente@example.com"
                  required
                  disabled={creatingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={createUserForm.password}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#f3e7e8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea2832]"
                  placeholder="Minimo 6 caratteri"
                  minLength={6}
                  required
                  disabled={creatingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={createUserForm.fullName}
                  onChange={(e) => setCreateUserForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#f3e7e8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#ea2832]"
                  placeholder="Mario Rossi"
                  disabled={creatingUser}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setShowCreateUser(false);
                    setCreateUserForm({ email: '', password: '', fullName: '' });
                  }}
                  variant="secondary"
                  disabled={creatingUser}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creazione...' : 'Crea Utente'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gestione Utenti */}
      <Card title="Gestione Utenti" isCollapsible>
        <div className="space-y-4">
          {users.map(user => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-4 bg-[#fcf8f8] rounded-lg border border-[#f3e7e8]"
            >
              <div className="flex-1">
                <div className="font-medium text-[#1b0e0e]">
                  {user.full_name || 'Nome non specificato'}
                </div>
                <div className="text-sm text-[#994d51]">{user.email}</div>
                <div className="text-xs text-[#994d51]">
                  Registrato: {formatDate(user.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.role.toUpperCase()}
                </span>
                <div className="flex gap-2">
                  {user.role !== 'admin' && (
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={() => handleRoleUpdate(user.id, 'admin')}
                    >
                      Promuovi Admin
                    </Button>
                  )}
                  {user.role !== 'user' && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => handleRoleUpdate(user.id, 'user')}
                    >
                      Rendi User
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleDeleteUser(user.id, user.email)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Elimina
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Filtri per i dati */}
      <Card title="Dati Inserimenti Utenti">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Filtra per utente"
            options={[
              { value: 'all', label: 'Tutti gli utenti' },
              ...users.map(user => ({
                value: user.id,
                label: `${user.full_name || user.email} (${user.role})`
              }))
            ]}
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          />
          <Select
            label="Filtra per anno"
            options={[
              { value: 'all', label: 'Tutti gli anni' },
              ...availableYears.map(year => ({
                value: year.toString(),
                label: year.toString()
              }))
            ]}
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          />
        </div>

        {/* Lista degli inserimenti */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-[#994d51]">
              Nessun inserimento trovato con i filtri selezionati
            </div>
          ) : (
            filteredEntries.map(entry => (
              <div 
                key={entry.id} 
                className="p-4 bg-[#fcf8f8] rounded-lg border border-[#f3e7e8]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-medium text-[#1b0e0e]">
                      {entry.profile.full_name || entry.profile.email}
                    </div>
                    <div className="text-sm text-[#994d51]">
                      Anno: {entry.year} | 
                      Creato: {formatDate(entry.created_at)} | 
                      Aggiornato: {formatDate(entry.updated_at)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-[#1b0e0e]">Ente</div>
                    <div className="text-[#994d51]">
                      {entry.data?.annualData?.denominazioneEnte || 'N/D'}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-[#1b0e0e]">Anno Riferimento</div>
                    <div className="text-[#994d51]">
                      {entry.data?.annualData?.annoRiferimento || entry.year}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-[#1b0e0e]">Dipendenti</div>
                    <div className="text-[#994d51]">
                      {entry.data?.annualData?.personaleServizioAttuale?.reduce((sum, p) => sum + (p.count || 0), 0) || 0}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-[#1b0e0e]">Anno Rif.</div>
                    <div className="text-[#994d51]">
                      {entry.data?.annualData?.annoRiferimento || entry.year}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export const AdminPage: React.FC = () => {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
};