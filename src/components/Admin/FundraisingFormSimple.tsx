import React from 'react';
import { useNavigate } from 'react-router-dom';

const FundraisingFormSimple: React.FC = () => {
  const navigate = useNavigate();
  
  console.log('🚀 FundraisingFormSimple component loaded!');
  
  React.useEffect(() => {
    console.log('🎯 FundraisingFormSimple mounted successfully');
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Ça marche ! Formulaire de Fundraising
        </h1>
        <p className="text-gray-600 mb-6">
          Le routing fonctionne correctement. Vous êtes maintenant sur la page de création d'opportunité de fundraising.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-green-800 font-semibold">✅ Route fonctionnelle</h3>
            <p className="text-green-700 text-sm">
              La route /admin/fundraising/new fonctionne maintenant !
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-blue-800 font-semibold">📋 Prochaines étapes</h3>
            <p className="text-blue-700 text-sm">
              Nous pouvons maintenant activer le formulaire complet.
            </p>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => navigate('/admin/fundraising')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Retour à la liste
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={() => alert('Le formulaire complet sera activé après ce test !')}
          >
            Test réussi ! 🎉
          </button>
        </div>
      </div>
    </div>
  );
};

export default FundraisingFormSimple;