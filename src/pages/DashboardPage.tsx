import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DatabaseService, Entity, UserProfile } from '../services/database';
import { INITIAL_ANNUAL_DATA, INITIAL_HISTORICAL_DATA } from '../constants';

interface DashboardPageProps {
  onEntityYearSelected: (entityId: string, year: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onEntityYearSelected }) => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityYears, setEntityYears] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showNewEntityForm, setShowNewEntityForm] = useState(false);
  const [showNewYearForm, setShowNewYearForm] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  const [newEntityData, setNewEntityData] = useState({
    name: '',
    tipologia: 'comune',
    altroTipologia: '',
    numeroAbitanti: 0
  });
  const [newYear, setNewYear] = useState(new Date().getFullYear());

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Stati per nuove funzionalità admin
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string } | null>(null);
  const [expandedUserEntities, setExpandedUserEntities] = useState<Record<string, any>>({});
  const [loadingEntities, setLoadingEntities] = useState<string | null>(null);

  // Stati per gestione enti e anni
  const [entityToDelete, setEntityToDelete] = useState<{ id: string; name: string } | null>(null);
  const [yearToDelete, setYearToDelete] = useState<{ entityId: string; entityName: string; year: number } | null>(null);
  const [yearToDuplicate, setYearToDuplicate] = useState<{ entityId: string; entityName: string; fromYear: number } | null>(null);
  const [duplicateToYear, setDuplicateToYear] = useState<number>(new Date().getFullYear() + 1);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id, isAdmin]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log(`📊 Dashboard: Loading data for ${isAdmin() ? 'admin' : 'user'}: ${user.email}`);
      
      const entitiesData = await DatabaseService.listEntities();
      console.log('📊 Dashboard: Loaded entities:', entitiesData.length);
      setEntities(entitiesData);

      const yearsData: Record<string, number[]> = {};
      for (const entity of entitiesData) {
        try {
          const years = await DatabaseService.getAvailableYears(entity.id);
          yearsData[entity.id] = years;
          console.log(`📊 Dashboard: Entity ${entity.name} has years:`, years);
        } catch (error) {
          console.error(`Error loading years for entity ${entity.id}:`, error);
          yearsData[entity.id] = [];
        }
      }
      setEntityYears(yearsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Errore nel caricamento dei dati. Riprova.');
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    if (!isAdmin()) return;
    
    setAdminLoading(true);
    try {
      const users = await DatabaseService.getAllUsers();
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      setAdminMessage({ type: 'error', text: 'Errore nel caricamento degli utenti' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      console.log('📊 Dashboard: Creating new entity:', newEntityData);
      
      const newEntity = await DatabaseService.createEntity({
        name: newEntityData.name,
        tipologia: newEntityData.tipologia,
        altro_tipologia: newEntityData.altroTipologia || undefined,
        numero_abitanti: newEntityData.numeroAbitanti
      });

      console.log('✅ Dashboard: Entity created:', newEntity);
      setShowNewEntityForm(false);
      setNewEntityData({ name: '', tipologia: 'comune', altroTipologia: '', numeroAbitanti: 0 });
      await loadDashboardData();
    } catch (error) {
      console.error('Error creating entity:', error);
      setError('Errore nella creazione dell\'entità. Riprova.');
    }
  };

  const handleCreateYear = async (entityId: string) => {
    try {
      console.log(`📊 Dashboard: Creating new year ${newYear} for entity ${entityId}`);
      
      const defaultFundData = {
        historicalData: INITIAL_HISTORICAL_DATA,
        annualData: {
          ...INITIAL_ANNUAL_DATA,
          annoRiferimento: newYear
        },
        fondoAccessorioDipendenteData: {},
        fondoElevateQualificazioniData: {},
        fondoSegretarioComunaleData: {},
        fondoDirigenzaData: {},
        distribuzioneRisorseData: {}
      };

      const success = await DatabaseService.upsertAnnualEntry(entityId, newYear, defaultFundData);
      
      if (success) {
        console.log(`✅ Dashboard: Year ${newYear} created for entity ${entityId}`);
        setShowNewYearForm(null);
        setNewYear(new Date().getFullYear());
        await loadDashboardData();
      } else {
        throw new Error('Failed to create year entry');
      }
    } catch (error) {
      console.error('Error creating year:', error);
      setError(`Errore nella creazione dell'anno ${newYear}. Riprova.`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin()) return;

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const result = await DatabaseService.createUser(
        newUserData.email,
        newUserData.password,
        newUserData.fullName
      );

      if (result.success) {
        setAdminMessage({ type: 'success', text: `Utente ${newUserData.email} creato con successo!` });
        setNewUserData({ email: '', password: '', fullName: '' });
        await loadAllUsers();
      } else {
        setAdminMessage({ type: 'error', text: result.error || 'Errore nella creazione dell\'utente' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setAdminMessage({ type: 'error', text: 'Errore nella creazione dell\'utente' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setAdminLoading(true);
    try {
      const result = await DatabaseService.deleteUser(userToDelete.id);
      if (result.success) {
        setAdminMessage({ type: 'success', text: 'Utente eliminato con successo' });
        await loadAllUsers();
      } else {
        setAdminMessage({ type: 'error', text: result.error || 'Errore durante l\'eliminazione' });
      }
    } catch (error) {
      setAdminMessage({ type: 'error', text: 'Errore durante l\'eliminazione dell\'utente' });
    } finally {
      setAdminLoading(false);
      setUserToDelete(null);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return;
    
    setAdminLoading(true);
    try {
      const result = await DatabaseService.resetUserPassword(selectedUserId, newPassword);
      if (result.success) {
        setAdminMessage({ type: 'success', text: 'Password aggiornata con successo' });
        setShowPasswordReset(false);
        setNewPassword('');
        setSelectedUserId(null);
      } else {
        setAdminMessage({ type: 'error', text: result.error || 'Errore durante il reset della password' });
      }
    } catch (error) {
      setAdminMessage({ type: 'error', text: 'Errore durante il reset della password' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleLoadUserEntities = async (userId: string) => {
    if (expandedUserEntities?.[userId]) {
      // Collapse
      setExpandedUserEntities({ ...expandedUserEntities, [userId]: null });
      return;
    }
    
    setLoadingEntities(userId);
    try {
      const result = await DatabaseService.getUserEntities(userId);
      if (result.success) {
        setExpandedUserEntities({ ...expandedUserEntities, [userId]: result });
      } else {
        setAdminMessage({ type: 'error', text: result.error || 'Errore durante il caricamento degli enti' });
      }
    } catch (error) {
      setAdminMessage({ type: 'error', text: 'Errore durante il caricamento degli enti' });
    } finally {
      setLoadingEntities(null);
    }
  };

  const handleRoleUpdate = async (userId: string, userEmail: string, newRole: 'user' | 'admin') => {
    const confirmMessage = newRole === 'admin' 
      ? `Sei sicuro di voler promuovere ${userEmail} ad amministratore?` 
      : `Sei sicuro di voler retrocedere ${userEmail} a ruolo normale?`;
    
    if (!window.confirm(confirmMessage)) return;

    setAdminLoading(true);
    try {
      const success = await DatabaseService.updateUserRole(userId, newRole);
      if (success) {
        setAdminMessage({ type: 'success', text: `Ruolo aggiornato con successo per ${userEmail}!` });
        await loadAllUsers();
      } else {
        setAdminMessage({ type: 'error', text: 'Errore nell\'aggiornamento del ruolo' });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      setAdminMessage({ type: 'error', text: 'Errore nell\'aggiornamento del ruolo' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteEntity = async () => {
    if (!entityToDelete) return;

    setLoading(true);
    try {
      const result = await DatabaseService.deleteEntity(entityToDelete.id);
      if (result.success) {
        setError(null);
        await loadDashboardData();
      } else {
        setError(result.error || 'Errore durante l\'eliminazione dell\'ente');
      }
    } catch (error) {
      console.error('Error deleting entity:', error);
      setError('Errore durante l\'eliminazione dell\'ente');
    } finally {
      setLoading(false);
      setEntityToDelete(null);
    }
  };

  const handleDeleteYear = async () => {
    if (!yearToDelete) return;

    setLoading(true);
    try {
      const success = await DatabaseService.deleteAnnualEntry(yearToDelete.entityId, yearToDelete.year);
      if (success) {
        setError(null);
        await loadDashboardData();
      } else {
        setError('Errore durante l\'eliminazione dell\'anno');
      }
    } catch (error) {
      console.error('Error deleting year:', error);
      setError('Errore durante l\'eliminazione dell\'anno');
    } finally {
      setLoading(false);
      setYearToDelete(null);
    }
  };

  const handleDuplicateYear = async () => {
    if (!yearToDuplicate) return;

    setLoading(true);
    try {
      const result = await DatabaseService.duplicateYear(
        yearToDuplicate.entityId,
        yearToDuplicate.fromYear,
        duplicateToYear
      );
      
      if (result.success) {
        setError(null);
        await loadDashboardData();
      } else {
        setError(result.error || 'Errore durante la duplicazione dell\'anno');
      }
    } catch (error) {
      console.error('Error duplicating year:', error);
      setError('Errore durante la duplicazione dell\'anno');
    } finally {
      setLoading(false);
      setYearToDuplicate(null);
      setDuplicateToYear(new Date().getFullYear() + 1);
    }
  };

  const handleToggleAdminPanel = async () => {
    if (!showAdminPanel && isAdmin()) {
      await loadAllUsers();
    }
    setShowAdminPanel(!showAdminPanel);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#994d51] mx-auto mb-4"></div>
          <p className="text-[#5f5252]">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf8f8] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con Logo */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-[#994d51]/10">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <img 
                src="/attached_assets/LOGO_FP_1758267371308.jpg" 
                alt="FP CGIL Lombardia" 
                className="h-16 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-[#1b0e0e]">
                  Dashboard Salario Accessorio
                </h1>
                <p className="text-[#5f5252] mt-1">
                  Benvenuto/a, {profile?.full_name || user?.email}
                  {isAdmin() && <span className="ml-2 px-2 py-1 bg-[#994d51] text-white text-xs rounded-full">Admin</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isAdmin() && (
                <button
                  onClick={handleToggleAdminPanel}
                  className="bg-[#1b0e0e] hover:bg-[#1b0e0e]/90 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  {showAdminPanel ? '← Torna alle Entità' : '👤 Amministrazione'}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="bg-[#994d51] hover:bg-[#994d51]/90 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
            >
              Chiudi
            </button>
          </div>
        )}

        {/* Pannello Amministrazione */}
        {showAdminPanel && isAdmin() ? (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-[#994d51]/10">
              <h2 className="text-xl font-bold text-[#1b0e0e] mb-6">Gestione Utenti</h2>

              {adminMessage && (
                <div className={`p-4 rounded-md mb-6 ${
                  adminMessage.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {adminMessage.text}
                </div>
              )}

              {/* Form Creazione Utente */}
              <form onSubmit={handleCreateUser} className="mb-8">
                <h3 className="text-lg font-semibold text-[#1b0e0e] mb-4">Crea Nuovo Utente</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                      placeholder="utente@esempio.it"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                      placeholder="Minimo 6 caratteri"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={newUserData.fullName}
                      onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                      placeholder="Nome e Cognome"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="mt-4 bg-[#994d51] hover:bg-[#994d51]/90 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                >
                  {adminLoading ? 'Creazione...' : 'Crea Utente'}
                </button>
              </form>

              {/* Lista Utenti */}
              <div>
                <h3 className="text-lg font-semibold text-[#1b0e0e] mb-4">Utenti Registrati</h3>
                {adminLoading && allUsers.length === 0 ? (
                  <p className="text-[#5f5252] text-sm">Caricamento utenti...</p>
                ) : allUsers.length === 0 ? (
                  <p className="text-[#5f5252] text-sm">Nessun utente trovato</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-[#fcf8f8]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#1b0e0e] uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#1b0e0e] uppercase tracking-wider">Nome</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#1b0e0e] uppercase tracking-wider">Ruolo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#1b0e0e] uppercase tracking-wider">Creato</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#1b0e0e] uppercase tracking-wider">Azioni</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {allUsers.map((userItem) => (
                          <React.Fragment key={userItem.id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-[#1b0e0e]">{userItem.email}</td>
                              <td className="px-4 py-3 text-sm text-[#5f5252]">{userItem.full_name || '-'}</td>
                              <td className="px-4 py-3 text-sm">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  userItem.role === 'admin' 
                                    ? 'bg-[#994d51] text-white' 
                                    : 'bg-gray-200 text-gray-700'
                                }`}>
                                  {userItem.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-[#5f5252]">
                                {new Date(userItem.created_at).toLocaleDateString('it-IT')}
                              </td>
                              <td className="px-4 py-3 text-sm space-x-2">
                                <button
                                  onClick={() => handleLoadUserEntities(userItem.id)}
                                  disabled={loadingEntities === userItem.id}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:opacity-50"
                                  title="Visualizza enti e anni"
                                >
                                  {loadingEntities === userItem.id ? 'Caricamento...' : 
                                   expandedUserEntities?.[userItem.id] ? '▲ Nascondi Enti' : '▼ Mostra Enti'}
                                </button>
                                {userItem.role !== 'admin' ? (
                                  <button
                                    onClick={() => handleRoleUpdate(userItem.id, userItem.email, 'admin')}
                                    disabled={adminLoading}
                                    className="text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                                    title="Promuovi ad amministratore"
                                  >
                                    ⬆️ Rendi Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleRoleUpdate(userItem.id, userItem.email, 'user')}
                                    disabled={adminLoading || userItem.id === user?.id}
                                    className="text-orange-600 hover:text-orange-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={userItem.id === user?.id ? 'Non puoi retrocedere te stesso' : 'Retrocedi a utente normale'}
                                  >
                                    ⬇️ Rendi User
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedUserId(userItem.id);
                                    setShowPasswordReset(true);
                                  }}
                                  className="text-[#994d51] hover:text-[#994d51]/80 text-xs font-medium"
                                  title="Resetta password"
                                >
                                  🔑 Reset Password
                                </button>
                                <button
                                  onClick={() => setUserToDelete({ id: userItem.id, email: userItem.email })}
                                  disabled={userItem.id === user?.id}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={userItem.id === user?.id ? 'Non puoi eliminare te stesso' : 'Elimina utente'}
                                >
                                  🗑️ Elimina
                                </button>
                              </td>
                            </tr>
                            {/* Riga espansa con enti e anni */}
                            {expandedUserEntities?.[userItem.id] && (
                              <tr>
                                <td colSpan={5} className="px-4 py-4 bg-gray-50">
                                  <div className="pl-8">
                                    <h4 className="font-semibold text-[#1b0e0e] mb-2">
                                      Enti e Anni dell'utente
                                    </h4>
                                    {expandedUserEntities[userItem.id].entities && expandedUserEntities[userItem.id].entities.length > 0 ? (
                                      <div className="space-y-2">
                                        <p className="text-sm text-[#5f5252] mb-2">
                                          <strong>Totale:</strong> {expandedUserEntities[userItem.id].totalEntities} enti, {expandedUserEntities[userItem.id].totalYears} anni
                                        </p>
                                        {expandedUserEntities[userItem.id].entities.map((entity: any) => (
                                          <div key={entity.id} className="bg-white p-3 rounded border border-gray-200">
                                            <div className="font-medium text-[#1b0e0e]">{entity.name}</div>
                                            <div className="text-xs text-[#5f5252] mt-1">
                                              Tipologia: {entity.tipologia || 'N/D'}
                                              {entity.numero_abitanti && ` • Abitanti: ${entity.numero_abitanti.toLocaleString()}`}
                                            </div>
                                            {entity.years && entity.years.length > 0 ? (
                                              <div className="mt-2">
                                                <span className="text-xs font-medium text-[#5f5252]">Anni: </span>
                                                <span className="text-xs text-[#994d51]">
                                                  {entity.years.join(', ')}
                                                </span>
                                              </div>
                                            ) : (
                                              <div className="text-xs text-gray-400 mt-2 italic">Nessun anno configurato</div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500 italic">Nessun ente trovato per questo utente</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Pulsante Nuova Entità */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setShowNewEntityForm(true)}
                className="bg-[#994d51] hover:bg-[#994d51]/90 text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                + Nuova Entità
              </button>
            </div>

            {/* Entità List */}
            <div className="space-y-6">
              {entities.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-[#994d51]/10">
                  <div className="text-[#994d51] mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-8 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-[#1b0e0e] mb-2">Nessuna entità trovata</h3>
                  <p className="text-[#5f5252] mb-4">
                    Inizia creando la tua prima amministrazione.
                  </p>
                  <button
                    onClick={() => setShowNewEntityForm(true)}
                    className="bg-[#994d51] hover:bg-[#994d51]/90 text-white px-6 py-2 rounded-md text-sm font-medium"
                  >
                    Crea Prima Entità
                  </button>
                </div>
              ) : (
                entities.map((entity) => (
                  <div key={entity.id} className="bg-white rounded-lg shadow-sm p-6 border border-[#994d51]/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-[#1b0e0e]">{entity.name}</h2>
                        <p className="text-sm text-[#5f5252] capitalize">
                          {entity.tipologia} {entity.altro_tipologia && `- ${entity.altro_tipologia}`}
                          {entity.numero_abitanti && entity.numero_abitanti > 0 && ` • ${entity.numero_abitanti.toLocaleString()} abitanti`}
                        </p>
                        {isAdmin() && (
                          <p className="text-xs text-[#5f5252]/60 mt-1">
                            ID: {entity.id} • Proprietario: {entity.user_id}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEntityToDelete({ id: entity.id, name: entity.name })}
                          className="text-red-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium border border-red-200 hover:bg-red-50"
                          title="Elimina ente e tutti i suoi dati"
                        >
                          🗑️ Elimina Ente
                        </button>
                        <button
                          onClick={() => setShowNewYearForm(entity.id)}
                          className="bg-[#1b0e0e] hover:bg-[#1b0e0e]/90 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          + Aggiungi Anno
                        </button>
                      </div>
                    </div>

                    {/* Anni disponibili */}
                    <div>
                      <h3 className="text-sm font-medium text-[#1b0e0e] mb-3">Anni Disponibili:</h3>
                      {entityYears[entity.id]?.length === 0 ? (
                        <p className="text-sm text-[#5f5252] italic">Nessun anno configurato</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {entityYears[entity.id]?.sort((a, b) => b - a).map((year) => (
                            <div key={year} className="bg-[#fcf8f8] border border-[#994d51]/20 rounded-md p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-bold text-[#994d51]">{year}</span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setYearToDuplicate({ entityId: entity.id, entityName: entity.name, fromYear: year })}
                                    className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded text-xs font-medium"
                                    title="Duplica anno"
                                  >
                                    📋 Duplica
                                  </button>
                                  <button
                                    onClick={() => setYearToDelete({ entityId: entity.id, entityName: entity.name, year })}
                                    className="text-red-600 hover:text-red-800 px-2 py-1 rounded text-xs font-medium"
                                    title="Elimina anno"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  console.log('🔍 CLICK: Entity selected:', { 
                                    entityName: entity.name, 
                                    entityId: entity.id, 
                                    year,
                                    tipologia: entity.tipologia,
                                    numeroAbitanti: entity.numero_abitanti
                                  });
                                  onEntityYearSelected(entity.id, year);
                                }}
                                className="w-full bg-[#994d51] hover:bg-[#994d51]/90 text-white rounded px-3 py-2 text-sm font-medium transition-colors"
                              >
                                Apri Anno {year}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Form per nuovo anno */}
                    {showNewYearForm === entity.id && (
                      <div className="mt-4 p-4 bg-[#fcf8f8] rounded-md border border-[#994d51]/10">
                        <h4 className="text-sm font-medium text-[#1b0e0e] mb-3">Aggiungi Nuovo Anno</h4>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            value={newYear}
                            onChange={(e) => setNewYear(parseInt(e.target.value))}
                            min={2020}
                            max={2030}
                            className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                          />
                          <button
                            onClick={() => handleCreateYear(entity.id)}
                            className="bg-[#994d51] hover:bg-[#994d51]/90 text-white px-4 py-2 rounded-md text-sm font-medium"
                          >
                            Crea
                          </button>
                          <button
                            onClick={() => setShowNewYearForm(null)}
                            className="text-[#5f5252] hover:text-[#1b0e0e] px-3 py-1 text-sm"
                          >
                            Annulla
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Modal per nuova entità */}
        {showNewEntityForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 border-2 border-[#994d51]/20">
              <h2 className="text-lg font-semibold text-[#1b0e0e] mb-4">Nuova Entità</h2>
              
              <form onSubmit={handleCreateEntity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                    Nome Entità
                  </label>
                  <input
                    type="text"
                    required
                    value={newEntityData.name}
                    onChange={(e) => setNewEntityData({ ...newEntityData, name: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                    placeholder="es. Comune di Milano"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                    Tipologia
                  </label>
                  <select
                    value={newEntityData.tipologia}
                    onChange={(e) => setNewEntityData({ ...newEntityData, tipologia: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                  >
                    <option value="comune">Comune</option>
                    <option value="provincia">Provincia</option>
                    <option value="regione">Regione</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>

                {newEntityData.tipologia === 'altro' && (
                  <div>
                    <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                      Specifica Tipologia
                    </label>
                    <input
                      type="text"
                      value={newEntityData.altroTipologia}
                      onChange={(e) => setNewEntityData({ ...newEntityData, altroTipologia: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                      placeholder="es. ASL, Università, etc."
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                    Numero Abitanti (opzionale)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newEntityData.numeroAbitanti}
                    onChange={(e) => setNewEntityData({ ...newEntityData, numeroAbitanti: parseInt(e.target.value) || 0 })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewEntityForm(false)}
                    className="px-4 py-2 text-sm font-medium text-[#1b0e0e] bg-gray-200 hover:bg-gray-300 rounded-md"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-[#994d51] hover:bg-[#994d51]/90 rounded-md"
                  >
                    Crea Entità
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Modal Conferma Eliminazione */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#1b0e0e] mb-4">Conferma Eliminazione</h3>
            <p className="text-[#5f5252] mb-6">
              Sei sicuro di voler eliminare l'utente <strong>{userToDelete.email}</strong>?<br/>
              <span className="text-red-600 text-sm">Questa azione eliminerà anche tutti gli enti e i dati associati e non può essere annullata.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setUserToDelete(null)}
                disabled={adminLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={adminLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {adminLoading ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#1b0e0e] mb-4">Reset Password</h3>
            <p className="text-[#5f5252] mb-4">
              Inserisci la nuova password per l'utente
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                Nuova Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                placeholder="Minimo 6 caratteri"
                minLength={6}
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPasswordReset(false);
                  setNewPassword('');
                  setSelectedUserId(null);
                }}
                disabled={adminLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleResetPassword}
                disabled={adminLoading || newPassword.length < 6}
                className="px-4 py-2 bg-[#994d51] hover:bg-[#994d51]/90 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {adminLoading ? 'Aggiornamento...' : 'Aggiorna Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione Ente */}
      {entityToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#1b0e0e] mb-4">Conferma Eliminazione Ente</h3>
            <p className="text-[#5f5252] mb-6">
              Sei sicuro di voler eliminare l'ente <strong>{entityToDelete.name}</strong>?<br/>
              <span className="text-red-600 text-sm font-medium">Questa azione eliminerà anche tutti gli anni e i dati associati e non può essere annullata.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEntityToDelete(null)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDeleteEntity}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Eliminazione...' : 'Elimina Ente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione Anno */}
      {yearToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#1b0e0e] mb-4">Conferma Eliminazione Anno</h3>
            <p className="text-[#5f5252] mb-6">
              Sei sicuro di voler eliminare l'anno <strong>{yearToDelete.year}</strong> di <strong>{yearToDelete.entityName}</strong>?<br/>
              <span className="text-red-600 text-sm font-medium">Questa azione eliminerà tutti i dati associati a questo anno e non può essere annullata.</span>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setYearToDelete(null)}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDeleteYear}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Eliminazione...' : 'Elimina Anno'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Duplica Anno */}
      {yearToDuplicate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-[#1b0e0e] mb-4">Duplica Anno</h3>
            <p className="text-[#5f5252] mb-4">
              Stai per duplicare i dati dell'anno <strong>{yearToDuplicate.fromYear}</strong> di <strong>{yearToDuplicate.entityName}</strong> in un nuovo anno.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#1b0e0e] mb-1">
                Anno di Destinazione
              </label>
              <input
                type="number"
                value={duplicateToYear}
                onChange={(e) => setDuplicateToYear(parseInt(e.target.value))}
                min={2020}
                max={2035}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#994d51] focus:ring-[#994d51] sm:text-sm"
                autoFocus
              />
              <p className="text-xs text-[#5f5252] mt-1">
                I dati di {yearToDuplicate.fromYear} verranno copiati nell'anno {duplicateToYear}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setYearToDuplicate(null);
                  setDuplicateToYear(new Date().getFullYear() + 1);
                }}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={handleDuplicateYear}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? 'Duplicazione...' : 'Duplica Anno'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
